from django.urls import path
from .views import (
    LoanApplyView,
    MemberLoanListView,
    GroupLoanListView,
    LoanStatusUpdateView,
    LoanRepaymentView,
    LoanDetailView
)

urlpatterns = [
    path('apply/', LoanApplyView.as_view(), name='loan-apply'),
    path('my/', MemberLoanListView.as_view(), name='my-loans'),
    path('group/<int:group_id>/', GroupLoanListView.as_view(), name='group-loans'),
    path('<int:pk>/status/', LoanStatusUpdateView.as_view(), name='loan-status'),
    path('<int:pk>/', LoanDetailView.as_view(), name='loan-detail'),
    path('repay/', LoanRepaymentView.as_view(), name='loan-repay'),
]