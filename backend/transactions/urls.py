from django.urls import path
from .views import (
    DepositWithdrawalView,
    MemberTransactionListView,
    GroupTransactionListView,
    MemberAccountView,
    PendingWithdrawalListView,
    WithdrawalApprovalView
)

urlpatterns = [
    path('', MemberTransactionListView.as_view(), name='my-transactions'),
    path('deposit-withdraw/', DepositWithdrawalView.as_view(), name='deposit-withdrawal'),
    path('group/<int:group_id>/', GroupTransactionListView.as_view(), name='group-transactions'),
    path('account/<int:group_id>/', MemberAccountView.as_view(), name='member-account'),
    path('withdrawals/pending/', PendingWithdrawalListView.as_view(), name='pending-withdrawals'),
    path('withdrawals/<int:pk>/approve/', WithdrawalApprovalView.as_view(), name='approve-withdrawal'),
]