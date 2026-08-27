from rest_framework import generics, permissions, status
from rest_framework.response import Response
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


class LoanApplyView(generics.CreateAPIView):
    serializer_class = LoanCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        loan = serializer.save()
        response_serializer = LoanSerializer(loan)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


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
    serializer_class = LoanStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def get_queryset(self):
        return Loan.objects.filter(
            group__treasurer=self.request.user
        )

    def perform_update(self, serializer):
        loan = serializer.save()
        if loan.status == 'approved':
            Transaction.objects.create(
                member=loan.member,
                group=loan.group,
                transaction_type='loan_disbursement',
                amount=loan.amount,
                status='approved',
                note=f'Loan approved by treasurer'
            )
            send_notification(
                loan.member,
                f'Your loan of K{loan.amount} from {loan.group.name} has been approved. Interest rate: {loan.interest_rate}%. Total due: K{loan.total_due}.'
            )
        elif loan.status == 'rejected':
            send_notification(
                loan.member,
                f'Your loan application of K{loan.amount} from {loan.group.name} has been rejected.'
            )


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
            f'Your repayment of K{repayment.amount} for loan #{repayment.loan.id} has been recorded. Remaining balance: K{repayment.loan.balance_remaining}.'
        )


class LoanDetailView(generics.RetrieveAPIView):
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Loan.objects.filter(member=self.request.user)