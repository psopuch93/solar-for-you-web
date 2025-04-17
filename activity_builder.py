import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "solarforyou.settings")
django.setup()

from api.models import Project, ProjectActivityConfig
import json

# Wczytaj plik JSON
with open('/home/foryougroup/solarforyou/media/activity_configs/14.json', 'r') as f:
    json_data = json.load(f)

# Utwórz rekord w bazie danych
project = Project.objects.get(id=14)  # Zastąp projekt_id rzeczywistym ID
config = ProjectActivityConfig.objects.create(
    project=project,
    config_data=json_data,
    created_by=None  # lub rzeczywisty użytkownik, jeśli masz do niego dostęp
)