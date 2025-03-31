"""
Utilities for sending emails
"""
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

def send_requisition_notification(requisition):
    """
    Send an email notification about a new requisition

    Args:
        requisition: Requisition object with related project and items
    """
    try:
        # Get recipient email from settings
        recipient_email = settings.REQUISITION_NOTIFICATION_EMAIL

        if not recipient_email:
            logger.warning("No recipient email configured for requisition notifications")
            return False

        # Prepare email subject
        subject = f"Nowe zapotrzebowanie: {requisition.number}"

        # Get project name safely
        project_name = requisition.project.name if requisition.project else "Brak projektu"

        # Get items
        items = requisition.items.all()

        # Calculate total value
        total_value = sum(item.price * item.quantity for item in items if item.price)

        # Prepare context for template
        context = {
            'requisition': requisition,
            'project_name': project_name,
            'items': items,
            'total_value': total_value,
            'comment': requisition.comment
        }

        # Render email message from template
        html_message = render_to_string('emails/requisition_notification.html', context)
        plain_message = strip_tags(html_message)

        # Send email
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Sent requisition notification for {requisition.number} to {recipient_email}")
        return True

    except Exception as e:
        logger.error(f"Error sending requisition notification: {str(e)}")
        return False