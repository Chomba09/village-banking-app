from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Loan, LoanRepayment
from .serializers import (
    LoanSerializer,
    LoanCreateSerializer,
    LoanStatusSerializer,
    LoanRepaymentSerializer
)
from notifications.utils import send_notification
from transactions.models import Transaction


class IsTreasurer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'treasurer'


class IsChairperson(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'chairperson'


def _maybe_finalise_loan(loan):
    """
    Fully approve a loan only when the required approvals are in place.

    Rules:
      - Treasurer's own loan  → chairperson must approve; treasurer cannot approve their own.
      - Chairperson's own loan → treasurer must approve; chairperson cannot approve their own.
      - Member loan            → both treasurer AND chairperson must approve
                                 (if each role exists in the group).

    Returns True if the loan was finalised this call.
    """
    group = loan.group
    submitted_by = loan.member

    is_treasurer_loan = group.treasurer is not None and submitted_by == group.treasurer
    is_chairperson_loan = group.chairperson is not None and submitted_by == group.chairperson

    if is_treasurer_loan:
        # Only chairperson approval needed
        treasurer_done = True
        chairperson_done = loan.chairperson_approved or group.chairperson is None
    elif is_chairperson_loan:
        # Only treasurer approval needed
        treasurer_done = loan.treasurer_approved or group.treasurer is None
        chairperson_done = True
    else:
        # Regular member loan — both roles must sign off if they exist
        treasurer_done = loan.treasurer_approved or group.treasurer is None
        chairperson_done = loan.chairperson_approved or group.chairperson is None

    if treasurer_done and chairperson_done:
        from django.utils import timezone as tz
        cycle = group.active_cycle
        loan.status = 'approved'
        loan.interest_rate = loan.interest_rate or group.interest_rate
        if cycle:
            loan.due_date = cycle.end_date
        loan.approved_at = tz.now()
        loan.save()

        Transaction.objects.create(
            member=loan.member,
            group=loan.group,
            transaction_type='loan_disbursement',
            amount=loan.amount,
            status='approved',
            note='Loan approved — dual approval complete'
        )
        send_notification(
            loan.member,
            f'Your loan of K{loan.amount} from {loan.group.name} has been fully approved. '
            f'Interest rate: {loan.interest_rate}%. Total due: K{loan.total_due}.'
        )
        return True
    return False


class LoanApplyView(generics.CreateAPIView):
    serializer_class = LoanCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        loan = serializer.save()

        group = loan.group
        applicant = request.user

        if loan.submitted_by_treasurer:
            # Treasurer's own loan — needs chairperson approval only.
            # Treasurer is implicitly considered to have approved their own request,
            # so mark that flag so _maybe_finalise_loan can skip them.
            loan.treasurer_approved = True
            loan.save()

            # Notify chairperson they need to act
            if group.chairperson:
                send_notification(
                    group.chairperson,
                    f'The treasurer has applied for a loan of K{loan.amount} from {group.name}. '
                    f'Your approval is required to release the funds.'
                )
            # Notify other members for transparency
            from groups.models import Membership
            members = Membership.objects.filter(
                group=group, status='active'
            ).exclude(user=applicant)
            for membership in members:
                send_notification(
                    membership.user,
                    f'The treasurer has applied for a loan of K{loan.amount} from {group.name}. '
                    f'Awaiting chairperson approval.'
                )

        elif applicant == group.chairperson:
            # Chairperson's own loan — needs treasurer approval only.
            # Mark chairperson as having implicitly approved their own request.
            loan.chairperson_approved = True
            loan.save()

            # Notify treasurer they need to act
            if group.treasurer:
                send_notification(
                    group.treasurer,
                    f'The chairperson has applied for a loan of K{loan.amount} from {group.name}. '
                    f'Your approval is required to release the funds.'
                )

        else:
            # Regular member loan — notify both treasurer and chairperson
            if group.treasurer:
                send_notification(
                    group.treasurer,
                    f'{applicant.username} has applied for a loan of K{loan.amount} from {group.name}.'
                )
            if group.chairperson and group.chairperson != applicant:
                send_notification(
                    group.chairperson,
                    f'{applicant.username} has applied for a loan of K{loan.amount} from {group.name}. '
                    f'Your approval will be required after the treasurer approves.'
                )

        response_serializer = LoanSerializer(loan)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


class MemberLoanListView(generics.ListAPIView):
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Loan.objects.filter(
            member=self.request.user
        ).order_by('-applied_at')


class GroupLoanListView(generics.ListAPIView):
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def get_queryset(self):
        group_id = self.kwargs['group_id']
        return Loan.objects.filter(
            group__id=group_id,
            group__treasurer=self.request.user
        ).order_by('-applied_at')


class LoanStatusUpdateView(generics.UpdateAPIView):
    """
    Treasurer marks their approval or rejection on a loan.
    The treasurer cannot act on their own loan application.
    """
    serializer_class = LoanStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def get_queryset(self):
        # Exclude loans the treasurer themselves applied for
        return Loan.objects.filter(
            group__treasurer=self.request.user
        ).exclude(
            member=self.request.user
        )

    def perform_update(self, serializer):
        loan = serializer.instance
        requested_status = serializer.validated_data.get('status')

        if requested_status == 'rejected':
            loan.status = 'rejected'
            loan.save()
            send_notification(
                loan.member,
                f'Your loan application of K{loan.amount} from {loan.group.name} has been rejected by the treasurer.'
            )
            return

        if requested_status == 'approved':
            group = loan.group
            cycle = group.active_cycle
            if not cycle:
                return

            loan.treasurer_approved = True
            loan.interest_rate = group.interest_rate
            loan.save()

            finalised = _maybe_finalise_loan(loan)

            if not finalised:
                # Waiting for chairperson — notify them
                if group.chairperson:
                    send_notification(
                        group.chairperson,
                        f'The treasurer has approved {loan.member.username}\'s loan of K{loan.amount} '
                        f'from {group.name}. Your approval is now required to release the funds.'
                    )
                # Let the member know it's partially approved
                send_notification(
                    loan.member,
                    f'The treasurer has approved your loan of K{loan.amount} from {group.name}. '
                    f'It is now awaiting the chairperson\'s approval.'
                )


class ChairpersonPendingLoansView(generics.ListAPIView):
    """
    Returns loans the chairperson needs to act on:
      - Treasurer's own loan applications (treasurer_approved=True, chairperson hasn't approved)
      - Regular member loans where the treasurer has already approved
    The chairperson never sees their own loan here.
    """
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated, IsChairperson]

    def get_queryset(self):
        return Loan.objects.filter(
            group__chairperson=self.request.user,
            status='pending',
            treasurer_approved=True,
            chairperson_approved=False,
        ).exclude(
            member=self.request.user
        ).order_by('-applied_at')


class ChairpersonLoanApprovalView(APIView):
    """
    Chairperson approves or rejects a loan.
    Covers both regular member loans (treasurer already approved)
    and the treasurer's own loan applications.
    """
    permission_classes = [permissions.IsAuthenticated, IsChairperson]

    def patch(self, request, pk):
        action = request.data.get('action')
        if action not in ('approve', 'reject'):
            return Response(
                {'error': 'action must be "approve" or "reject"'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            loan = Loan.objects.get(
                pk=pk,
                group__chairperson=request.user,
                status='pending',
                treasurer_approved=True,
            )
        except Loan.DoesNotExist:
            return Response(
                {'error': 'Loan not found or not ready for chairperson approval.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if loan.member == request.user:
            return Response(
                {'error': 'You cannot approve your own loan.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if action == 'approve':
            loan.chairperson_approved = True
            loan.save()
            _maybe_finalise_loan(loan)

            # Notify treasurer of chairperson's decision
            if loan.group.treasurer:
                send_notification(
                    loan.group.treasurer,
                    f'Chairperson has approved {loan.member.username}\'s loan of K{loan.amount} '
                    f'in {loan.group.name}. Funds are now released.'
                )
        else:
            loan.status = 'rejected'
            loan.save()
            send_notification(
                loan.member,
                f'Your loan application of K{loan.amount} from {loan.group.name} '
                f'has been rejected by the chairperson.'
            )
            if loan.group.treasurer:
                send_notification(
                    loan.group.treasurer,
                    f'Chairperson has rejected {loan.member.username}\'s loan of K{loan.amount} '
                    f'in {loan.group.name}.'
                )

        return Response(LoanSerializer(loan).data)


class LoanRepaymentView(generics.CreateAPIView):
    serializer_class = LoanRepaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        repayment = serializer.save()
        Transaction.objects.create(
            member=repayment.loan.member,
            group=repayment.loan.group,
            transaction_type='loan_repayment',
            amount=repayment.amount,
            status='approved',
            note=f'Repayment for loan #{repayment.loan.id}'
        )
        send_notification(
            repayment.loan.member,
            f'Your repayment of K{repayment.amount} for loan #{repayment.loan.id} has been recorded. '
            f'Remaining balance: K{repayment.loan.balance_remaining}.'
        )


class LoanDetailView(generics.RetrieveAPIView):
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Loan.objects.filter(member=self.request.user)


class GroupLoanActivityView(generics.ListAPIView):
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group_id = self.kwargs['group_id']
        return Loan.objects.filter(
            group__id=group_id,
            group__memberships__user=self.request.user,
            group__memberships__status='active'
        ).distinct().order_by('-applied_at')
