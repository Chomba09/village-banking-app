from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Group, Membership
from .serializers import GroupSerializer, GroupCreateSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class IsTreasurer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'treasurer'


class GroupCreateView(generics.CreateAPIView):
    serializer_class = GroupCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsTreasurer]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return GroupCreateSerializer
        return GroupSerializer

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

        membership, created = Membership.objects.get_or_create(
            user=request.user,
            group=group
        )

        if created:
            return Response(
                {'message': f'You have joined {group.name} successfully.'},
                status=status.HTTP_200_OK
            )
        return Response(
            {'message': 'You are already a member of this group.'},
            status=status.HTTP_200_OK
        )