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


class IsTreasurer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'treasurer'


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
        return Group.objects.filter(memberships__user=self.request.user)


class JoinGroupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, token):
        try:
            group = Group.objects.get(invite_token=token)
        except Group.DoesNotExist:
            return Response(
                {'error': 'Invalid invite link.'},
                status=status.HTTP_404_NOT_FOUND
            )

        from django.utils import timezone
        cycle = group.active_cycle
        if cycle and timezone.now().date() > cycle.member_admission_deadline:
            return Response(
                {
                    'error': f'The admission deadline for this group has passed. '
                             f'No new members can join after '
                             f'{cycle.member_admission_deadline}.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        membership, created = Membership.objects.get_or_create(
            user=request.user,
            group=group
        )

        if created:
            send_notification(
                request.user,
                f'Welcome! You have successfully joined {group.name}.'
            )
            send_notification(
                group.treasurer,
                f'{request.user.username} has joined {group.name}.'
            )
            return Response(
                {'message': f'You have joined {group.name} successfully.'},
                status=status.HTTP_200_OK
            )
        return Response(
            {'message': 'You are already a member of this group.'},
            status=status.HTTP_200_OK
        )


class GroupMembersView(generics.ListAPIView):
    serializer_class = MemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group_id = self.kwargs['group_id']
        return Membership.objects.filter(
            group__id=group_id,
            group__memberships__user=self.request.user
        ).select_related('user')


class NewCycleView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id, treasurer=request.user)
        except Group.DoesNotExist:
            return Response(
                {'error': 'Group not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = NewCycleSerializer(
            data=request.data,
            context={'group': group}
        )
        if serializer.is_valid():
            cycle = serializer.save()
            members = Membership.objects.filter(group=group, status='active')
            for membership in members:
                send_notification(
                    membership.user,
                    f'A new cycle "{cycle.cycle_name}" has started in {group.name}. '
                    f'Start date: {cycle.start_date}, End date: {cycle.end_date}.'
                )
            return Response(
                NewCycleSerializer(cycle).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MemberStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def patch(self, request, group_id, membership_id):
        try:
            group = Group.objects.get(id=group_id, treasurer=request.user)
            membership = Membership.objects.get(id=membership_id, group=group)
        except (Group.DoesNotExist, Membership.DoesNotExist):
            return Response(
                {'error': 'Not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get('status')
        if new_status not in ['active', 'inactive']:
            return Response(
                {'error': 'Invalid status.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        membership.status = new_status
        membership.save()

        if new_status == 'inactive':
            send_notification(
                membership.user,
                f'You have been marked as inactive in {group.name} by the treasurer.'
            )

        return Response(
            {'message': f'Member status updated to {new_status}.'},
            status=status.HTTP_200_OK
        )


class RemoveMemberView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def delete(self, request, group_id, membership_id):
        try:
            group = Group.objects.get(id=group_id, treasurer=request.user)
            membership = Membership.objects.get(
                id=membership_id,
                group=group,
                status='inactive'
            )
        except (Group.DoesNotExist, Membership.DoesNotExist):
            return Response(
                {'error': 'Member not found or must be inactive before removal.'},
                status=status.HTTP_404_NOT_FOUND
            )

        send_notification(
            membership.user,
            f'You have been removed from {group.name}.'
        )
        membership.delete()

        return Response(
            {'message': 'Member removed successfully.'},
            status=status.HTTP_200_OK
        )


class ArchiveGroupView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def post(self, request, group_id):
        try:
            group = Group.objects.get(
                id=group_id,
                treasurer=request.user,
                is_archived=False
            )
        except Group.DoesNotExist:
            return Response(
                {'error': 'Group not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        members = Membership.objects.filter(
            group=group,
            status='active'
        ).exclude(user=request.user)

        for membership in members:
            send_notification(
                membership.user,
                f'The group "{group.name}" has been closed by the treasurer. '
                f'All records have been archived for future reference.'
            )

        group.is_archived = True
        group.archived_at = timezone.now()
        group.save()

        return Response(
            {'message': f'{group.name} has been archived successfully.'},
            status=status.HTTP_200_OK
        )

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
            return Response(
                {'error': 'Group not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        cycle = group.active_cycle
        if not cycle:
            return Response(
                {'error': 'No active cycle found for this group.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from contributions.models import Contribution
        from loans.models import Loan
        from django.db.models import Sum
        from decimal import Decimal

        total_savings = Contribution.objects.filter(
            group=group,
            status='confirmed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        max_loan_percentage = cycle.max_loan_percentage
        total_pool = (
            total_savings * max_loan_percentage / Decimal('100')
        ).quantize(Decimal('0.01'))

        outstanding_loans = Decimal('0.00')
        approved_loans = Loan.objects.filter(group=group, status='approved')
        for loan in approved_loans:
            if loan.balance_remaining > 0:
                outstanding_loans += loan.balance_remaining

        available_amount = max(
            total_pool - outstanding_loans, Decimal('0.00')
        )

        return Response({
            'total_savings': total_savings,
            'max_loan_percentage': max_loan_percentage,
            'total_pool': total_pool,
            'outstanding_loans': outstanding_loans,
            'available_amount': available_amount,
        })

   