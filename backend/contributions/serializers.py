from rest_framework import serializers
from .models import Contribution
from django.contrib.auth import get_user_model

User = get_user_model()

class ContributionSerializer(serializers.ModelSerializer):
    member_username = serializers.CharField(source='member.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Contribution
        fields = [
            'id', 'member_username', 'group', 'group_name',
            'amount', 'status', 'note', 'date', 'created_at'
        ]
        read_only_fields = ['status', 'date', 'created_at']


class ContributionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contribution
        fields = ['id', 'group', 'amount', 'note']

    def validate_group(self, group):
        user = self.context['request'].user
        if not group.memberships.filter(user=user, status='active').exists():
            raise serializers.ValidationError(
                'You are not an active member of this group.'
            )
        return group

    def create(self, validated_data):
        validated_data['member'] = self.context['request'].user
        return super().create(validated_data)


class ContributionStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contribution
        fields = ['id', 'status']