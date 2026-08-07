from rest_framework import serializers
from .models import Loan, LoanRepayment
from django.utils import timezone


class LoanRepaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanRepayment
        fields = ['id', 'loan', 'amount', 'date', 'note']
        read_only_fields = ['date']

    def validate(self, data):
        loan = data['loan']
        if loan.status != 'approved':
            raise serializers.ValidationError(
                'Repayments can only be made on approved loans.'
            )
        if loan.member != self.context['request'].user:
            raise serializers.ValidationError(
                'You can only make repayments on your own loans.'
            )
        if data['amount'] > loan.balance_remaining:
            raise serializers.ValidationError(
                f'Repayment amount exceeds balance remaining of {loan.balance_remaining}.'
            )
        return data


class LoanSerializer(serializers.ModelSerializer):
    member_username = serializers.CharField(source='member.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    interest_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_repaid = serializers.SerializerMethodField()
    balance_remaining = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    repayments = LoanRepaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Loan
        fields = [
            'id', 'member_username', 'group', 'group_name',
            'amount', 'interest_rate', 'interest_amount',
            'total_due', 'total_repaid', 'balance_remaining',
            'status', 'purpose', 'applied_at', 'approved_at',
            'due_date', 'repayments'
        ]

    def get_total_repaid(self, obj):
        return float(obj.total_repaid)


class LoanCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = ['id', 'group', 'amount', 'purpose']

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


class LoanStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = ['id', 'status', 'approved_at', 'due_date', 'interest_rate']

    def validate(self, data):
        if data.get('status') == 'approved' and not data.get('interest_rate'):
            raise serializers.ValidationError(
                {'interest_rate': 'Interest rate is required when approving a loan.'}
            )
        return data

    def update(self, instance, validated_data):
        if validated_data.get('status') == 'approved':
            validated_data['approved_at'] = timezone.now()
        return super().update(instance, validated_data)