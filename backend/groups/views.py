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