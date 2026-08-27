from .models import Notification


def send_notification(recipient, message):
    Notification.objects.create(
        recipient=recipient,
        message=message
    )