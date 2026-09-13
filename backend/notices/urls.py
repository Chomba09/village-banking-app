from django.urls import path
from .views import NoticeCreateView, GroupNoticeListView

urlpatterns = [
    path('create/', NoticeCreateView.as_view(), name='create-notice'),
    path('group/<int:group_id>/', GroupNoticeListView.as_view(), name='group-notices'),
]