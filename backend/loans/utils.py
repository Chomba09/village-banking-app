"""
Shared financial-logic utilities for the loans app.

Keeping formulas here — rather than inline in views or serializers — means
the application code and the test suite both call the same function, so a
change to the formula is reflected everywhere at once.
"""

from decimal import Decimal
from django.db.models import Sum


def calculate_available_pool(group):
    """
    Return the amount currently available for new loans in *group*.

    Formula (matches LoanCreateSerializer.validate and the test suite):
        total_savings   = sum of all confirmed contributions in the group
        pool_cap        = total_savings × (cycle.max_loan_percentage / 100)
        outstanding     = sum of balance_remaining for every approved loan
                          that still has money owed
        available       = max(pool_cap − outstanding, 0)

    Returns a Decimal quantised to 2 d.p.
    If there is no active cycle the pool is 0 (no lending allowed).
    """
    from contributions.models import Contribution
    from loans.models import Loan

    cycle = group.active_cycle
    if not cycle:
        return Decimal('0.00')

    total_savings = (
        Contribution.objects
        .filter(group=group, status='confirmed')
        .aggregate(total=Sum('amount'))['total']
        or Decimal('0.00')
    )

    pool_cap = (
        total_savings * cycle.max_loan_percentage / Decimal('100')
    ).quantize(Decimal('0.01'))

    outstanding = Decimal('0.00')
    for loan in Loan.objects.filter(group=group, status='approved'):
        balance = loan.balance_remaining
        if balance > 0:
            outstanding += balance

    return max(pool_cap - outstanding, Decimal('0.00'))


def calculate_max_single_loan(group):
    """
    Return the pool cap (savings × max_loan_percentage / 100) for *group*,
    which is the absolute ceiling any single loan request may not exceed.

    Note: individual members are also subject to a personal ceiling of
    2 × their own confirmed savings (enforced in LoanCreateSerializer).
    """
    from contributions.models import Contribution

    cycle = group.active_cycle
    if not cycle:
        return Decimal('0.00')

    total_savings = (
        Contribution.objects
        .filter(group=group, status='confirmed')
        .aggregate(total=Sum('amount'))['total']
        or Decimal('0.00')
    )

    return (
        total_savings * cycle.max_loan_percentage / Decimal('100')
    ).quantize(Decimal('0.01'))


def calculate_interest_shares(savings_by_member, total_interest):
    """
    Split *total_interest* between members in proportion to their savings,
    rounded DOWN to whole kwacha so every payout is a cash-friendly amount.

        share = floor(member_savings / total_savings × total_interest)

    Rounding down never promises more than the group actually earned. The few
    kwacha left over are returned as *undistributed* and stay in the group fund
    (shown on the cycle report), so shares + undistributed == total_interest.

    Returns (shares: {member_key: Decimal}, undistributed: Decimal).
    """
    from decimal import ROUND_DOWN

    total_savings = sum(savings_by_member.values(), Decimal('0.00'))
    total_interest = Decimal(total_interest)
    if total_savings <= 0 or total_interest <= 0:
        return {k: Decimal('0.00') for k in savings_by_member}, total_interest.quantize(Decimal('0.01'))

    shares = {}
    for key, savings in savings_by_member.items():
        raw = Decimal(savings) / total_savings * total_interest
        shares[key] = raw.quantize(Decimal('1'), rounding=ROUND_DOWN).quantize(Decimal('0.01'))
    undistributed = (total_interest - sum(shares.values(), Decimal('0.00'))).quantize(Decimal('0.01'))
    return shares, undistributed


def calculate_group_income(group):
    """
    Return (interest_earned, penalties_collected) for *group*.

        interest_earned     = interest on every approved / fully-paid loan
        penalties_collected = penalty payments members have actually made

    Both are group income: at share-out their total is divided between members
    in proportion to savings (see calculate_interest_shares). Penalties that
    have been charged but not yet paid are not income until they are paid.
    """
    from loans.models import Loan
    from transactions.models import Transaction

    interest = sum(
        (loan.interest_amount for loan in Loan.objects.filter(
            group=group, status__in=['approved', 'fully_paid'])),
        Decimal('0.00'),
    )
    penalties = (
        Transaction.objects
        .filter(group=group, transaction_type='penalty_payment', status='approved')
        .aggregate(total=Sum('amount'))['total']
        or Decimal('0.00')
    )
    return interest.quantize(Decimal('0.01')), penalties.quantize(Decimal('0.01'))
