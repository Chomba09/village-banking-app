from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count, Q
from decimal import Decimal
from groups.models import Group, Membership
from contributions.models import Contribution
from loans.models import Loan


class TreasurerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'treasurer':
            return Response({'error': 'Only treasurers can access this dashboard.'}, status=403)

        groups = Group.objects.filter(treasurer=request.user)
        group_summaries = []

        for group in groups:
            members_count = Membership.objects.filter(group=group, status='active').count()

            total_contributions = Contribution.objects.filter(
                group=group, status='confirmed'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            total_loans_issued = Loan.objects.filter(
                group=group, status__in=['approved', 'fully_paid']
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            pending_loans = Loan.objects.filter(
                group=group, status='pending'
            ).count()

            total_repaid = Decimal('0.00')
            approved_loans = Loan.objects.filter(group=group, status='approved')
            for loan in approved_loans:
                total_repaid += loan.total_repaid

            outstanding_balance = Decimal('0.00')
            for loan in approved_loans:
                outstanding_balance += loan.balance_remaining

            group_summaries.append({
                'group_id': group.id,
                'group_name': group.name,
                'members_count': members_count,
                'total_contributions': total_contributions,
                'total_loans_issued': total_loans_issued,
                'pending_loan_applications': pending_loans,
                'total_repaid': total_repaid,
                'outstanding_balance': outstanding_balance,
            })

        return Response({
            'treasurer': request.user.username,
            'total_groups': groups.count(),
            'groups': group_summaries,
        })


class MemberDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        memberships = Membership.objects.filter(
            user=request.user, status='active'
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
                status__in=['approved', 'fully_paid']
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            outstanding_loans = []
            for loan in my_loans.filter(status='approved'):
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
            group = Group.objects.get(id=group_id, treasurer=request.user)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found or access denied.'}, status=404)

        members = Membership.objects.filter(group=group, status='active')
        member_reports = []

        for membership in members:
            user = membership.user

            contributions = Contribution.objects.filter(
                member=user, group=group
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            loans = Loan.objects.filter(member=user, group=group)
            total_borrowed = loans.filter(
                status__in=['approved', 'fully_paid']
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            total_outstanding = Decimal('0.00')
            for loan in loans.filter(status='approved'):
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
            group=group, status__in=['approved', 'fully_paid']
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        return Response({
            'group_id': group.id,
            'group_name': group.name,
            'total_members': members.count(),
            'total_confirmed_contributions': total_contributions,
            'total_loans_issued': total_loans,
            'member_reports': member_reports,
        })