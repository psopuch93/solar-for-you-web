from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    """Rozszerzenie modelu User o dodatkowe pola"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Numer telefonu")
    address = models.TextField(blank=True, null=True, verbose_name="Adres")
    status = models.CharField(max_length=20, choices=[
        ('active', 'Aktywny'),
        ('inactive', 'Nieaktywny'),
        ('pending', 'Oczekujący')
    ], default='active', verbose_name="Status")

    # Uprawnienia przechowywane jako tekst z wartościami oddzielonymi przecinkami
    privileges = models.CharField(max_length=255, blank=True, default='',
                                 verbose_name="Uprawnienia (oddzielone przecinkami)")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}" if (self.user.first_name and self.user.last_name) else self.user.username

    class Meta:
        verbose_name = "Profil użytkownika"
        verbose_name_plural = "Profile użytkowników"

    # Metody pomocnicze do obsługi uprawnień
    def get_privileges_list(self):
        """Zwraca listę uprawnień użytkownika"""
        if not self.privileges:
            return []
        return [p.strip() for p in self.privileges.split(',')]

    def add_privilege(self, privilege):
        """Dodaje uprawnienie do listy"""
        privileges_list = self.get_privileges_list()
        if privilege not in privileges_list:
            privileges_list.append(privilege)
            self.privileges = ','.join(privileges_list)
            self.save()

    def remove_privilege(self, privilege):
        """Usuwa uprawnienie z listy"""
        privileges_list = self.get_privileges_list()
        if privilege in privileges_list:
            privileges_list.remove(privilege)
            self.privileges = ','.join(privileges_list)
            self.save()

    def has_privilege(self, privilege):
        """Sprawdza czy użytkownik ma dane uprawnienie"""
        return privilege in self.get_privileges_list()

    def has_any_privilege(self, privileges_list):
        """Sprawdza czy użytkownik ma którekolwiek z podanych uprawnień"""
        user_privileges = self.get_privileges_list()
        return any(p in user_privileges for p in privileges_list)

    def has_all_privileges(self, privileges_list):
        """Sprawdza czy użytkownik ma wszystkie podane uprawnienia"""
        user_privileges = self.get_privileges_list()
        return all(p in user_privileges for p in privileges_list)

class ProjectTag(models.Model):
    """Model dla tagów NFC projektów"""
    serial = models.CharField(max_length=50, unique=True, verbose_name="Numer seryjny NFC")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_project_tags', verbose_name="Utworzony przez")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_project_tags', verbose_name="Zaktualizowany przez")

    def __str__(self):
        return f"Tag NFC: {self.serial}"

    class Meta:
        verbose_name = "Tag projektu"
        verbose_name_plural = "Tagi projektów"

class Client(models.Model):
    """Model klienta"""
    name = models.CharField(max_length=200, verbose_name="Nazwa klienta")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_clients', verbose_name="Utworzony przez")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_clients', verbose_name="Zaktualizowany przez")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Klient"
        verbose_name_plural = "Klienci"

class Project(models.Model):
    """Model dla projektów solarnych"""
    STATUS_CHOICES = [
        ('new', 'Nowy'),
        ('in_progress', 'W trakcie'),
        ('completed', 'Zakończony'),
        ('cancelled', 'Anulowany'),
        ('on_hold', 'Wstrzymany')
    ]

    name = models.CharField(max_length=200, unique=True, verbose_name="Nazwa projektu")
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects', verbose_name="Klient")
    localization = models.TextField(blank=True, null=True, verbose_name="Lokalizacja")
    description = models.TextField(blank=True, null=True, verbose_name="Opis")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', verbose_name="Status")
    start_date = models.DateField(null=True, blank=True, verbose_name="Data rozpoczęcia")
    end_date = models.DateField(null=True, blank=True, verbose_name="Data zakończenia")
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Budżet")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")

    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True, verbose_name="Szerokość geograficzna")
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True, verbose_name="Długość geograficzna")
    country = models.CharField(max_length=100, blank=True, null=True, verbose_name="Kraj")
    city = models.CharField(max_length=100, blank=True, null=True, verbose_name="Miasto")
    street = models.CharField(max_length=255, blank=True, null=True, verbose_name="Ulica")
    post_code = models.CharField(max_length=20, blank=True, null=True, verbose_name="Kod pocztowy")
    project_tag = models.OneToOneField(ProjectTag, on_delete=models.SET_NULL, null=True, blank=True, related_name='project', verbose_name="Tag projektu")

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_projects', verbose_name="Utworzony przez")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_projects', verbose_name="Zaktualizowany przez")


    def __str__(self):
        client_name = self.client.name if self.client else "Brak klienta"
        return f"{self.name} - {client_name}"

    class Meta:
        verbose_name = "Projekt"
        verbose_name_plural = "Projekty"