from django.urls import path
from .views import TreasurerDashboardView, MemberDashboardView, GroupFinancialReportView

urlpatterns = [
    path('treasurer/', TreasurerDashboardView.as_view(), name='treasurer-dashboard'),
    path('member/', MemberDashboardView.as_view(), name='member-dashboard'),
    path('group/<int:group_id>/report/', GroupFinancialReportView.as_view(), name='group-report'),
]