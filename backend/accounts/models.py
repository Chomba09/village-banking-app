from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('treasurer', 'Treasurer'),
        ('member', 'Member'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    # A stable, human-readable identifier shown next to names everywhere so
    # two members with the same display name can always be told apart.
    member_id = models.CharField(
        max_length=20, unique=True, editable=False, blank=True, null=True
    )

    def save(self, *args, **kwargs):
        if not self.member_id:
            self.member_id = self._generate_member_id()
        super().save(*args, **kwargs)

    def _generate_member_id(self):
        last = (
            User.objects.exclude(member_id__isnull=True)
            .exclude(member_id__exact='')
            .order_by('-member_id')
            .values_list('member_id', flat=True)
            .first()
        )
        next_number = 1
        if last:
            try:
                next_number = int(last.split('-')[1]) + 1
            except (IndexError, ValueError):
                next_number = User.objects.count() + 1

        candidate = f"VB-{next_number:04d}"
        while User.objects.filter(member_id=candidate).exists():
            next_number += 1
            candidate = f"VB-{next_number:04d}"
        return candidate

    def __str__(self):
        return f"{self.username} ({self.role})"
