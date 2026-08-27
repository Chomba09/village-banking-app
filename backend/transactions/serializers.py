from rest_framework import serializers
from .models import Transaction, MemberAccount


class TransactionSerializer(serializers.ModelSerializer):
    member_username = serializers.CharField(source='member.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'member_username', 'group', 'group_name',
            'transaction_type', 'amount', 'status', 'note', 'date'
        ]
        read_only_fields = ['date', 'status']


class DepositWithdrawalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'group', 'amount', 'note', 'transaction_type']

    def validate_group(self, group):
        user = self.context['request'].user
        if not group.memberships.filter(user=user, status='active').exists():
            raise serializers.ValidationError(
                'You are not an active member of this group.'
            )
        return group

    def validate(self, data):
        if data['transaction_type'] not in ['deposit', 'withdrawal']:
            raise serializers.ValidationError(
                'Only deposits and withdrawals are allowed here.'
            )
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        transaction_type = validated_data['transaction_type']
        status = 'approved' if transaction_type == 'deposit' else 'pending'
        transaction = Transaction.objects.create(
            member=user,
            status=status,
            **validated_data
        )
        if transaction_type == 'deposit':
            account, _ = MemberAccount.objects.get_or_create(
                member=user,
                group=validated_data['group']
            )
            account.balance += validated_data['amount']
            account.save()
        return transaction


class MemberAccountSerializer(serializers.ModelSerializer):
    member_username = serializers.CharField(source='member.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = MemberAccount
        fields = ['id', 'member_username', 'group_name', 'balance', 'last_updated']


class WithdrawalApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'status']

    def update(self, instance, validated_data):
        new_status = validated_data.get('status')
        if new_status == 'approved':
            account, _ = MemberAccount.objects.get_or_create(
                member=instance.member,
                group=instance.group
            )
            if account.balance < instance.amount:
                raise serializers.ValidationError(
                    'Member has insufficient balance for this withdrawal.'
                )
            account.balance -= instance.amount
            account.save()
        return super().update(instance, validated_data)