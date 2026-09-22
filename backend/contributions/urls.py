from django.urls import path
from .views import (
    ContributionCreateView,
    MemberContributionListView,
    GroupContributionListView,
    ContributionStatusUpdateView,
    GroupActivityView
)

urlpatterns = [
    path('make/', ContributionCreateView.as_view(), name='make-contribution'),
    path('my/', MemberContributionListView.as_view(), name='my-contributions'),
    path('group/<int:group_id>/', GroupContributionListView.as_view(), name='group-contributions'),
    path('<int:pk>/status/', ContributionStatusUpdateView.as_view(), name='update-contribution-status'),
    path('group/<int:group_id>/activity/', GroupActivityView.as_view(), name='group-activity'),
]