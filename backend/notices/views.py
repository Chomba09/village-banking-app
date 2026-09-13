from rest_framework import generics, permissions
from .models import Notice
from .serializers import NoticeSerializer, NoticeCreateSerializer


class IsTreasurer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'treasurer'


class NoticeCreateView(generics.CreateAPIView):
    serializer_class = NoticeCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]


class GroupNoticeListView(generics.ListAPIView):
    serializer_class = NoticeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group_id = self.kwargs['group_id']
        return Notice.objects.filter(
            group__id=group_id,
            group__memberships__user=self.request.user
        ).distinct()