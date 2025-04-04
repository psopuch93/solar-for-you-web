# Generated by Django 5.1.7 on 2025-03-19 09:59

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Project",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "name",
                    models.CharField(max_length=200, verbose_name="Nazwa projektu"),
                ),
                ("localization", models.TextField(verbose_name="Lokalizacja")),
                (
                    "description",
                    models.TextField(blank=True, null=True, verbose_name="Opis"),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("new", "Nowy"),
                            ("in_progress", "W trakcie"),
                            ("completed", "Zakończony"),
                            ("cancelled", "Anulowany"),
                            ("on_hold", "Wstrzymany"),
                        ],
                        default="new",
                        max_length=20,
                        verbose_name="Status",
                    ),
                ),
                (
                    "start_date",
                    models.DateField(
                        blank=True, null=True, verbose_name="Data rozpoczęcia"
                    ),
                ),
                (
                    "end_date",
                    models.DateField(
                        blank=True, null=True, verbose_name="Data zakończenia"
                    ),
                ),
                (
                    "budget",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=10,
                        null=True,
                        verbose_name="Budżet",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True, verbose_name="Data utworzenia"
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True, verbose_name="Data aktualizacji"
                    ),
                ),
                (
                    "client",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="projects",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Klient",
                    ),
                ),
            ],
            options={
                "verbose_name": "Projekt",
                "verbose_name_plural": "Projekty",
            },
        ),
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "phone",
                    models.CharField(
                        blank=True,
                        max_length=20,
                        null=True,
                        verbose_name="Numer telefonu",
                    ),
                ),
                (
                    "address",
                    models.TextField(blank=True, null=True, verbose_name="Adres"),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("active", "Aktywny"),
                            ("inactive", "Nieaktywny"),
                            ("pending", "Oczekujący"),
                        ],
                        default="active",
                        max_length=20,
                        verbose_name="Status",
                    ),
                ),
                (
                    "privileges",
                    models.CharField(
                        blank=True,
                        default="",
                        max_length=255,
                        verbose_name="Uprawnienia (oddzielone przecinkami)",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True, verbose_name="Data utworzenia"
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True, verbose_name="Data aktualizacji"
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Profil użytkownika",
                "verbose_name_plural": "Profile użytkowników",
            },
        ),
    ]
