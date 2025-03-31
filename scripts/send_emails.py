# scripts/send_emails.py

import os
import sys
import django
import time
import logging
from datetime import datetime, timedelta

# Konfiguruj logowanie
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] - %(message)s',
    handlers=[
        logging.FileHandler('/home/foryougroup/logs/email_sender.log'),
        logging.StreamHandler()
    ]
)

# Dodaj ścieżkę do projektu Django
sys.path.append('/home/foryougroup/solarforyou')  # Dostosuj do swojej ścieżki

# Ustaw zmienną środowiskową DJANGO_SETTINGS_MODULE
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'solarforyou.settings')

# Inicjalizuj Django
django.setup()

# Teraz możemy importować modele Django
from api.models import Requisition
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def send_pending_emails():
    """Wysyła e-maile dla zapotrzebowań, które nie miały jeszcze wysłanego powiadomienia"""
    # Przyjmujemy, że dodasz pole 'email_sent' do modelu Requisition
    try:
        # Pobierz zapotrzebowania bez wysłanego e-maila, nie starsze niż 24h
        time_threshold = datetime.now() - timedelta(hours=24)
        pending_requisitions = Requisition.objects.filter(
            email_sent=False,
            created_at__gte=time_threshold
        )

        count = 0
        for requisition in pending_requisitions:
            if send_requisition_notification(requisition):
                requisition.email_sent = True
                requisition.save()
                count += 1

        if count > 0:
            logging.info(f"Wysłano {count} powiadomień e-mail")
        else:
            logging.info("Brak nowych zapotrzebowań do wysłania powiadomień")

    except Exception as e:
        logging.error(f"Błąd podczas wysyłania e-maili: {str(e)}")

def send_requisition_notification(requisition):
    """Wysyła e-mail z powiadomieniem o nowym zapotrzebowaniu"""
    try:
        # Pobierz adres e-mail odbiorcy z ustawień
        recipient_email = settings.REQUISITION_NOTIFICATION_EMAIL

        if not recipient_email:
            logging.warning("Brak skonfigurowanego adresu e-mail dla powiadomień o zapotrzebowaniach")
            return False

        # Przygotuj temat e-maila
        subject = f"Nowe zapotrzebowanie: {requisition.number}"

        # Pobierz nazwę projektu
        project_name = requisition.project.name if requisition.project else "Brak projektu"

        # Pobierz przedmioty
        items = requisition.items.all()

        # Oblicz wartość całkowitą
        total_value = sum(item.price * item.quantity for item in items if item.price)

        # Przygotuj kontekst dla szablonu
        context = {
            'requisition': requisition,
            'project_name': project_name,
            'items': items,
            'total_value': total_value,
            'comment': requisition.comment
        }

        # Wyrenderuj wiadomość e-mail z szablonu
        html_message = render_to_string('emails/requisition_notification.html', context)
        plain_message = strip_tags(html_message)

        # Wyślij e-mail
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )

        logging.info(f"Wysłano powiadomienie o zapotrzebowaniu {requisition.number} do {recipient_email}")
        return True

    except Exception as e:
        logging.error(f"Błąd wysyłania powiadomienia o zapotrzebowaniu: {str(e)}")
        return False

if __name__ == "__main__":
    logging.info("Uruchomiono skrypt wysyłania e-maili")
    send_pending_emails()