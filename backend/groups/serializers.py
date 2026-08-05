from rest_framework import serializers
from .models import Group, Membership
from django.contrib.auth import get_user_model

User = get_user_model()

class MemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = Membership
        fields = ['id', 'username', 'email', 'role', 'status', 'date_joined']


class GroupSerializer(serializers.ModelSerializer):
    treasurer = serializers.StringRelatedField(read_only=True)
    members = MemberSerializer(source='memberships', many=True, read_only=True)
    invite_link = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'treasurer',
            'invite_link', 'members', 'created_at'
        ]

    def get_invite_link(self, obj):
        request = self.context.get('request')
        return f"{request.scheme}://{request.get_host()}/api/groups/join/{obj.invite_token}/"


class GroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name', 'description']

    def create(self, validated_data):
        user = self.context['request'].user
        group = Group.objects.create(treasurer=user, **validated_data)
        Membership.objects.create(user=user, group=group)
        return group