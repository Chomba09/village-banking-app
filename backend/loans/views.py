from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Loan, LoanRepayment
from .serializers import (
    LoanSerializer,
    LoanCreateSerializer,
    LoanStatusSerializer,
    LoanRepaymentSerializer
)


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


class LoanRepaymentView(generics.CreateAPIView):
    serializer_class = LoanRepaymentSerializer
    permission_classes = [permissions.IsAuthenticated]


class LoanDetailView(generics.RetrieveAPIView):
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Loan.objects.filter(member=self.request.user)