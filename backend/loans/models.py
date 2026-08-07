from django.db import models
from django.conf import settings
from django.db.models import Sum
from decimal import Decimal
from groups.models import Group


class Loan(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('fully_paid', 'Fully Paid'),
    )
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='loans'
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='loans'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    purpose = models.TextField(blank=True, null=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)

    @property
    def interest_amount(self):
        if self.interest_rate is None:
            return Decimal('0.00')
        return (self.amount * self.interest_rate / Decimal('100')).quantize(Decimal('0.01'))

    @property
    def total_due(self):
        return (self.amount + self.interest_amount).quantize(Decimal('0.01'))

    @property
    def total_repaid(self):
        from django.db.models import Sum
        result = self.repayments.aggregate(total=Sum('amount'))['total']
        return result if result is not None else Decimal('0.00')

    @property
    def balance_remaining(self):
        return (self.total_due - self.total_repaid).quantize(Decimal('0.01'))


class LoanRepayment(models.Model):
    loan = models.ForeignKey(
        Loan,
        on_delete=models.CASCADE,
        related_name='repayments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(auto_now_add=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Repayment of {self.amount} for loan {self.loan.id}"