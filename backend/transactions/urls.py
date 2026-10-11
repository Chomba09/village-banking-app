from django.urls import path
from .views import (
    MemberTransactionListView,
    GroupTransactionListView,
    MemberAccountView
)

urlpatterns = [
    path('', MemberTransactionListView.as_view(), name='my-transactions'),
    path('group/<int:group_id>/', GroupTransactionListView.as_view(), name='group-transactions'),
    path('account/<int:group_id>/', MemberAccountView.as_view(), name='member-account'),
]