from rest_framework import serializers
from .models import Contribution
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal

User = get_user_model()


class ContributionSerializer(serializers.ModelSerializer):
    member_username = serializers.CharField(
        source='member.username', read_only=True
    )
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Contribution
        fields = [
            'id', 'member_username', 'group', 'group_name',
            'amount', 'status', 'note', 'date', 'created_at',
            'submitted_by_treasurer'
        ]
        read_only_fields = ['status', 'date', 'created_at', 'submitted_by_treasurer']


class ContributionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contribution
        fields = ['id', 'group', 'amount', 'note']

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

        # Check stop saving date
        today = timezone.now().date()
        if today > cycle.stop_saving_date:
            raise serializers.ValidationError(
                f'Contributions are no longer accepted for this cycle. '
                f'The saving deadline was {cycle.stop_saving_date}.'
            )

        # Check minimum contribution
        min_contribution = group.minimum_contribution
        max_contribution = group.maximum_contribution
        max_display = f'K{max_contribution:.2f}' if max_contribution > 0 else 'No limit'

        if min_contribution and amount < min_contribution:
            raise serializers.ValidationError(
                f'Amount is below the minimum allowed. '
                f'Minimum: K{min_contribution:.2f}. '
                f'Maximum: {max_display}.'
            )

        # Check maximum contribution
        if max_contribution and max_contribution > 0 and amount > max_contribution:
            raise serializers.ValidationError(
                f'Amount exceeds the maximum allowed. '
                f'Minimum: K{min_contribution:.2f}. '
                f'Maximum: {max_display}.'
            )

        # Check multiples of 10
        if amount % Decimal('10') != 0:
            raise serializers.ValidationError(
                f'Amount must be in multiples of 10. '
                f'Minimum: K{min_contribution:.2f}. '
                f'Maximum: {max_display}.'
            )

        # Check one contribution per month per member
        current_month = today.month
        current_year = today.year
        existing_contribution = Contribution.objects.filter(
            member=user,
            group=group,
            date__month=current_month,
            date__year=current_year
        ).exists()

        if existing_contribution:
            import calendar
            last_day = calendar.monthrange(current_year, current_month)[1]
            next_month = today.replace(day=last_day) + timezone.timedelta(days=1)
            raise serializers.ValidationError(
                f'You have already made a contribution this month. '
                f'Your next contribution window opens on '
                f'{next_month.strftime("%d %B %Y")}.'
            )

        # Check for outstanding loans from a previous cycle blocking new contributions
        from loans.models import Loan
        outstanding_loans = Loan.objects.filter(
            member=user,
            group=group,
            status='approved'
        )
        total_outstanding = sum(
            loan.balance_remaining for loan in outstanding_loans
            if loan.balance_remaining > 0
        )

        if total_outstanding > 0:
            raise serializers.ValidationError(
                f'You have an outstanding loan balance of K{total_outstanding:.2f}. '
                f'You must clear your outstanding balance before making '
                f'contributions to a new cycle.'
            )

        return data

    def create(self, validated_data):
        from notifications.utils import send_notification
        from transactions.models import Transaction

        user = self.context['request'].user
        group = validated_data['group']
        is_treasurer = user.role == 'treasurer' and group.treasurer == user

        contribution = Contribution.objects.create(
            member=user,
            status='confirmed',
            submitted_by_treasurer=is_treasurer,
            **validated_data
        )

        Transaction.objects.create(
            member=user,
            group=group,
            transaction_type='contribution',
            amount=contribution.amount,
            status='approved',
            note='Contribution automatically confirmed'
        )

        if is_treasurer:
            send_notification(
                group.treasurer,
                f'You made a contribution of K{contribution.amount} '
                f'to {group.name} as treasurer.'
            )
        else:
            send_notification(
                group.treasurer,
                f'{user.username} made a contribution of '
                f'K{contribution.amount} to {group.name}.'
            )

        return contribution


class ContributionStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contribution
        fields = ['id', 'status']