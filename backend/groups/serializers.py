from rest_framework import serializers
from .models import Group, Membership, Cycle
from django.contrib.auth import get_user_model

User = get_user_model()


class CycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cycle
        fields = [
            'id', 'cycle_name', 'start_date', 'end_date',
            'stop_saving_date', 'stop_borrowing_date',
            'member_admission_deadline', 'is_active', 'created_at'
        ]
        read_only_fields = ['is_active', 'created_at']


class MemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = Membership
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'email', 'phone_number', 'role', 'status', 'date_joined'
        ]


class GroupSerializer(serializers.ModelSerializer):
    treasurer = serializers.StringRelatedField(read_only=True)
    members = MemberSerializer(source='memberships', many=True, read_only=True)
    invite_link = serializers.SerializerMethodField()
    active_cycle = CycleSerializer(read_only=True)

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'treasurer',
            'invite_link', 'members', 'active_cycle',
            'contact_person', 'maximum_members',
            'minimum_contribution', 'maximum_contribution',
            'interest_rate', 'late_loan_penalty',
            'late_savings_penalty', 'no_savings_penalty',
            'default_loan_penalty', 'created_at'
        ]

    def get_invite_link(self, obj):
        return f"http://localhost:5173/join/{obj.invite_token}/"


class GroupCreateSerializer(serializers.ModelSerializer):
    cycle_name = serializers.CharField(write_only=True)
    start_date = serializers.DateField(write_only=True)
    end_date = serializers.DateField(write_only=True)
    stop_saving_date = serializers.DateField(write_only=True)
    stop_borrowing_date = serializers.DateField(write_only=True)
    member_admission_deadline = serializers.DateField(write_only=True)
    invite_link = serializers.SerializerMethodField()
    active_cycle = CycleSerializer(read_only=True)

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description',
            'contact_person', 'maximum_members',
            'minimum_contribution', 'maximum_contribution',
            'interest_rate', 'late_loan_penalty',
            'late_savings_penalty', 'no_savings_penalty',
            'default_loan_penalty',
            'cycle_name', 'start_date', 'end_date',
            'stop_saving_date', 'stop_borrowing_date',
            'member_admission_deadline',
            'invite_link', 'active_cycle'
        ]

    def get_invite_link(self, obj):
        return f"http://localhost:5173/join/{obj.invite_token}/"

    def validate(self, data):
        if data['stop_saving_date'] > data['end_date']:
            raise serializers.ValidationError(
                {'stop_saving_date': 'Stop saving date cannot be beyond the end date.'}
            )
        if data['stop_borrowing_date'] > data['end_date']:
            raise serializers.ValidationError(
                {'stop_borrowing_date': 'Stop borrowing date cannot be beyond the end date.'}
            )
        if data['member_admission_deadline'] > data['end_date']:
            raise serializers.ValidationError(
                {'member_admission_deadline': 'Member admission deadline cannot be beyond the end date.'}
            )
        return data

    def create(self, validated_data):
        cycle_data = {
            'cycle_name': validated_data.pop('cycle_name'),
            'start_date': validated_data.pop('start_date'),
            'end_date': validated_data.pop('end_date'),
            'stop_saving_date': validated_data.pop('stop_saving_date'),
            'stop_borrowing_date': validated_data.pop('stop_borrowing_date'),
            'member_admission_deadline': validated_data.pop('member_admission_deadline'),
        }
        user = self.context['request'].user
        group = Group.objects.create(treasurer=user, **validated_data)
        Cycle.objects.create(group=group, **cycle_data)
        Membership.objects.create(user=user, group=group)
        return group


class NewCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cycle
        fields = [
            'id', 'cycle_name', 'start_date', 'end_date',
            'stop_saving_date', 'stop_borrowing_date',
            'member_admission_deadline'
        ]

    def validate(self, data):
        if data['stop_saving_date'] > data['end_date']:
            raise serializers.ValidationError(
                {'stop_saving_date': 'Stop saving date cannot be beyond the end date.'}
            )
        if data['stop_borrowing_date'] > data['end_date']:
            raise serializers.ValidationError(
                {'stop_borrowing_date': 'Stop borrowing date cannot be beyond the end date.'}
            )
        return data

    def create(self, validated_data):
        group = self.context['group']
        Cycle.objects.filter(group=group, is_active=True).update(is_active=False)
        return Cycle.objects.create(group=group, is_active=True, **validated_data)