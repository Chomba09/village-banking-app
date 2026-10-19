from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum
from decimal import Decimal
from groups.models import Group, Membership
from contributions.models import Contribution
from loans.models import Loan
from transactions.models import Transaction
from django.utils import timezone
import re


class TreasurerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'treasurer':
            return Response(
                {'error': 'Only treasurers can access this dashboard.'},
                status=403
            )

        groups = Group.objects.filter(
            treasurer=request.user,
            is_archived=False
        )
        group_summaries = []
        overdue_loans = []
        today = timezone.localdate()

        for group in groups:
            members_count = Membership.objects.filter(
                group=group, status='active'
            ).count()

            # Only confirmed contributions
            total_contributions = Contribution.objects.filter(
                group=group, status='confirmed'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            # Only approved loans
            approved_loans = Loan.objects.filter(
                group=group, status='approved'
            )

            total_loans_issued = approved_loans.aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')

            # Only pending loans
            pending_loans = Loan.objects.filter(
                group=group, status='pending'
            ).count()

            # Total repaid from repayments table only
            from loans.models import LoanRepayment
            total_repaid = LoanRepayment.objects.filter(
                loan__group=group
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            # Loans that have already been charged a late/default penalty.
            # ApplyPenaltyView writes "(loan #<id>)" into the penalty note.
            penalised_loan_ids = set()
            penalty_notes = Transaction.objects.filter(
                group=group, transaction_type='penalty', note__contains='(loan #'
            ).values_list('note', flat=True)
            for note in penalty_notes:
                match = re.search(r'\(loan #(\d+)\)', note or '')
                if match:
                    penalised_loan_ids.add(int(match.group(1)))

            # Outstanding — approved loans not fully paid
            # Overdue — still owing money after the due date has passed,
            # and not yet penalised (so the treasurer cannot charge twice)
            outstanding_balance = Decimal('0.00')
            group_overdue_count = 0
            for loan in approved_loans.select_related('member'):
                balance = loan.balance_remaining
                if balance > 0:
                    outstanding_balance += balance
                    if (loan.due_date and loan.due_date < today
                            and loan.id not in penalised_loan_ids):
                        group_overdue_count += 1
                        member = loan.member
                        overdue_loans.append({
                            'loan_id': loan.id,
                            'group_id': group.id,
                            'group_name': group.name,
                            'member_id': member.id,
                            'late_loan_penalty': group.late_loan_penalty,
                            'member_username': member.username,
                            'member_name': f'{member.first_name} {member.last_name}'.strip() or member.username,
                            'total_due': loan.total_due,
                            'balance_remaining': balance,
                            'due_date': loan.due_date,
                            'days_overdue': (today - loan.due_date).days,
                        })

            group_summaries.append({
                'group_id': group.id,
                'group_name': group.name,
                'members_count': members_count,
                'total_contributions': total_contributions,
                'total_loans_issued': total_loans_issued,
                'pending_loan_applications': pending_loans,
                'total_repaid': total_repaid,
                'outstanding_balance': outstanding_balance,
                'overdue_count': group_overdue_count,
            })

        # Most overdue first
        overdue_loans.sort(key=lambda l: l['days_overdue'], reverse=True)

        return Response({
            'treasurer': request.user.username,
            'total_groups': groups.count(),
            'groups': group_summaries,
            'overdue_loans': overdue_loans,
        })


class MemberDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        memberships = Membership.objects.filter(
            user=request.user,
            status='active',
            group__is_archived=False
        ).select_related('group')

        group_summaries = []

        for membership in memberships:
            group = membership.group

            my_contributions = Contribution.objects.filter(
                member=request.user, group=group
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            confirmed_contributions = Contribution.objects.filter(
                member=request.user, group=group, status='confirmed'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            my_loans = Loan.objects.filter(member=request.user, group=group)

            total_borrowed = my_loans.filter(
                status='approved'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            outstanding_loans = []
            for loan in my_loans.filter(status='approved'):
                if loan.balance_remaining > 0:
                    outstanding_loans.append({
                        'loan_id': loan.id,
                        'amount': loan.amount,
                        'interest_rate': loan.interest_rate,
                        'total_due': loan.total_due,
                        'total_repaid': loan.total_repaid,
                        'balance_remaining': loan.balance_remaining,
                        'due_date': loan.due_date,
                    })

            group_summaries.append({
                'group_id': group.id,
                'group_name': group.name,
                'date_joined': membership.date_joined,
                'my_total_contributions': my_contributions,
                'my_confirmed_contributions': confirmed_contributions,
                'total_borrowed': total_borrowed,
                'outstanding_loans': outstanding_loans,
            })

        return Response({
            'member': request.user.username,
            'total_groups': memberships.count(),
            'groups': group_summaries,
        })


class GroupFinancialReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, group_id):
        try:
            group = Group.objects.get(
                id=group_id,
                treasurer=request.user,
                is_archived=False
            )
        except Group.DoesNotExist:
            return Response(
                {'error': 'Group not found or access denied.'},
                status=404
            )

        members = Membership.objects.filter(group=group, status='active')
        member_reports = []

        for membership in members:
            user = membership.user

            contributions = Contribution.objects.filter(
                member=user, group=group, status='confirmed'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            loans = Loan.objects.filter(
                member=user, group=group, status='approved'
            )
            total_borrowed = loans.aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')

            total_outstanding = Decimal('0.00')
            for loan in loans:
                if loan.balance_remaining > 0:
                    total_outstanding += loan.balance_remaining

            member_reports.append({
                'member_id': user.id,
                'username': user.username,
                'email': user.email,
                'date_joined': membership.date_joined,
                'total_contributions': contributions,
                'total_borrowed': total_borrowed,
                'outstanding_balance': total_outstanding,
            })

        total_contributions = Contribution.objects.filter(
            group=group, status='confirmed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        total_loans = Loan.objects.filter(
            group=group, status='approved'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        return Response({
            'group_id': group.id,
            'group_name': group.name,
            'total_members': members.count(),
            'total_confirmed_contributions': total_contributions,
            'total_loans_issued': total_loans,
            'member_reports': member_reports,
        })

class CycleReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, group_id):
        try:
            # Archived groups are included so their final cycle report stays viewable
            group = Group.objects.get(
                id=group_id,
                memberships__user=request.user,
            )
        except Group.DoesNotExist:
            return Response(
                {'error': 'Group not found or access denied.'},
                status=404
            )

        cycle = group.active_cycle
        if not cycle:
            return Response(
                {'error': 'No active cycle found.'},
                status=400
            )

        from groups.models import Membership
        from contributions.models import Contribution
        from loans.models import Loan, LoanRepayment
        from django.db.models import Sum

        members = Membership.objects.filter(
            group=group
        ).select_related('user')

        # Calculate group totals first
        total_group_savings = Contribution.objects.filter(
            group=group,
            status='confirmed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        total_interest_collected = LoanRepayment.objects.filter(
            loan__group=group
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Group income = interest on approved loans + penalties members have paid
        from loans.utils import calculate_group_income, calculate_interest_shares
        total_interest_earned, penalties_collected = calculate_group_income(group)
        total_income = total_interest_earned + penalties_collected

        # Income shares, rounded down to whole kwacha (see loans.utils)
        savings_by_member = {
            m.user_id: Contribution.objects.filter(
                member_id=m.user_id, group=group, status='confirmed'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            for m in members
        }
        interest_shares, undistributed_interest = calculate_interest_shares(
            savings_by_member, total_income
        )

        member_reports = []

        for membership in members:
            user = membership.user

            # Total savings contributed
            total_savings = Contribution.objects.filter(
                member=user,
                group=group,
                status='confirmed'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            # Loans taken (approved)
            member_loans = Loan.objects.filter(
                member=user,
                group=group,
                status__in=['approved', 'fully_paid']
            )

            total_borrowed = member_loans.aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')

            # Total interest charged on member's loans
            member_interest = sum(
                loan.interest_amount for loan in member_loans
            )

            # Loan amount payable (principal + interest)
            loan_amount_payable = total_borrowed + member_interest

            # Total repayments made
            total_repaid = LoanRepayment.objects.filter(
                loan__member=user,
                loan__group=group
            ).aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')

            # Outstanding balance
            outstanding = Decimal('0.00')
            for loan in member_loans:
                if loan.balance_remaining > 0:
                    outstanding += loan.balance_remaining

            # Eligible loan amount (double savings)
            eligible_amount = total_savings * Decimal('2')

            # Share of group income (interest + paid penalties), whole kwacha
            interest_share = interest_shares[user.id]

            # Final payout at end of cycle
            # Member gets back their savings + their share of interest earned
            final_payout = total_savings + interest_share

            member_reports.append({
                'member_id': user.id,
                'username': user.username,
                'full_name': f'{user.first_name} {user.last_name}'.strip() or user.username,
                'role': user.role,
                'submitted_by_treasurer': membership.user.role == 'treasurer',
                'membership_fee': Decimal('0.00'),
                'total_savings': total_savings,
                'total_borrowed': total_borrowed,
                'interest_charged': member_interest,
                'loan_amount_payable': loan_amount_payable,
                'total_repaid': total_repaid,
                'outstanding_balance': outstanding,
                'eligible_amount': eligible_amount,
                'interest_earned_share': interest_share,
                'final_payout': final_payout,
            })

        # Group totals row
        group_totals = {
            'total_savings': sum(m['total_savings'] for m in member_reports),
            'total_borrowed': sum(m['total_borrowed'] for m in member_reports),
            'total_interest_charged': sum(m['interest_charged'] for m in member_reports),
            'total_loan_payable': sum(m['loan_amount_payable'] for m in member_reports),
            'total_repaid': sum(m['total_repaid'] for m in member_reports),
            'total_outstanding': sum(m['outstanding_balance'] for m in member_reports),
            'total_eligible': sum(m['eligible_amount'] for m in member_reports),
            'total_interest_shared': sum(m['interest_earned_share'] for m in member_reports),
            'total_payout': sum(m['final_payout'] for m in member_reports),
            # Rounding remainder kept in the group fund (shares are whole kwacha)
            'undistributed_interest': undistributed_interest,
            'total_penalties_collected': penalties_collected,
            'total_income': total_income,
        }

        return Response({
            'group_name': group.name,
            'cycle_name': cycle.cycle_name,
            'start_date': cycle.start_date,
            'end_date': cycle.end_date,
            'interest_rate': group.interest_rate,
            'generated_at': timezone.now(),
            'member_reports': member_reports,
            'group_totals': group_totals,
        })

class GlobalSearchView(APIView):
    """Search across members, loans, and transactions the requesting user
    can see. Treasurers search across their managed groups; members see
    their own loans/transactions and the member list of groups they belong to."""
    permission_classes = [permissions.IsAuthenticated]

    RESULT_LIMIT = 15

    def get(self, request):
        from django.db.models import Q
        from groups.models import Group, Membership
        from contributions.models import Contribution
        from loans.models import Loan
        from transactions.models import Transaction

        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'members': [], 'loans': [], 'transactions': []})

        user = request.user
        is_treasurer = user.role == 'treasurer'

        managed_group_ids = list(
            Group.objects.filter(treasurer=user).values_list('id', flat=True)
        ) if is_treasurer else []

        member_group_ids = list(
            Membership.objects.filter(user=user).values_list('group_id', flat=True)
        )

        member_qs = Membership.objects.filter(
            group_id__in=member_group_ids
        ).filter(
            Q(user__username__icontains=query) |
            Q(user__member_id__icontains=query) |
            Q(user__first_name__icontains=query) |
            Q(user__last_name__icontains=query) |
            Q(user__phone_number__icontains=query)
        ).select_related('user', 'group').distinct()[:self.RESULT_LIMIT]

        members_data = [
            {
                'membership_id': m.id,
                'group_id': m.group_id,
                'group_name': m.group.name,
                'username': m.user.username,
                'member_id': m.user.member_id,
                'full_name': f"{m.user.first_name} {m.user.last_name}".strip(),
                'role': m.user.role,
            }
            for m in member_qs
        ]

        loan_qs = Loan.objects.filter(group_id__in=managed_group_ids) if is_treasurer \
            else Loan.objects.filter(member=user)
        loan_qs = loan_qs.filter(
            Q(member__username__icontains=query) |
            Q(member__member_id__icontains=query) |
            Q(status__icontains=query) |
            Q(purpose__icontains=query)
        ).select_related('member', 'group').distinct().order_by('-applied_at')[:self.RESULT_LIMIT]

        loans_data = [
            {
                'id': l.id,
                'group_id': l.group_id,
                'group_name': l.group.name,
                'member_username': l.member.username,
                'member_id': l.member.member_id,
                'amount': str(l.amount),
                'status': l.status,
            }
            for l in loan_qs
        ]

        txn_qs = Transaction.objects.filter(group_id__in=managed_group_ids) if is_treasurer \
            else Transaction.objects.filter(member=user)
        txn_qs = txn_qs.filter(
            Q(member__username__icontains=query) |
            Q(member__member_id__icontains=query) |
            Q(transaction_type__icontains=query) |
            Q(note__icontains=query)
        ).select_related('member', 'group').distinct()[:self.RESULT_LIMIT]

        transactions_data = [
            {
                'id': t.id,
                'group_id': t.group_id,
                'group_name': t.group.name,
                'member_username': t.member.username,
                'member_id': t.member.member_id,
                'transaction_type': t.transaction_type,
                'amount': str(t.amount),
                'status': t.status,
                'date': t.date,
            }
            for t in txn_qs
        ]

        return Response({
            'members': members_data,
            'loans': loans_data,
            'transactions': transactions_data,
        })
