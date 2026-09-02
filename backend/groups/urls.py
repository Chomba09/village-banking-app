from django.urls import path
from .views import (
    GroupCreateView,
    GroupDetailView,
    GroupListView,
    JoinGroupView,
    GroupMembersView,
    NewCycleView
)

urlpatterns = [
    path('', GroupListView.as_view(), name='group-list'),
    path('create/', GroupCreateView.as_view(), name='group-create'),
    path('<int:pk>/', GroupDetailView.as_view(), name='group-detail'),
    path('join/<uuid:token>/', JoinGroupView.as_view(), name='join-group'),
    path('<int:group_id>/members/', GroupMembersView.as_view(), name='group-members'),
    path('<int:group_id>/new-cycle/', NewCycleView.as_view(), name='new-cycle'),
]