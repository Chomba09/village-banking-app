from rest_framework import serializers
from .models import Notice


class NoticeSerializer(serializers.ModelSerializer):
    posted_by_username = serializers.CharField(
        source='posted_by.username', read_only=True
    )

    class Meta:
        model = Notice
        fields = [
            'id', 'group', 'title', 'content',
            'posted_by_username', 'created_at'
        ]
        read_only_fields = ['created_at', 'posted_by_username']


class NoticeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = ['id', 'group', 'title', 'content']

    def validate_group(self, group):
        user = self.context['request'].user
        if group.treasurer != user:
            raise serializers.ValidationError(
                'Only the group treasurer can post notices.'
            )
        return group

    def create(self, validated_data):
        from groups.models import Membership
        from notifications.utils import send_notification

        notice = Notice.objects.create(
            posted_by=self.context['request'].user,
            **validated_data
        )
        members = Membership.objects.filter(
            group=notice.group,
            status='active'
        ).exclude(user=notice.posted_by)

        for membership in members:
            send_notification(
                membership.user,
                f'New notice in {notice.group.name}: "{notice.title}" — {notice.content[:80]}{"..." if len(notice.content) > 80 else ""}'
            )
        return notice