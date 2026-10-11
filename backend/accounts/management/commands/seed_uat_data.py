"""
UAT Test Data Seed Command
==========================
Creates a realistic, ready-to-use dataset for User Acceptance Testing.

Run with:
    python manage.py seed_uat_data

Run with --reset to wipe existing seed data first:
    python manage.py seed_uat_data --reset

What gets created
-----------------
ACCOUNTS
  Treasurer:  username=uat_treasurer   password=UATpass123
  Member 1:   username=uat_member1     password=UATpass123
  Member 2:   username=uat_member2     password=UATpass123
  Member 3:   username=uat_member3     password=UATpass123

GROUP
  Name: Lusaka Chilimba Group
  Min contribution: K100  |  Interest rate: 10%  |  Max members: 20
  Late loan penalty: K50  |  Active cycle: 6 months from today

EXISTING DATA (so participants have something to see straight away)
  - All four users are members of the group
  - Each member has 3 confirmed contributions of K200 each (K600 total per member)
  - Member 1 has an approved loan of K500 (partially repaid)
  - Member 2 has a pending loan application (waiting for treasurer to approve)
  - Member 3 has no loan (clean slate for UAT participants to use)
  - One group notice from the treasurer
  - One pending contribution from member 3 (waiting for treasurer to confirm)
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from datetime import date, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds realistic UAT test data. Safe to run multiple times.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete all existing UAT seed accounts and data before creating fresh data.',
        )

    def handle(self, *args, **options):
        from groups.models import Group, Membership, Cycle
        from contributions.models import Contribution
        from loans.models import Loan, LoanRepayment
        from transactions.models import Transaction, MemberAccount
        from notices.models import Notice
        from notifications.models import Notification

        if options['reset']:
            self.stdout.write('Resetting existing UAT data...')
            User.objects.filter(username__startswith='uat_').delete()
            Group.objects.filter(name='Lusaka Chilimba Group').delete()
            self.stdout.write(self.style.WARNING('  Existing UAT data deleted.'))

        # ── ACCOUNTS ──────────────────────────────────────────────────────────
        self.stdout.write('\nCreating accounts...')

        treasurer, _ = User.objects.get_or_create(
            username='uat_treasurer',
            defaults={
                'email': 'treasurer@uat.com',
                'role': 'treasurer',
                'first_name': 'Thandi',
                'last_name': 'Mwale',
                'phone_number': '0971000001',
            }
        )
        treasurer.set_password('UATpass123')
        treasurer.save()

        members_data = [
            ('uat_member1', 'Bwalya',  'Phiri',   '0971000002', 'member1@uat.com'),
            ('uat_member2', 'Chanda',  'Tembo',   '0971000003', 'member2@uat.com'),
            ('uat_member3', 'Daliso',  'Banda',   '0971000004', 'member3@uat.com'),
        ]

        members = []
        for username, first, last, phone, email in members_data:
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'role': 'member',
                    'first_name': first,
                    'last_name': last,
                    'phone_number': phone,
                }
            )
            user.set_password('UATpass123')
            user.save()
            members.append(user)
            self.stdout.write(f'  {user.username} ({user.member_id})')

        member1, member2, member3 = members

        # ── GROUP & CYCLE ─────────────────────────────────────────────────────
        self.stdout.write('\nCreating group and cycle...')

        group, group_created = Group.objects.get_or_create(
            name='Lusaka Chilimba Group',
            defaults={
                'treasurer': treasurer,
                'description': (
                    'A community savings group based in Lusaka. '
                    'Members pool savings monthly and provide short-term loans '
                    'to one another at a competitive interest rate.'
                ),
                'contact_person': 'Thandi Mwale',
                'maximum_members': 20,
                'minimum_contribution': Decimal('100.00'),
                'maximum_contribution': Decimal('0.00'),
                'interest_rate': Decimal('10.00'),
                'late_loan_penalty': Decimal('50.00'),
                'late_savings_penalty': Decimal('20.00'),
                'no_savings_penalty': Decimal('30.00'),
                'default_loan_penalty': Decimal('50.00'),
            }
        )

        if not group_created:
            self.stdout.write(self.style.WARNING(
                '  Group already exists — skipping group creation. '
                'Run with --reset to start fresh.'
            ))
        else:
            today = date.today()
            cycle = Cycle.objects.create(
                group=group,
                cycle_name='Cycle 1 — 2026',
                start_date=today,
                end_date=today + timedelta(days=180),
                stop_saving_date=today + timedelta(days=150),
                stop_borrowing_date=today + timedelta(days=150),
                member_admission_deadline=today + timedelta(days=30),
                max_loan_percentage=Decimal('80.00'),
                is_active=True,
            )
            self.stdout.write(f'  Group: {group.name}')
            self.stdout.write(f'  Cycle: {cycle.cycle_name} ends {cycle.end_date}')

        # ── MEMBERSHIPS ────────────────────────────────────────────────────────
        self.stdout.write('\nAdding members to group...')

        for user in [treasurer, member1, member2, member3]:
            membership, created = Membership.objects.get_or_create(
                user=user, group=group,
                defaults={'status': 'active'}
            )
            status = 'joined' if created else 'already in group'
            self.stdout.write(f'  {user.username}: {status}')

            account, _ = MemberAccount.objects.get_or_create(
                member=user, group=group, defaults={'balance': Decimal('0.00')}
            )

        # ── CONTRIBUTIONS ─────────────────────────────────────────────────────
        self.stdout.write('\nCreating contributions...')

        for user in [treasurer, member1, member2, member3]:
            existing = Contribution.objects.filter(
                member=user, group=group, status='confirmed'
            ).count()
            if existing >= 3:
                self.stdout.write(f'  {user.username}: contributions already exist, skipping')
                continue

            for i in range(3):
                Contribution.objects.create(
                    member=user,
                    group=group,
                    amount=Decimal('200.00'),
                    status='confirmed',
                    note=f'Monthly contribution {i + 1}',
                )
            self.stdout.write(
                f'  {user.username}: 3 × K200 confirmed (K600 total savings)'
            )

        # Pending contribution from member3 — treasurer will confirm this during UAT
        pending_exists = Contribution.objects.filter(
            member=member3, group=group, status='pending'
        ).exists()
        if not pending_exists:
            Contribution.objects.create(
                member=member3,
                group=group,
                amount=Decimal('200.00'),
                status='pending',
                note='Monthly contribution 4',
            )
            self.stdout.write(
                f'  {member3.username}: 1 pending contribution of K200 '
                f'(treasurer needs to confirm this)'
            )

        # ── LOANS ─────────────────────────────────────────────────────────────
        self.stdout.write('\nCreating loans...')

        cycle = group.active_cycle

        # Member 1: approved loan, partially repaid — shows repayment history
        loan1_exists = Loan.objects.filter(
            member=member1, group=group, status='approved'
        ).exists()
        if not loan1_exists:
            loan1 = Loan.objects.create(
                member=member1,
                group=group,
                amount=Decimal('500.00'),
                interest_rate=Decimal('10.00'),
                status='approved',
                purpose='School fees',
                due_date=cycle.end_date if cycle else date.today() + timedelta(days=180),
                approved_at=timezone.now(),
            )
            LoanRepayment.objects.create(
                loan=loan1,
                amount=Decimal('200.00'),
                note='First repayment',
            )
            Transaction.objects.create(
                member=member1,
                group=group,
                transaction_type='loan_disbursement',
                amount=Decimal('500.00'),
                status='approved',
                note='Loan approved — school fees',
            )
            self.stdout.write(
                f'  {member1.username}: K500 loan approved, K200 repaid, '
                f'K{loan1.balance_remaining} remaining'
            )
        else:
            self.stdout.write(f'  {member1.username}: loan already exists, skipping')

        # Member 2: pending loan — treasurer will approve or reject during UAT
        loan2_exists = Loan.objects.filter(
            member=member2, group=group, status='pending'
        ).exists()
        if not loan2_exists:
            Loan.objects.create(
                member=member2,
                group=group,
                amount=Decimal('300.00'),
                status='pending',
                purpose='Small business stock',
            )
            self.stdout.write(
                f'  {member2.username}: K300 loan application PENDING '
                f'(treasurer approves this during UAT)'
            )
        else:
            self.stdout.write(f'  {member2.username}: pending loan already exists, skipping')

        # Member 3: no loan — clean slate for UAT participant to apply fresh
        self.stdout.write(
            f'  {member3.username}: no loan — clean slate for UAT participant'
        )

        # ── NOTICE ────────────────────────────────────────────────────────────
        self.stdout.write('\nCreating group notice...')

        notice_exists = Notice.objects.filter(group=group).exists()
        if not notice_exists:
            Notice.objects.create(
                group=group,
                posted_by=treasurer,
                title='Welcome to Lusaka Chilimba Group',
                content=(
                    'Welcome to our savings group. Our cycle runs for 6 months. '
                    'Please ensure your monthly contribution of at least K100 is '
                    'submitted on time. Loan applications are open — maximum loan '
                    'is double your total savings. Contact the treasurer for any '
                    'queries.'
                ),
            )
            self.stdout.write('  Welcome notice created')
        else:
            self.stdout.write('  Notice already exists, skipping')

        # ── SUMMARY ────────────────────────────────────────────────────────────
        self.stdout.write('\n' + '─' * 60)
        self.stdout.write(self.style.SUCCESS('UAT data ready. Login credentials:'))
        self.stdout.write('─' * 60)
        self.stdout.write(
            f'  TREASURER  username: uat_treasurer   password: UATpass123'
        )
        for username, first, last, *_ in members_data:
            user = User.objects.get(username=username)
            self.stdout.write(
                f'  MEMBER     username: {username:<16} password: UATpass123'
                f'   Member ID: {user.member_id}'
            )
        self.stdout.write('─' * 60)
        self.stdout.write(
            f'  Invite link: http://localhost:5173/join/{group.invite_token}/'
        )
        self.stdout.write('─' * 60)
        self.stdout.write('')
        self.stdout.write('What to tell your UAT participants:')
        self.stdout.write(
            '  Treasurer tasks: log in as uat_treasurer, the group already exists.'
        )
        self.stdout.write(
            '  Confirm uat_member3\'s pending contribution and approve uat_member2\'s loan.'
        )
        self.stdout.write(
            '  Member tasks: log in as uat_member3 (clean slate) '
            'or register a brand new account and use the invite link above to join.'
        )
