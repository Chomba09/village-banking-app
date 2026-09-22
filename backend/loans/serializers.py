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
    group_interest_rate = serializers.SerializerMethodField()
    cycle_end_date = serializers.SerializerMethodField()
    interest_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_repaid = serializers.SerializerMethodField()
    balance_remaining = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    repayments = LoanRepaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Loan
        fields = [
            'id', 'member_username', 'group', 'group_name',
            'group_interest_rate', 'cycle_end_date',
            'amount', 'interest_rate', 'interest_amount',
            'total_due', 'total_repaid', 'balance_remaining',
            'status', 'purpose', 'applied_at', 'approved_at',
            'due_date', 'repayments', 'submitted_by_treasurer'
        ]

    def get_total_repaid(self, obj):
        return float(obj.total_repaid)

    def get_group_interest_rate(self, obj):
        cycle = obj.group.active_cycle
        if cycle:
            return str(obj.group.interest_rate)
        return None

    def get_cycle_end_date(self, obj):
        cycle = obj.group.active_cycle
        if cycle:
            return str(cycle.end_date)
        return None


class LoanCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = ['id', 'group', 'amount', 'purpose']

    def validate_group(self, group):
        user = self.context['request'].user
        if user.role == 'treasurer' and group.treasurer == user:
            return group
        if not group.memberships.filter(user=user, status='active').exists():
            raise serializers.ValidationError(
                'You are not an active member of this group.'
            )
        return group

    def validate(self, data):
        group = data.get('group')
        amount = data.get('amount')

        if not group or not amount:
            return data

        user = self.context['request'].user
        cycle = group.active_cycle

        if not cycle:
            raise serializers.ValidationError(
                'This group has no active cycle.'
            )

        # Check stop borrowing date
        from django.utils import timezone
        today = timezone.now().date()
        if today > cycle.stop_borrowing_date:
            raise serializers.ValidationError(
                f'Loan applications are no longer accepted for this cycle. '
                f'The borrowing deadline was {cycle.stop_borrowing_date}.'
            )

        # Check loan ceiling — double the member's total confirmed savings
        from contributions.models import Contribution
        from django.db.models import Sum
        from decimal import Decimal

        member_savings = Contribution.objects.filter(
            member=user,
            group=group,
            status='confirmed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        loan_ceiling = member_savings * Decimal('2')

        if member_savings == 0:
            raise serializers.ValidationError(
                'You must make at least one confirmed contribution '
                'before applying for a loan.'
            )

        if amount > loan_ceiling:
            raise serializers.ValidationError(
                f'Loan amount exceeds your eligible limit. '
                f'Your total savings: K{member_savings:.2f}. '
                f'Maximum loan you can request: K{loan_ceiling:.2f} '
                f'(double your savings).'
            )

        # Check available pool
        total_savings = Contribution.objects.filter(
            group=group,
            status='confirmed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        max_loan_percentage = cycle.max_loan_percentage
        total_pool = (
            total_savings * max_loan_percentage / Decimal('100')
        ).quantize(Decimal('0.01'))

        outstanding_loans = Decimal('0.00')
        from loans.models import Loan
        approved_loans = Loan.objects.filter(group=group, status='approved')
        for loan in approved_loans:
            if loan.balance_remaining > 0:
                outstanding_loans += loan.balance_remaining

        available_amount = max(total_pool - outstanding_loans, Decimal('0.00'))

        if amount > available_amount:
            raise serializers.ValidationError(
                f'Loan amount exceeds the available pool. '
                f'Available to borrow: K{available_amount:.2f}. '
                f'Your personal ceiling: K{loan_ceiling:.2f}.'
            )

        return data

    def create(self, validated_data):
        user = self.context['request'].user
        group = validated_data['group']
        is_treasurer = user.role == 'treasurer' and group.treasurer == user
        validated_data['member'] = user
        validated_data['submitted_by_treasurer'] = is_treasurer
        return super().create(validated_data)


class LoanStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = ['id', 'status']

    def validate(self, data):
        if data.get('status') == 'approved':
            loan = self.instance
            group = loan.group
            cycle = group.active_cycle
            if not cycle:
                raise serializers.ValidationError(
                    'This group has no active cycle. Cannot approve loan.'
                )
        return data

    def update(self, instance, validated_data):
        if validated_data.get('status') == 'approved':
            from django.utils import timezone
            group = instance.group
            cycle = group.active_cycle
            validated_data['interest_rate'] = group.interest_rate
            validated_data['due_date'] = cycle.end_date
            validated_data['approved_at'] = timezone.now()
        return super().update(instance, validated_data)