from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Contribution
from .serializers import (
    ContributionSerializer,
    ContributionCreateSerializer,
    ContributionStatusSerializer
)
from groups.models import Group


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