from django.urls import path
from .views import (
    GroupCreateView,
    GroupDetailView,
    GroupListView,
    JoinGroupView,
    GroupMembersView,
    NewCycleView,
    MemberStatusUpdateView,
    RemoveMemberView,
    ArchiveGroupView,
    LoanAvailabilityView
)

urlpatterns = [
    path('', GroupListView.as_view(), name='group-list'),
    path('create/', GroupCreateView.as_view(), name='group-create'),
    path('<int:pk>/', GroupDetailView.as_view(), name='group-detail'),
    path('join/<uuid:token>/', JoinGroupView.as_view(), name='join-group'),
    path('<int:group_id>/members/', GroupMembersView.as_view(), name='group-members'),
    path('<int:group_id>/new-cycle/', NewCycleView.as_view(), name='new-cycle'),
    path('<int:group_id>/archive/', ArchiveGroupView.as_view(), name='archive-group'),
    path('<int:group_id>/members/<int:membership_id>/status/', MemberStatusUpdateView.as_view(), name='member-status'),
    path('<int:group_id>/members/<int:membership_id>/remove/', RemoveMemberView.as_view(), name='remove-member'),
    path('<int:group_id>/loan-availability/', LoanAvailabilityView.as_view(), name='loan-availability'),
]