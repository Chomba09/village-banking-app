from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Transaction, MemberAccount
from .serializers import (
    TransactionSerializer,
    DepositWithdrawalSerializer,
    MemberAccountSerializer,
    WithdrawalApprovalSerializer
)
from groups.models import Group


class IsTreasurer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'treasurer'


class DepositWithdrawalView(generics.CreateAPIView):
    serializer_class = DepositWithdrawalSerializer
    permission_classes = [permissions.IsAuthenticated]


class MemberTransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Transaction.objects.filter(member=self.request.user)
        group_id = self.request.query_params.get('group')
        transaction_type = self.request.query_params.get('type')
        if group_id:
            queryset = queryset.filter(group__id=group_id)
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        return queryset


class GroupTransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def get_queryset(self):
        group_id = self.kwargs['group_id']
        return Transaction.objects.filter(
            group__id=group_id,
            group__treasurer=self.request.user
        )


class MemberAccountView(generics.RetrieveAPIView):
    serializer_class = MemberAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        group_id = self.kwargs['group_id']
        account, _ = MemberAccount.objects.get_or_create(
            member=self.request.user,
            group_id=group_id
        )
        return account


class PendingWithdrawalListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def get_queryset(self):
        return Transaction.objects.filter(
            transaction_type='withdrawal',
            status='pending',
            group__treasurer=self.request.user
        )


class WithdrawalApprovalView(generics.UpdateAPIView):
    serializer_class = WithdrawalApprovalSerializer
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def get_queryset(self):
        return Transaction.objects.filter(
            transaction_type='withdrawal',
            group__treasurer=self.request.user
        )