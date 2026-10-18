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
