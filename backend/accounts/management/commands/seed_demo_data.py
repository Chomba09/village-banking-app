"""
Presentation Demo Data
======================
Builds a complete, realistic dataset that shows every feature of Smart Bank.

Run (first time):
    python manage.py seed_demo_data

Rebuild from scratch (e.g. after rehearsing the live steps):
    python manage.py seed_demo_data --reset

Only accounts with an email ending in @demo.smartbank and the three demo
groups are ever deleted by --reset, so real accounts are never touched.

All passwords:  Demo@2026

ROLE          USERNAME     NAME              WHAT THEY SHOW
Treasurer     thandi       Thandi Mwale      dashboard, overdue loans, approvals, penalties
Chairperson   mutale       Mutale Kunda      second loan approval queue
Member        bwalya       Bwalya Phiri      active loan, part repaid
Member        chanda       Chanda Tembo      loan fully repaid, member of 2 groups
Member        daliso       Daliso Banda      OVERDUE loan (penalty demo)
Member        esther       Esther Lungu      loan waiting for treasurer approval
Member        febby        Febby Mwansa      loan waiting for the chairperson
Member        gift         Gift Zulu         new saver, rejected loan, unpaid K20 penalty (pay it live)
New user      kondwani     Kondwani Sakala   in no group yet - joins live with the invite link
"""

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

User = get_user_model()

PASSWORD = 'Demo@2026'
EMAIL_DOMAIN = '@demo.smartbank'

MAIN_GROUP = 'Kabwata Community Savings Group'
SECOND_GROUP = 'Chilenje Youth Savings Club'
ARCHIVED_GROUP = 'Kabwata Community Savings Group (2025)'
DEMO_GROUPS = [MAIN_GROUP, SECOND_GROUP, ARCHIVED_GROUP]

# username, first, last, role, phone
PEOPLE = [
    ('thandi',   'Thandi',   'Mwale',  'treasurer',   '0971100001'),
    ('mutale',   'Mutale',   'Kunda',  'chairperson', '0971100002'),
    ('bwalya',   'Bwalya',   'Phiri',  'member',      '0971100003'),
    ('chanda',   'Chanda',   'Tembo',  'member',      '0971100004'),
    ('daliso',   'Daliso',   'Banda',  'member',      '0971100005'),
    ('esther',   'Esther',   'Lungu',  'member',      '0971100006'),
    ('febby',    'Febby',    'Mwansa', 'member',      '0971100007'),
    ('gift',     'Gift',     'Zulu',   'member',      '0971100008'),
    ('kondwani', 'Kondwani', 'Sakala', 'member',      '0971100009'),
]


def ago(days, hour=10):
    """Timezone-aware datetime `days` days before now, at a fixed hour."""
    dt = timezone.now() - timedelta(days=days)
    return dt.replace(hour=hour, minute=0, second=0, microsecond=0)


def backdate(obj, **fields):
    """
    Overwrite auto_now_add fields. .update() skips auto_now_add, which is the
    only way to give records realistic past dates.
    """
    type(obj).objects.filter(pk=obj.pk).update(**fields)


class Command(BaseCommand):
    help = 'Seeds a complete presentation demo dataset for Smart Bank.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset', action='store_true',
            help='Delete the existing demo data and rebuild it from scratch.',
        )

    def handle(self, *args, **options):
        from groups.models import Group

        usernames = [p[0] for p in PEOPLE]
        existing = User.objects.filter(username__in=usernames)

        # Never take over a real account that happens to share a username
        foreign = [u.username for u in existing if not (u.email or '').endswith(EMAIL_DOMAIN)]
        if foreign:
            self.stdout.write(self.style.ERROR(
                f'These usernames already belong to non-demo accounts: {", ".join(foreign)}. '
                f'Rename or delete them first.'
            ))
            return

        demo_exists = existing.exists() or Group.objects.filter(name__in=DEMO_GROUPS).exists()
        if demo_exists and not options['reset']:
            self.stdout.write(self.style.WARNING(
                'Demo data already exists. Run with --reset to rebuild it.'
            ))
            return

        with transaction.atomic():
            if demo_exists:
                self._reset()
            self._build()

    # ------------------------------------------------------------------ reset
    def _reset(self):
        from groups.models import Group
        Group.objects.filter(name__in=DEMO_GROUPS).delete()
        User.objects.filter(email__endswith=EMAIL_DOMAIN).delete()
        self.stdout.write(self.style.WARNING('Old demo data deleted.'))

    # ------------------------------------------------------------------ build
    def _build(self):
        from groups.models import Group, Cycle, Membership
        from transactions.models import MemberAccount

        today = date.today()

        # ── People ──────────────────────────────────────────────────────────
        u = {}
        for i, (username, first, last, role, phone) in enumerate(PEOPLE):
            user = User(
                username=username,
                first_name=first,
                last_name=last,
                role=role,
                phone_number=phone,
                email=f'{username}{EMAIL_DOMAIN}',
            )
            user.set_password(PASSWORD)
            user.save()
            User.objects.filter(pk=user.pk).update(date_joined=ago(130 - i))
            u[username] = user
        self.stdout.write(f'Created {len(u)} accounts')

        penalties = dict(
            late_loan_penalty=Decimal('50.00'),
            late_savings_penalty=Decimal('20.00'),
            no_savings_penalty=Decimal('30.00'),
            default_loan_penalty=Decimal('100.00'),
        )

        # ── Main group ──────────────────────────────────────────────────────
        g = Group.objects.create(
            name=MAIN_GROUP,
            description=(
                'A community savings group in Kabwata, Lusaka. Members save every month '
                'and lend to one another at 10% interest. Savings plus a share of the '
                'interest are paid out at the end of each cycle.'
            ),
            treasurer=u['thandi'],
            chairperson=u['mutale'],
            contact_person='0971100001',
            maximum_members=20,
            minimum_contribution=Decimal('100.00'),
            maximum_contribution=Decimal('1000.00'),
            interest_rate=Decimal('10.00'),
            **penalties,
        )
        backdate(g, created_at=ago(122))
        cycle = Cycle.objects.create(
            group=g,
            cycle_name='Cycle 1 - 2026',
            start_date=today - timedelta(days=120),
            end_date=today + timedelta(days=60),
            stop_saving_date=today + timedelta(days=45),
            stop_borrowing_date=today + timedelta(days=45),
            member_admission_deadline=today + timedelta(days=30),
            max_loan_percentage=Decimal('80.00'),
            is_active=True,
        )

        main_members = ['thandi', 'mutale', 'bwalya', 'chanda', 'daliso', 'esther', 'febby', 'gift']
        joined_days = {'gift': 62}
        for name in main_members:
            m = Membership.objects.create(user=u[name], group=g, status='active')
            backdate(m, date_joined=ago(joined_days.get(name, 118)))
            MemberAccount.objects.create(member=u[name], group=g, balance=Decimal('0.00'))

        # ── Contributions (monthly, last four months) ───────────────────────
        months = [117, 87, 57, 27]  # days ago for each monthly contribution
        plan = {
            'thandi': (300, months),
            'mutale': (300, months),
            'bwalya': (250, months),
            'chanda': (200, months),
            'daliso': (200, months),
            'esther': (150, months),
            'febby':  (200, months),
            'gift':   (100, [57, 27]),
        }
        for name, (amount, days_list) in plan.items():
            for n, d in enumerate(days_list, start=1):
                self._contribution(g, u[name], amount, 'confirmed', d, f'Month {n} savings')


        # ── Loans ───────────────────────────────────────────────────────────
        # Bwalya: active loan, part repaid, due at cycle end
        self._approved_loan(g, u['bwalya'], 1500, 'Restocking groceries for my shop',
                            applied=80, due=cycle.end_date, repayments=[(48, 300), (18, 300)])
        # Chanda: fully repaid
        self._approved_loan(g, u['chanda'], 800, "Child's school fees",
                            applied=100, due=cycle.end_date, repayments=[(70, 440), (40, 440)])
        # Daliso: OVERDUE - short-term loan agreed for 60 days, due 12 days ago
        self._approved_loan(g, u['daliso'], 1000, 'Fertiliser for the farming season',
                            applied=75, due=today - timedelta(days=12), repayments=[(45, 200)])

        # Esther: waiting for the treasurer (step 1 of 2)
        self._pending_loan(g, u['esther'], 600, 'Sewing machine for tailoring business',
                           applied=3)
        # Febby: treasurer approved, waiting for the chairperson (step 2 of 2)
        self._pending_loan(g, u['febby'], 500, 'Hospital bills', applied=4,
                           treasurer_approved=True)
        # Treasurer's own loan: cannot self-approve, needs the chairperson
        self._pending_loan(g, u['thandi'], 700, 'Roofing sheets', applied=1,
                           treasurer_approved=True, submitted_by_treasurer=True)
        # Gift: rejected (asked for more than double his savings at the time)
        from loans.models import Loan
        rejected = Loan.objects.create(
            member=u['gift'], group=g, amount=Decimal('400.00'), status='rejected',
            purpose='Phone repair', treasurer_approved=False,
        )
        backdate(rejected, applied_at=ago(38))

        # ── Penalty already on record (late savings) ────────────────────────
        self._penalty(g, u['gift'], Decimal('20.00'),
                      'Late savings contribution penalty', 25)

        # ── Notices ─────────────────────────────────────────────────────────
        self._notice(g, u['thandi'], 'Welcome to Cycle 1 - 2026',
                     'Welcome everyone. Savings are due by the 5th of every month, minimum K100. '
                     'You can borrow up to double your savings at 10% interest. '
                     'The late savings penalty is K20 and the late loan penalty is K50.', 118)
        self._notice(g, u['thandi'], 'Loan repayment reminder',
                     'Members with loans, please check your balance on your dashboard and keep '
                     'your repayments up to date. Overdue loans attract a K50 penalty.', 14)
        self._notice(g, u['thandi'], 'Monthly meeting this Saturday',
                     'Our monthly meeting is this Saturday at 14:00 at the Kabwata community hall. '
                     'We will review loans and agree on the share-out date.', 2)

        # ── Second active group (shows a treasurer managing several groups) ─
        g2 = Group.objects.create(
            name=SECOND_GROUP,
            description='A savings club for young traders at Chilenje market.',
            treasurer=u['thandi'],
            contact_person='0971100001',
            maximum_members=15,
            minimum_contribution=Decimal('50.00'),
            interest_rate=Decimal('5.00'),
            **penalties,
        )
        backdate(g2, created_at=ago(35))
        Cycle.objects.create(
            group=g2,
            cycle_name='Cycle 1 - 2026',
            start_date=today - timedelta(days=30),
            end_date=today + timedelta(days=150),
            stop_saving_date=today + timedelta(days=130),
            stop_borrowing_date=today + timedelta(days=130),
            member_admission_deadline=today + timedelta(days=60),
            max_loan_percentage=Decimal('70.00'),
            is_active=True,
        )
        for name in ['thandi', 'chanda', 'gift']:
            m = Membership.objects.create(user=u[name], group=g2, status='active')
            backdate(m, date_joined=ago(30))
            MemberAccount.objects.create(member=u[name], group=g2, balance=Decimal('0.00'))
        for name, amount in [('thandi', 100), ('chanda', 150), ('gift', 50)]:
            self._contribution(g2, u[name], amount, 'confirmed', 28, 'Month 1 savings')
        self._notice(g2, u['thandi'], 'Welcome to the club',
                     'Welcome to the Chilenje Youth Savings Club. Minimum saving is K50 a month.', 30)

        # ── Archived group: last year's finished cycle ──────────────────────
        g3 = Group.objects.create(
            name=ARCHIVED_GROUP,
            description='Last year\'s cycle of the Kabwata group, closed after share-out.',
            treasurer=u['thandi'],
            contact_person='0971100001',
            maximum_members=20,
            minimum_contribution=Decimal('100.00'),
            interest_rate=Decimal('10.00'),
            **penalties,
        )
        Cycle.objects.create(
            group=g3,
            cycle_name='Cycle 1 - 2025',
            start_date=today - timedelta(days=400),
            end_date=today - timedelta(days=220),
            stop_saving_date=today - timedelta(days=235),
            stop_borrowing_date=today - timedelta(days=235),
            member_admission_deadline=today - timedelta(days=370),
            max_loan_percentage=Decimal('80.00'),
            is_active=True,
        )
        for name in ['thandi', 'bwalya', 'chanda', 'esther']:
            m = Membership.objects.create(user=u[name], group=g3, status='active')
            backdate(m, date_joined=ago(398))
            MemberAccount.objects.create(member=u[name], group=g3, balance=Decimal('0.00'))
            for n, d in enumerate([395, 365, 335, 305, 275, 245], start=1):
                self._contribution(g3, u[name], 200, 'confirmed', d, f'Month {n} savings')
        self._approved_loan(g3, u['bwalya'], 1000, 'Shop stock', applied=350,
                            due=today - timedelta(days=220),
                            repayments=[(300, 550), (250, 550)], notify=False)
        backdate(g3, created_at=ago(402), is_archived=True, archived_at=ago(215))

        # ── Notifications (what each role sees in the bell) ─────────────────
        self._notifications(u)

        self._summary(g)

    # ------------------------------------------------------------ helpers
    def _contribution(self, group, user, amount, status, days, note):
        from contributions.models import Contribution
        from transactions.models import Transaction

        is_treasurer = group.treasurer_id == user.id
        c = Contribution.objects.create(
            member=user, group=group, amount=Decimal(str(amount)), status=status, note=note,
            submitted_by_treasurer=is_treasurer,
        )
        backdate(c, date=(timezone.now() - timedelta(days=days)).date(), created_at=ago(days))
        if status == 'confirmed':
            t = Transaction.objects.create(
                member=user, group=group, transaction_type='contribution',
                amount=Decimal(str(amount)), status='approved',
                note='Contribution automatically confirmed',
            )
            backdate(t, date=ago(days, hour=11))
        return c

    def _approved_loan(self, group, user, amount, purpose, applied, due, repayments,
                       notify=True):
        from loans.models import Loan, LoanRepayment
        from transactions.models import Transaction

        loan = Loan.objects.create(
            member=user, group=group, amount=Decimal(str(amount)),
            interest_rate=group.interest_rate, status='approved', purpose=purpose,
            treasurer_approved=True, chairperson_approved=True, due_date=due,
        )
        backdate(loan, applied_at=ago(applied), approved_at=ago(applied - 2))
        t = Transaction.objects.create(
            member=user, group=group, transaction_type='loan_disbursement',
            amount=loan.amount, status='approved', note='Loan approved - dual approval complete',
        )
        backdate(t, date=ago(applied - 2, hour=12))

        for days, rep_amount in repayments:
            r = LoanRepayment.objects.create(loan=loan, amount=Decimal(str(rep_amount)),
                                             note='Repayment')
            backdate(r, date=(timezone.now() - timedelta(days=days)).date())
            t = Transaction.objects.create(
                member=user, group=group, transaction_type='loan_repayment',
                amount=Decimal(str(rep_amount)), status='approved',
                note=f'Repayment for loan #{loan.id}',
            )
            backdate(t, date=ago(days, hour=13))
        return loan

    def _pending_loan(self, group, user, amount, purpose, applied,
                      treasurer_approved=False, submitted_by_treasurer=False):
        from loans.models import Loan
        loan = Loan.objects.create(
            member=user, group=group, amount=Decimal(str(amount)), status='pending',
            purpose=purpose, treasurer_approved=treasurer_approved,
            submitted_by_treasurer=submitted_by_treasurer,
        )
        backdate(loan, applied_at=ago(applied))
        return loan

    def _penalty(self, group, user, amount, description, days):
        from transactions.models import MemberAccount, Transaction
        account = MemberAccount.objects.get(member=user, group=group)
        account.balance += amount
        account.save()
        t = Transaction.objects.create(
            member=user, group=group, transaction_type='penalty', amount=amount,
            status='approved', note=description,
        )
        backdate(t, date=ago(days, hour=15))

    def _notice(self, group, author, title, content, days):
        from notices.models import Notice
        n = Notice.objects.create(group=group, posted_by=author, title=title, content=content)
        backdate(n, created_at=ago(days, hour=9))

    def _notifications(self, u):
        from notifications.models import Notification
        items = [
            # (user, message, days ago, read)
            ('thandi', f'febby made a contribution of K200.00 to {MAIN_GROUP}.', 27, False),
            ('thandi', f'esther has applied for a loan of K600.00 from {MAIN_GROUP}.', 3, False),
            ('thandi', f'febby has applied for a loan of K500.00 from {MAIN_GROUP}.', 4, True),
            ('thandi', f'gift has joined {MAIN_GROUP}.', 62, True),
            ('mutale', f'The treasurer has approved febby\'s loan of K500.00 in {MAIN_GROUP}. '
                       'Your approval is required to release the funds.', 4, False),
            ('mutale', f'The treasurer has applied for a loan of K700.00 from {MAIN_GROUP}. '
                       'Your approval is required to release the funds.', 1, False),
            ('bwalya', 'Your repayment of K300.00 has been recorded. '
                       'Remaining balance: K1050.00.', 18, False),
            ('bwalya', f'Your loan of K1500.00 from {MAIN_GROUP} has been fully approved. '
                       'Interest rate: 10.00%. Total due: K1650.00.', 78, True),
            ('chanda', 'Your repayment of K440.00 has been recorded. '
                       'Remaining balance: K0.00.', 40, False),
            ('daliso', 'Your repayment of K200.00 has been recorded. '
                       'Remaining balance: K900.00.', 45, True),
            ('esther', f'Your loan application of K600.00 to {MAIN_GROUP} has been received '
                       'and is awaiting approval.', 3, False),
            ('febby',  f'The treasurer has approved your loan of K500.00. '
                       'Waiting for the chairperson\'s approval.', 4, False),
            ('gift',   f'A penalty of K20.00 has been applied to your account in {MAIN_GROUP}: '
                       'Late savings contribution penalty.', 25, False),
            ('gift',   f'Your loan application of K400.00 in {MAIN_GROUP} was rejected.', 38, True),
            ('gift',   f'Welcome! You have successfully joined {MAIN_GROUP}.', 62, True),
        ]
        for name, message, days, read in items:
            n = Notification.objects.create(recipient=u[name], message=message, is_read=read)
            backdate(n, date=ago(days, hour=16))

    def _summary(self, group):
        from loans.utils import calculate_available_pool
        line = '-' * 64
        self.stdout.write('\n' + line)
        self.stdout.write(self.style.SUCCESS('Demo data ready.  Password for every account: '
                                             + PASSWORD))
        self.stdout.write(line)
        for username, first, last, role, _ in PEOPLE:
            user = User.objects.get(username=username)
            full_name = f'{first} {last}'
            self.stdout.write(f'  {role:<12} {username:<10} {full_name:<17} {user.member_id}')
        self.stdout.write(line)
        self.stdout.write(f'  Main group:   {group.name}')
        self.stdout.write(f'  Loan pool available now: K{calculate_available_pool(group)}')
        self.stdout.write(f'  Invite token for kondwani to join live: {group.invite_token}')
        self.stdout.write('  Invite link:  <your frontend URL>/join/' + str(group.invite_token))
        self.stdout.write(line)
