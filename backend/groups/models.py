from django.db import models
from django.conf import settings
import uuid


class Group(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    treasurer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='managed_groups'
    )
    invite_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Contact
    contact_person = models.CharField(max_length=15, blank=True, null=True)

    # Member limits
    maximum_members = models.PositiveIntegerField(default=0)

    # Contribution limits
    minimum_contribution = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    maximum_contribution = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Interest
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    # Penalties
    late_loan_penalty = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    late_savings_penalty = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    no_savings_penalty = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    default_loan_penalty = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name

    @property
    def active_cycle(self):
        return self.cycles.filter(is_active=True).first()


class Cycle(models.Model):
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='cycles'
    )
    cycle_name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    stop_saving_date = models.DateField()
    stop_borrowing_date = models.DateField()
    member_admission_deadline = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.cycle_name} — {self.group.name}"


class Membership(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    date_joined = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'group')

    def __str__(self):
        return f"{self.user.username} - {self.group.name}"