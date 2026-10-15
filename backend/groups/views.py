from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Group, Membership, Cycle
from .serializers import (
    GroupSerializer,
    GroupCreateSerializer,
    MemberSerializer,
    NewCycleSerializer
)
from django.contrib.auth import get_user_model
from notifications.utils import send_notification
from django.utils import timezone

User = get_user_model()


# ---------------------------------------------------------------------------
# Permission helpers
# ---------------------------------------------------------------------------

class IsTreasurer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'treasurer'


class IsChairperson(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'chairperson'


class IsTreasurerOrChairperson(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('treasurer', 'chairperson')


# ---------------------------------------------------------------------------
# Group CRUD
# ---------------------------------------------------------------------------

class GroupCreateView(generics.CreateAPIView):
    serializer_class = GroupCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = serializer.save()
        response_serializer = GroupSerializer(group, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class GroupDetailView(generics.RetrieveAPIView):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Group.objects.filter(memberships__user=self.request.user)


class GroupListView(generics.ListAPIView):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Group.objects.filter(memberships__user=self.request.user, is_archived=False)


# ---------------------------------------------------------------------------
# Join group
# ---------------------------------------------------------------------------

class JoinGroupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, token):
        try:
            group = Group.objects.get(invite_token=token)
        except Group.DoesNotExist:
            return Response({'error': 'Invalid invite link.'}, status=status.HTTP_404_NOT_FOUND)

        cycle = group.active_cycle
        if cycle and timezone.now().date() > cycle.member_admission_deadline:
            return Response(
                {'error': f'The admission deadline for this group has passed. '
                          f'No new members can join after {cycle.member_admission_deadline}.'},
                status=status.HTTP_403_FORBIDDEN
            )

        already_member = Membership.objects.filter(user=request.user, group=group).exists()
        return Response({
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'treasurer': group.treasurer.username,
            'member_count': group.memberships.count(),
            'maximum_members': group.maximum_members,
            'minimum_contribution': str(group.minimum_contribution),
            'interest_rate': str(group.interest_rate),
            'cycle_end_date': str(cycle.end_date) if cycle else None,
            'already_member': already_member,
        }, status=status.HTTP_200_OK)

    def post(self, request, token):
        try:
            group = Group.objects.get(invite_token=token)
        except Group.DoesNotExist:
            return Response({'error': 'Invalid invite link.'}, status=status.HTTP_404_NOT_FOUND)

        cycle = group.active_cycle
        if cycle and timezone.now().date() > cycle.member_admission_deadline:
            return Response(
                {'error': 'The admission deadline for this group has passed.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if group.maximum_members and group.memberships.count() >= group.maximum_members:
            return Response(
                {'error': 'This group has reached its maximum number of members.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        membership, created = Membership.objects.get_or_create(user=request.user, group=group)
        if created:
            send_notification(request.user, f'Welcome! You have successfully joined {group.name}.')
            send_notification(group.treasurer, f'{request.user.username} has joined {group.name}.')
            return Response({'message': f'You have joined {group.name} successfully.'}, status=status.HTTP_200_OK)
        return Response({'message': 'You are already a member of this group.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Group members list (any member)
# ---------------------------------------------------------------------------

class GroupMembersView(generics.ListAPIView):
    serializer_class = MemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group_id = self.kwargs['group_id']
        return Membership.objects.filter(
            group__id=group_id,
            group__memberships__user=self.request.user
        ).select_related('user')


# ---------------------------------------------------------------------------
# Cycle management (treasurer only)
# ---------------------------------------------------------------------------

class NewCycleView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id, treasurer=request.user)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = NewCycleSerializer(data=request.data, context={'group': group})
        if serializer.is_valid():
            cycle = serializer.save()
            for m in Membership.objects.filter(group=group, status='active'):
                send_notification(
                    m.user,
                    f'A new cycle "{cycle.cycle_name}" has started in {group.name}. '
                    f'Start date: {cycle.start_date}, End date: {cycle.end_date}.'
                )
            return Response(NewCycleSerializer(cycle).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Member status (mark inactive / reactivate) — treasurer OR chairperson
# ---------------------------------------------------------------------------

class MemberStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTreasurerOrChairperson]

    def patch(self, request, group_id, membership_id):
        user = request.user

        # Treasurer: must own the group
        # Chairperson: must chair the group
        if user.role == 'treasurer':
            group_qs = Group.objects.filter(id=group_id, treasurer=user)
        else:
            group_qs = Group.objects.filter(id=group_id, chairperson=user)

        try:
            group = group_qs.get()
            membership = Membership.objects.get(id=membership_id, group=group)
        except (Group.DoesNotExist, Membership.DoesNotExist):
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Neither treasurer nor chairperson may deactivate the other
        if membership.user_id == group.treasurer_id:
            return Response(
                {'error': 'The treasurer cannot be made inactive.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if group.chairperson_id and membership.user_id == group.chairperson_id and user.role != 'treasurer':
            return Response(
                {'error': 'Only the treasurer can change the chairperson\'s status.'},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('status')
        if new_status not in ['active', 'inactive']:
            return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)

        membership.status = new_status
        membership.save()

        if new_status == 'inactive':
            actor = 'the treasurer' if user.role == 'treasurer' else 'the chairperson'
            send_notification(
                membership.user,
                f'You have been marked as inactive in {group.name} by {actor}.'
            )

        return Response({'message': f'Member status updated to {new_status}.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Remove member — treasurer OR chairperson
# ---------------------------------------------------------------------------

class RemoveMemberView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTreasurerOrChairperson]

    def delete(self, request, group_id, membership_id):
        user = request.user

        if user.role == 'treasurer':
            group_qs = Group.objects.filter(id=group_id, treasurer=user)
        else:
            group_qs = Group.objects.filter(id=group_id, chairperson=user)

        try:
            group = group_qs.get()
            membership = Membership.objects.get(id=membership_id, group=group, status='inactive')
        except (Group.DoesNotExist, Membership.DoesNotExist):
            return Response(
                {'error': 'Member not found or must be inactive before removal.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Chairperson cannot remove the treasurer
        if user.role == 'chairperson' and membership.user_id == group.treasurer_id:
            return Response(
                {'error': 'Chairperson cannot remove the treasurer.'},
                status=status.HTTP_403_FORBIDDEN
            )

        send_notification(membership.user, f'You have been removed from {group.name}.')
        membership.delete()
        return Response({'message': 'Member removed successfully.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Archive group (treasurer only — chairperson explicitly excluded)
# ---------------------------------------------------------------------------

class ArchiveGroupView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id, treasurer=request.user, is_archived=False)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        for m in Membership.objects.filter(group=group, status='active').exclude(user=request.user):
            send_notification(
                m.user,
                f'The group "{group.name}" has been closed by the treasurer. '
                f'All records have been archived for future reference.'
            )

        group.is_archived = True
        group.archived_at = timezone.now()
        group.save()
        return Response({'message': f'{group.name} has been archived successfully.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Assign chairperson (treasurer only)
# ---------------------------------------------------------------------------

class AssignChairpersonView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id, treasurer=request.user)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        member_user_id = request.data.get('user_id')
        if not member_user_id:
            return Response({'error': 'user_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            membership = Membership.objects.get(group=group, user_id=member_user_id, status='active')
        except Membership.DoesNotExist:
            return Response(
                {'error': 'User is not an active member of this group.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_chairperson = membership.user

        # Treasurer cannot make themselves the chairperson
        if new_chairperson.id == request.user.id:
            return Response(
                {'error': 'The treasurer cannot be their own chairperson.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Strip chairperson role from previous holder (if any)
        previous_chairperson = group.chairperson
        if previous_chairperson and previous_chairperson.id != new_chairperson.id:
            previous_chairperson.role = 'member'
            previous_chairperson.save()
            send_notification(
                previous_chairperson,
                f'You have been removed as chairperson of {group.name}.'
            )

        # Assign new chairperson
        new_chairperson.role = 'chairperson'
        new_chairperson.save()

        group.chairperson = new_chairperson
        group.save()

        send_notification(
            new_chairperson,
            f'You have been appointed as the chairperson of {group.name}. '
            f'You are now responsible for approving loans in this group.'
        )

        return Response({
            'message': f'{new_chairperson.username} is now the chairperson of {group.name}.',
            'chairperson_id': new_chairperson.id,
            'chairperson_username': new_chairperson.username,
        }, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Remove chairperson (treasurer only)
# ---------------------------------------------------------------------------

class RemoveChairpersonView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id, treasurer=request.user)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not group.chairperson:
            return Response({'error': 'This group has no chairperson.'}, status=status.HTTP_400_BAD_REQUEST)

        former = group.chairperson
        former.role = 'member'
        former.save()

        group.chairperson = None
        group.save()

        send_notification(former, f'You are no longer the chairperson of {group.name}.')

        return Response({'message': f'{former.username} is no longer the chairperson.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Loan availability (any member)
# ---------------------------------------------------------------------------

class LoanAvailabilityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, group_id):
        try:
            group = Group.objects.get(
                id=group_id,
                memberships__user=request.user,
                is_archived=False
            )
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        cycle = group.active_cycle
        if not cycle:
            return Response({'error': 'No active cycle found for this group.'}, status=status.HTTP_400_BAD_REQUEST)

        from contributions.models import Contribution
        from loans.models import Loan
        from django.db.models import Sum
        from decimal import Decimal

        total_savings = Contribution.objects.filter(
            group=group, status='confirmed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        max_loan_percentage = cycle.max_loan_percentage
        total_pool = (total_savings * max_loan_percentage / Decimal('100')).quantize(Decimal('0.01'))

        outstanding_loans = Decimal('0.00')
        for loan in Loan.objects.filter(group=group, status='approved'):
            if loan.balance_remaining > 0:
                outstanding_loans += loan.balance_remaining

        available_amount = max(total_pool - outstanding_loans, Decimal('0.00'))

        return Response({
            'total_savings': total_savings,
            'max_loan_percentage': max_loan_percentage,
            'total_pool': total_pool,
            'outstanding_loans': outstanding_loans,
            'available_amount': available_amount,
            'has_chairperson': group.chairperson is not None,  # required for loan applications
        })


# ---------------------------------------------------------------------------
# Archived groups list (treasurer only)
# ---------------------------------------------------------------------------

class ArchivedGroupListView(generics.ListAPIView):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def get_queryset(self):
        return Group.objects.filter(treasurer=self.request.user, is_archived=True)
