from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Contribution
from .serializers import (
    ContributionSerializer,
    ContributionCreateSerializer,
    ContributionStatusSerializer
)
from groups.models import Group
from notifications.utils import send_notification
from transactions.models import Transaction


class IsTreasurer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'treasurer'


class ContributionCreateView(generics.CreateAPIView):
    serializer_class = ContributionCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contribution = serializer.save()
        response_serializer = ContributionSerializer(contribution)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class MemberContributionListView(generics.ListAPIView):
    serializer_class = ContributionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Contribution.objects.filter(
            member=self.request.user
        ).order_by('-created_at')


class GroupContributionListView(generics.ListAPIView):
    serializer_class = ContributionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def get_queryset(self):
        group_id = self.kwargs['group_id']
        return Contribution.objects.filter(
            group__id=group_id,
            group__treasurer=self.request.user
        ).order_by('-created_at')


class ContributionStatusUpdateView(generics.UpdateAPIView):
    serializer_class = ContributionStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def get_queryset(self):
        return Contribution.objects.filter(
            group__treasurer=self.request.user
        )

    def perform_update(self, serializer):
        contribution = serializer.save()
        if contribution.status == 'confirmed':
            Transaction.objects.create(
                member=contribution.member,
                group=contribution.group,
                transaction_type='contribution',
                amount=contribution.amount,
                status='approved',
                note=f'Contribution confirmed by treasurer'
            )
            send_notification(
                contribution.member,
                f'Your contribution of K{contribution.amount} to {contribution.group.name} has been confirmed.'
            )
        elif contribution.status == 'rejected':
            send_notification(
                contribution.member,
                f'Your contribution of K{contribution.amount} to {contribution.group.name} has been rejected.'
            )