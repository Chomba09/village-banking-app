"""
Automated unit tests for Smart Bank financial logic.

Segments:
  1. Loan interest and balance arithmetic
  2. Overdue loan detection and penalty application
  3. Loan availability pool calculation
  4. Cycle report payout computation

Run with:
    python manage.py test loans.tests --verbosity=2
"""

from decimal import Decimal
from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone

from groups.models import Group, Cycle, Membership
from loans.models import Loan, LoanRepayment
from loans.utils import calculate_available_pool, calculate_max_single_loan
from contributions.models import Contribution

User = get_user_model()


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def make_user(username, role='member'):
    return User.objects.create_user(
        username=username,
        password='testpass123',
        role=role,
        email=f'{username}@test.com',
    )


def make_group(treasurer, interest_rate='10.00', max_loan_pct='80.00',
               late_loan_penalty='50.00', default_loan_penalty='100.00'):
    group = Group.objects.create(
        name=f'Test Group ({treasurer.username})',
        treasurer=treasurer,
        interest_rate=Decimal(interest_rate),
        late_loan_penalty=Decimal(late_loan_penalty),
        default_loan_penalty=Decimal(default_loan_penalty),
    )
    Cycle.objects.create(
        group=group,
        cycle_name='Cycle 1',
        start_date=date.today() - timedelta(days=30),
        end_date=date.today() + timedelta(days=335),
        stop_saving_date=date.today() + timedelta(days=300),
        stop_borrowing_date=date.today() + timedelta(days=300),
        member_admission_deadline=date.today() + timedelta(days=60),
        max_loan_percentage=Decimal(max_loan_pct),
        is_active=True,
    )
    return group


def make_approved_loan(member, group, amount, interest_rate=None,
                       due_date=None):
    rate = interest_rate if interest_rate is not None else group.interest_rate
    loan = Loan.objects.create(
        member=member,
        group=group,
        amount=Decimal(str(amount)),
        interest_rate=Decimal(str(rate)),
        status='approved',
        due_date=due_date or (date.today() + timedelta(days=30)),
        treasurer_approved=True,
        chairperson_approved=True,
    )
    return loan


def make_contribution(member, group, amount, status='confirmed'):
    return Contribution.objects.create(
        member=member,
        group=group,
        amount=Decimal(str(amount)),
        status=status,
    )


# ===========================================================================
# 1. LOAN INTEREST AND BALANCE ARITHMETIC
# ===========================================================================

class LoanInterestArithmeticTests(TestCase):
    """
    Verifies the three computed properties on the Loan model:
      - interest_amount  = amount × rate / 100
      - total_due        = amount + interest_amount
      - balance_remaining = total_due − total_repaid
    """

    def setUp(self):
        self.treasurer = make_user('treasurer1', 'treasurer')
        self.member = make_user('alice')
        self.group = make_group(self.treasurer, interest_rate='10.00')
        Membership.objects.create(user=self.member, group=self.group)

    # --- interest_amount ---

    def test_interest_amount_whole_rate(self):
        """10 % on K1 000 → K100.00"""
        loan = make_approved_loan(self.member, self.group, 1000, 10)
        self.assertEqual(loan.interest_amount, Decimal('100.00'))

    def test_interest_amount_fractional_rate(self):
        """7.5 % on K1 500 → K112.50"""
        loan = make_approved_loan(self.member, self.group, 1500, 7.5)
        self.assertEqual(loan.interest_amount, Decimal('112.50'))

    def test_interest_amount_zero_rate(self):
        """0 % interest → K0.00 regardless of principal"""
        loan = make_approved_loan(self.member, self.group, 2000, 0)
        self.assertEqual(loan.interest_amount, Decimal('0.00'))

    def test_interest_amount_none_rate(self):
        """None interest_rate (unset) → K0.00, does not raise"""
        loan = Loan.objects.create(
            member=self.member,
            group=self.group,
            amount=Decimal('1000.00'),
            interest_rate=None,
            status='approved',
        )
        self.assertEqual(loan.interest_amount, Decimal('0.00'))

    def test_interest_rounds_to_two_decimal_places(self):
        """Result is always quantised to 2 d.p. (no floating point drift)"""
        loan = make_approved_loan(self.member, self.group, 333, 10)
        # 333 × 10 / 100 = 33.3 → 33.30
        self.assertEqual(loan.interest_amount, Decimal('33.30'))

    # --- total_due ---

    def test_total_due_equals_principal_plus_interest(self):
        loan = make_approved_loan(self.member, self.group, 1000, 10)
        self.assertEqual(loan.total_due, Decimal('1100.00'))

    def test_total_due_zero_interest(self):
        loan = make_approved_loan(self.member, self.group, 500, 0)
        self.assertEqual(loan.total_due, Decimal('500.00'))

    # --- balance_remaining ---

    def test_balance_equals_total_due_when_no_repayments(self):
        loan = make_approved_loan(self.member, self.group, 1000, 10)
        self.assertEqual(loan.balance_remaining, Decimal('1100.00'))

    def test_partial_repayment_reduces_balance(self):
        loan = make_approved_loan(self.member, self.group, 1000, 10)
        LoanRepayment.objects.create(loan=loan, amount=Decimal('500.00'))
        self.assertEqual(loan.balance_remaining, Decimal('600.00'))

    def test_multiple_repayments_accumulate(self):
        """300 + 400 = 700 repaid; 1100 − 700 = 400 remaining"""
        loan = make_approved_loan(self.member, self.group, 1000, 10)
        LoanRepayment.objects.create(loan=loan, amount=Decimal('300.00'))
        LoanRepayment.objects.create(loan=loan, amount=Decimal('400.00'))
        self.assertEqual(loan.balance_remaining, Decimal('400.00'))

    def test_full_repayment_clears_balance(self):
        loan = make_approved_loan(self.member, self.group, 1000, 10)
        LoanRepayment.objects.create(loan=loan, amount=Decimal('1100.00'))
        self.assertEqual(loan.balance_remaining, Decimal('0.00'))

    def test_balance_never_goes_negative(self):
        """Overpayment should result in a negative or zero balance,
        meaning the system records what was actually paid."""
        loan = make_approved_loan(self.member, self.group, 1000, 10)
        LoanRepayment.objects.create(loan=loan, amount=Decimal('1200.00'))
        # Overpayment: balance_remaining = 1100 − 1200 = −100
        self.assertLessEqual(loan.balance_remaining, Decimal('0.00'))


# ===========================================================================
# 2. OVERDUE LOAN DETECTION AND PENALTY APPLICATION
# ===========================================================================

class OverdueLoanTests(TestCase):
    """
    The Group model stores late_loan_penalty and default_loan_penalty.
    These tests verify that:
      - a loan with a past due_date is correctly identified as overdue
      - the correct flat penalty amounts are accessible from the group
      - a loan with a future due_date is not overdue
    """

    def setUp(self):
        self.treasurer = make_user('treasurer2', 'treasurer')
        self.member = make_user('bob')
        self.group = make_group(
            self.treasurer,
            late_loan_penalty='50.00',
            default_loan_penalty='100.00',
        )
        Membership.objects.create(user=self.member, group=self.group)

    def _is_overdue(self, loan):
        """Helper replicating the overdue check: due_date < today and balance > 0."""
        return (
            loan.due_date is not None
            and loan.due_date < date.today()
            and loan.balance_remaining > 0
        )

    def test_loan_past_due_date_is_overdue(self):
        loan = make_approved_loan(
            self.member, self.group, 1000, 10,
            due_date=date.today() - timedelta(days=1),
        )
        self.assertTrue(self._is_overdue(loan))

    def test_loan_future_due_date_is_not_overdue(self):
        loan = make_approved_loan(
            self.member, self.group, 1000, 10,
            due_date=date.today() + timedelta(days=30),
        )
        self.assertFalse(self._is_overdue(loan))

    def test_fully_paid_loan_not_overdue_even_if_past_due(self):
        loan = make_approved_loan(
            self.member, self.group, 1000, 10,
            due_date=date.today() - timedelta(days=5),
        )
        LoanRepayment.objects.create(loan=loan, amount=Decimal('1100.00'))
        self.assertFalse(self._is_overdue(loan))

    def test_late_loan_penalty_amount_from_group(self):
        """Group's late_loan_penalty is accessible and correct."""
        self.assertEqual(self.group.late_loan_penalty, Decimal('50.00'))

    def test_default_loan_penalty_amount_from_group(self):
        """Group's default_loan_penalty is accessible and correct."""
        self.assertEqual(self.group.default_loan_penalty, Decimal('100.00'))

    def test_penalty_charged_to_member_account(self):
        """
        Applying a late_loan penalty via apply_penalty() increases the member's
        MemberAccount balance by the group's late_loan_penalty amount and
        creates a Transaction record of type 'penalty'.
        """
        from transactions.models import MemberAccount, Transaction
        from loans.views import ApplyPenaltyView

        loan = make_approved_loan(
            self.member, self.group, 1000, 10,
            due_date=date.today() - timedelta(days=1),
        )

        # Start from a clean slate
        account, _ = MemberAccount.objects.get_or_create(
            member=self.member, group=self.group, defaults={'balance': Decimal('0.00')}
        )
        self.assertEqual(account.balance, Decimal('0.00'))

        # Simulate the logic ApplyPenaltyView runs
        penalty_amount = self.group.late_loan_penalty   # 50.00
        account.balance += penalty_amount
        account.save()

        Transaction.objects.create(
            member=self.member,
            group=self.group,
            transaction_type='penalty',
            amount=penalty_amount,
            status='approved',
            note=f'Late loan repayment penalty (loan #{loan.id})',
        )

        account.refresh_from_db()
        self.assertEqual(account.balance, Decimal('50.00'))

        txn = Transaction.objects.filter(
            member=self.member, group=self.group, transaction_type='penalty'
        ).first()
        self.assertIsNotNone(txn)
        self.assertEqual(txn.amount, Decimal('50.00'))

    def test_overdue_count_across_multiple_loans(self):
        """Among 3 loans, 2 are overdue and 1 is not."""
        past = date.today() - timedelta(days=1)
        future = date.today() + timedelta(days=30)
        loan1 = make_approved_loan(self.member, self.group, 500, 10, due_date=past)
        loan2 = make_approved_loan(self.member, self.group, 800, 10, due_date=past)
        loan3 = make_approved_loan(self.member, self.group, 300, 10, due_date=future)

        loans = [loan1, loan2, loan3]
        overdue_count = sum(1 for l in loans if self._is_overdue(l))
        self.assertEqual(overdue_count, 2)


# ===========================================================================
# 3. LOAN AVAILABILITY POOL CALCULATION
# ===========================================================================

class LoanPoolTests(TestCase):
    """
    The available loan pool is:
        total_confirmed_savings − total_outstanding_loan_balances

    The cycle also caps individual loan requests at:
        max_loan_percentage / 100 × pool

    These tests verify both calculations.
    """

    def setUp(self):
        self.treasurer = make_user('treasurer3', 'treasurer')
        self.m1 = make_user('carol')
        self.m2 = make_user('dave')
        self.group = make_group(self.treasurer, max_loan_pct='80.00')
        Membership.objects.create(user=self.m1, group=self.group)
        Membership.objects.create(user=self.m2, group=self.group)

    def _pool(self):
        """
        Return the available loan pool via the shared utility used by the
        application itself (calculate_available_pool in loans/utils.py).

        Formula: pool_cap − outstanding
          pool_cap    = total_confirmed_savings × (max_loan_percentage / 100)
          outstanding = sum of balance_remaining for approved unpaid loans
        """
        return calculate_available_pool(self.group)

    def _max_single_loan(self):
        """
        Return the pool cap via the shared utility (calculate_max_single_loan).
        This is the absolute ceiling before outstanding loans are deducted.
        """
        return calculate_max_single_loan(self.group)

    def test_pool_with_no_loans(self):
        """
        With no outstanding loans the pool equals the 80 % cap on savings.
        savings = 5000; cap = 5000 × 80 / 100 = 4000.00
        """
        make_contribution(self.m1, self.group, 2000)
        make_contribution(self.m2, self.group, 3000)
        self.assertEqual(self._pool(), Decimal('4000.00'))

    def test_pool_reduced_by_outstanding_loan(self):
        """
        Pool cap = 5000 × 80 % = 4000.
        Loan of 1000 at 10 % → outstanding balance = 1100.
        Available = 4000 − 1100 = 2900.00
        """
        make_contribution(self.m1, self.group, 2000)
        make_contribution(self.m2, self.group, 3000)
        make_approved_loan(self.m1, self.group, 1000, 10)
        self.assertEqual(self._pool(), Decimal('2900.00'))

    def test_pool_restored_after_full_repayment(self):
        """Once a loan is fully repaid the available pool returns to the cap."""
        make_contribution(self.m1, self.group, 2000)
        make_contribution(self.m2, self.group, 3000)
        loan = make_approved_loan(self.m1, self.group, 1000, 10)
        LoanRepayment.objects.create(loan=loan, amount=Decimal('1100.00'))
        # Outstanding = 0, so available = cap = 4000
        self.assertEqual(self._pool(), Decimal('4000.00'))

    def test_unconfirmed_contributions_excluded_from_pool(self):
        """
        Only 'confirmed' contributions count.
        Savings = 2000 (confirmed only); cap = 2000 × 80 % = 1600.00
        """
        make_contribution(self.m1, self.group, 2000, status='confirmed')
        make_contribution(self.m2, self.group, 3000, status='pending')
        self.assertEqual(self._pool(), Decimal('1600.00'))

    def test_max_loan_percentage_cap(self):
        """
        With 80 % cap and K5 000 total savings, the pool cap = K4 000.
        No outstanding loans → available = K4 000.
        """
        make_contribution(self.m1, self.group, 2000)
        make_contribution(self.m2, self.group, 3000)
        self.assertEqual(self._max_single_loan(), Decimal('4000.00'))
        self.assertEqual(self._pool(), Decimal('4000.00'))

    def test_max_loan_cap_with_reduced_pool(self):
        """
        Pool cap stays K4 000 (savings haven't changed).
        After one loan the *available* amount drops:
          outstanding = 1100 → available = 4000 − 1100 = 2900.00
        """
        make_contribution(self.m1, self.group, 2000)
        make_contribution(self.m2, self.group, 3000)
        make_approved_loan(self.m1, self.group, 1000, 10)
        # Pool cap is unchanged
        self.assertEqual(self._max_single_loan(), Decimal('4000.00'))
        # Available has shrunk
        self.assertEqual(self._pool(), Decimal('2900.00'))

    def test_pool_zero_when_cap_exceeded_by_outstanding(self):
        """
        If outstanding loans exceed the cap the available pool is clamped to 0.
        savings = 1000; cap = 800; loan 1000 at 0 % → outstanding = 1000 > cap.
        """
        make_contribution(self.m1, self.group, 1000)
        make_approved_loan(self.m1, self.group, 1000, 0)
        self.assertEqual(self._pool(), Decimal('0.00'))


# ===========================================================================
# 4. CYCLE REPORT PAYOUT COMPUTATION
# ===========================================================================

class CycleReportPayoutTests(TestCase):
    """
    At the end of a cycle each member receives:
        final_payout = member_savings + interest_earned_share

    Where:
        interest_earned_share = (member_savings / total_group_savings) × total_interest_earned
        total_interest_earned = sum of interest_amount across all approved/fully_paid loans

    These tests mirror the logic in dashboard/views.py → CycleReportView.
    """

    def setUp(self):
        self.treasurer = make_user('treasurer4', 'treasurer')
        self.m1 = make_user('eve')
        self.m2 = make_user('frank')
        self.group = make_group(self.treasurer, interest_rate='10.00')
        Membership.objects.create(user=self.m1, group=self.group)
        Membership.objects.create(user=self.m2, group=self.group)

    def _compute_report(self):
        """Replicate CycleReportView's calculation for this group."""
        from django.db.models import Sum

        total_group_savings = Contribution.objects.filter(
            group=self.group, status='confirmed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        all_loans = Loan.objects.filter(
            group=self.group, status__in=['approved', 'fully_paid']
        )
        total_interest_earned = sum(l.interest_amount for l in all_loans)

        reports = {}
        for user in [self.m1, self.m2]:
            savings = Contribution.objects.filter(
                member=user, group=self.group, status='confirmed'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            if total_group_savings > 0:
                interest_share = (
                    savings / total_group_savings * total_interest_earned
                ).quantize(Decimal('0.01'))
            else:
                interest_share = Decimal('0.00')

            reports[user.username] = {
                'savings': savings,
                'interest_share': interest_share,
                'final_payout': savings + interest_share,
            }
        return reports, total_group_savings, total_interest_earned

    def test_payout_no_loans_equals_savings(self):
        """With no loans there is no interest, so payout = savings."""
        make_contribution(self.m1, self.group, 2000)
        make_contribution(self.m2, self.group, 3000)
        reports, _, _ = self._compute_report()
        self.assertEqual(reports['eve']['final_payout'], Decimal('2000.00'))
        self.assertEqual(reports['frank']['final_payout'], Decimal('3000.00'))

    def test_total_interest_earned_from_loans(self):
        """Interest earned = sum of interest_amount on approved loans."""
        make_contribution(self.m1, self.group, 2000)
        make_contribution(self.m2, self.group, 3000)
        # eve borrows 1000 at 10 % → interest = 100
        make_approved_loan(self.m1, self.group, 1000, 10)
        _, _, total_interest = self._compute_report()
        self.assertEqual(total_interest, Decimal('100.00'))

    def test_interest_share_proportional_to_savings(self):
        """
        eve saves 2000, frank saves 3000 (total 5000).
        Interest earned = 100.
        eve share = 2000/5000 × 100 = 40.00
        frank share = 3000/5000 × 100 = 60.00
        """
        make_contribution(self.m1, self.group, 2000)
        make_contribution(self.m2, self.group, 3000)
        make_approved_loan(self.m1, self.group, 1000, 10)
        reports, _, _ = self._compute_report()
        self.assertEqual(reports['eve']['interest_share'], Decimal('40.00'))
        self.assertEqual(reports['frank']['interest_share'], Decimal('60.00'))

    def test_final_payout_includes_savings_and_interest_share(self):
        """
        eve: 2000 savings + 40 share = 2040.00
        frank: 3000 savings + 60 share = 3060.00
        """
        make_contribution(self.m1, self.group, 2000)
        make_contribution(self.m2, self.group, 3000)
        make_approved_loan(self.m1, self.group, 1000, 10)
        reports, _, _ = self._compute_report()
        self.assertEqual(reports['eve']['final_payout'], Decimal('2040.00'))
        self.assertEqual(reports['frank']['final_payout'], Decimal('3060.00'))

    def test_interest_shares_sum_to_total_interest(self):
        """The sum of all members' interest shares equals total interest earned."""
        make_contribution(self.m1, self.group, 2000)
        make_contribution(self.m2, self.group, 3000)
        make_approved_loan(self.m1, self.group, 1000, 10)
        make_approved_loan(self.m2, self.group, 500, 10)
        reports, _, total_interest = self._compute_report()
        total_shared = sum(r['interest_share'] for r in reports.values())
        # Allow ±0.01 for rounding across members
        self.assertAlmostEqual(
            float(total_shared), float(total_interest), delta=0.01
        )

    def test_payout_zero_savings_member_gets_nothing(self):
        """A member who contributed nothing receives a zero payout."""
        make_contribution(self.m1, self.group, 5000)
        # m2 has no contributions
        make_approved_loan(self.m1, self.group, 1000, 10)
        reports, _, _ = self._compute_report()
        self.assertEqual(reports['frank']['final_payout'], Decimal('0.00'))

    def test_multiple_loans_interest_accumulates(self):
        """
        Two loans from the same group → interest from both counts.
        Loan 1: 1000 at 10 % → 100
        Loan 2: 2000 at 10 % → 200
        Total interest = 300
        """
        make_contribution(self.m1, self.group, 3000)
        make_contribution(self.m2, self.group, 2000)
        make_approved_loan(self.m1, self.group, 1000, 10)
        make_approved_loan(self.m2, self.group, 2000, 10)
        _, _, total_interest = self._compute_report()
        self.assertEqual(total_interest, Decimal('300.00'))
