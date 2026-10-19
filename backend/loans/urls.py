from django.urls import path
from .views import (
    LoanApplyView,
    MemberLoanListView,
    GroupLoanListView,
    LoanStatusUpdateView,
    LoanRepaymentView,
    LoanDetailView,
    GroupLoanActivityView,
    ChairpersonPendingLoansView,
    ChairpersonLoanApprovalView,
    ApplyPenaltyView,
    PayPenaltyView,
)

urlpatterns = [
    path('apply/', LoanApplyView.as_view(), name='loan-apply'),
    path('my/', MemberLoanListView.as_view(), name='my-loans'),
    path('group/<int:group_id>/', GroupLoanListView.as_view(), name='group-loans'),
    path('<int:pk>/status/', LoanStatusUpdateView.as_view(), name='loan-status'),
    path('<int:pk>/', LoanDetailView.as_view(), name='loan-detail'),
    path('repay/', LoanRepaymentView.as_view(), name='loan-repay'),
    path('group/<int:group_id>/activity/', GroupLoanActivityView.as_view(), name='group-loan-activity'),
    path('chairperson/pending/', ChairpersonPendingLoansView.as_view(), name='chairperson-pending-loans'),
    path('<int:pk>/chairperson-approve/', ChairpersonLoanApprovalView.as_view(), name='chairperson-loan-approval'),
    path('apply-penalty/', ApplyPenaltyView.as_view(), name='apply-penalty'),
    path('pay-penalty/', PayPenaltyView.as_view(), name='pay-penalty'),
]
