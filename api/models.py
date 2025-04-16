from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q, UniqueConstraint
import datetime

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

class Empl_tag(models.Model):
    """Model for employee NFC tags"""
    serial = models.CharField(max_length=50, unique=True, verbose_name="NFC Serial Number")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_employee_tags', verbose_name="Created by")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_employee_tags', verbose_name="Updated by")

    def __str__(self):
        return f"Employee NFC Tag: {self.serial}"

    class Meta:
        verbose_name = "Employee Tag"
        verbose_name_plural = "Employee Tags"

class Quarter(models.Model):
    """Model for employee housing quarters"""
    name = models.CharField(max_length=200, verbose_name="Nazwa kwatery")
    address = models.TextField(verbose_name="Adres")
    city = models.CharField(max_length=100, verbose_name="Miasto")
    country = models.CharField(max_length=100, default="Polska", verbose_name="Kraj")
    payment_day = models.PositiveSmallIntegerField(default=1, verbose_name="Dzień płatności")
    max_occupants = models.PositiveSmallIntegerField(default=1, verbose_name="Maksymalna liczba osób")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_quarters', verbose_name="Utworzony przez")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_quarters', verbose_name="Zaktualizowany przez")

    def __str__(self):
        return f"{self.name} ({self.city})"

    class Meta:
        verbose_name = "Kwatera"
        verbose_name_plural = "Kwatery"

class Employee(models.Model):
    """Model pracownika"""
    first_name = models.CharField(max_length=100, verbose_name="Imię")
    last_name = models.CharField(max_length=100, verbose_name="Nazwisko")
    # Usuń unique=True z definicji pola
    pesel = models.CharField(max_length=11, null=True, blank=True, verbose_name="PESEL")
    current_project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees', verbose_name="Aktualny projekt")
    employee_tag = models.OneToOneField(Empl_tag, on_delete=models.SET_NULL, null=True, blank=True, related_name='employee', verbose_name="Tag pracownika")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_employees', verbose_name="Utworzony przez")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_employees', verbose_name="Zaktualizowany przez")
    quarter = models.ForeignKey(Quarter, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees', verbose_name="Przydzielona kwatera")

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        verbose_name = "Pracownik"
        verbose_name_plural = "Pracownicy"
        # Dodaj constraint, który zapewnia unikalność tylko niepustych wartości PESEL
        constraints = [
            UniqueConstraint(
                fields=['pesel'],
                condition=~Q(pesel=None) & ~Q(pesel=''),
                name='unique_pesel_if_not_empty'
            )
        ]

class Item(models.Model):
    """Model dla przedmiotów, które można zamówić"""
    AREA_CHOICES = [
        ('IT', 'IT'),
        ('warehouse', 'Magazyn'),
    ]

    name = models.CharField(max_length=200, unique=True, verbose_name="Nazwa")
    area = models.CharField(max_length=20, choices=AREA_CHOICES, verbose_name="Obszar")
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Cena")
    index = models.CharField(max_length=100, unique=True, verbose_name="Indeks")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_items', verbose_name="Utworzony przez")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_items', verbose_name="Zaktualizowany przez")

    def __str__(self):
        return f"{self.name} ({self.index})"

    def save(self, *args, **kwargs):
        # Generowanie indeksu, jeśli nie jest ustawiony
        if not self.index:
            # Pobierz ostatni indeks i zwiększ go o 1
            last_item = Item.objects.order_by('-id').first()
            if last_item and last_item.index:
                # Wyciągnij numer z ostatniego indeksu
                try:
                    last_number = int(last_item.index)
                    new_number = last_number + 1
                except ValueError:
                    new_number = 1
            else:
                new_number = 1

            # Sformatuj jako 6-cyfrowy numer
            self.index = f"{new_number:06d}"

        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Przedmiot"
        verbose_name_plural = "Przedmioty"

class Requisition(models.Model):
    """Model nagłówka zapotrzebowania"""
    TYPE_CHOICES = [
        ('material', 'Materiałowe'),
        ('hr', 'HR'),
    ]

    REQUISITION_STATUS_CHOICES = [
        ('to_accept', 'Do akceptacji'),
        ('accepted', 'Zaakceptowano'),
        ('rejected', 'Odrzucono'),
        ('in_progress', 'W trakcie realizacji'),
        ('completed', 'Zrealizowano')
    ]

    number = models.CharField(max_length=100, unique=True, verbose_name="Numer zapotrzebowania")
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, related_name='requisitions', verbose_name="Projekt")
    deadline = models.DateField(verbose_name="Termin realizacji")
    requisition_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='material', verbose_name="Typ zapotrzebowania")
    status = models.CharField(max_length=20, choices=REQUISITION_STATUS_CHOICES, default='to_accept', verbose_name="Status")
    comment = models.TextField(blank=True, null=True, verbose_name="Komentarz")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_requisitions', verbose_name="Utworzony przez")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_requisitions', verbose_name="Zaktualizowany przez")
    email_sent = models.BooleanField(default=False, verbose_name="E-mail wysłany")

    def __str__(self):
        return f"{self.number} - {self.project.name if self.project else 'Brak projektu'}"

    def save(self, *args, **kwargs):
        # Generowanie numeru zapotrzebowania, jeśli nie jest ustawiony
        if not self.number:
            today = datetime.date.today()
            year = today.year
            month = today.month
            day = today.day

            # Prefiks numeru zapotrzebowania dla dzisiejszego dnia
            prefix = f"ZAP/{year}/{month:02d}/{day:02d}/"

            # Znajdź zapotrzebowania z tym samym prefiksem (tego samego dnia)
            today_requisitions = Requisition.objects.filter(
                number__startswith=prefix
            )

            # Znajdź najwyższy numer
            max_number = 0
            for req in today_requisitions:
                try:
                    # Wyciągnij numer z końca (po ostatnim "/")
                    num = int(req.number.split('/')[-1])
                    if num > max_number:
                        max_number = num
                except (ValueError, IndexError):
                    pass

            # Ustaw nowy numer jako najwyższy + 1
            self.number = f"{prefix}{max_number + 1}"

        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Zapotrzebowanie"
        verbose_name_plural = "Zapotrzebowania"

class RequisitionItem(models.Model):
    """Model pozycji zapotrzebowania"""
    requisition = models.ForeignKey('Requisition', on_delete=models.CASCADE, related_name='items', verbose_name="Zapotrzebowanie")
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='requisition_items', verbose_name="Przedmiot")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Ilość")
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=False, verbose_name="Cena")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")

    def __str__(self):
        return f"{self.item.name} x {self.quantity} w {self.requisition.number}"

    def save(self, *args, **kwargs):
        # Jeśli cena nie jest podana, użyj ceny przedmiotu
        if not self.price and self.item and self.item.price:
            self.price = self.item.price

        # Jeśli nadal nie ma ceny, podnieś wyjątek
        if not self.price:
            raise ValidationError('Cena jest wymagana')

        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Pozycja zapotrzebowania"
        verbose_name_plural = "Pozycje zapotrzebowań"
        constraints = [
            models.CheckConstraint(
                check=models.Q(price__gt=0),
                name='positive_price_constraint'
            )
        ]

class QuarterImage(models.Model):
    """Model dla zdjęć kwater pracowniczych"""
    quarter = models.ForeignKey(Quarter, on_delete=models.CASCADE, related_name='images', verbose_name="Kwatera")
    image = models.ImageField(upload_to='quarter_images/', verbose_name="Zdjęcie")
    name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Nazwa zdjęcia")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_quarter_images', verbose_name="Utworzony przez")

    class Meta:
        verbose_name = "Zdjęcie kwatery"
        verbose_name_plural = "Zdjęcia kwater"
        ordering = ['-created_at']

    def __str__(self):
        return f"Zdjęcie kwatery {self.quarter.name} ({self.id})"

class UserSettings(models.Model):
    """Model przechowujący ustawienia użytkownika, w tym przypisanie do projektu"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_settings')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_users')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")

    def __str__(self):
        return f"Ustawienia dla {self.user.username}"

    class Meta:
        verbose_name = "Ustawienia użytkownika"
        verbose_name_plural = "Ustawienia użytkowników"

class BrigadeMember(models.Model):
    """Model reprezentujący członka brygady"""
    brigade_leader = models.ForeignKey(User, on_delete=models.CASCADE, related_name='brigade_members')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='brigade_assignments')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")

    def __str__(self):
        return f"{self.employee} w brygadzie {self.brigade_leader.username}"

    def save(self, *args, **kwargs):
        # Jeśli lider brygady ma przypisany projekt, przypisz go również pracownikowi
        try:
            leader_settings = UserSettings.objects.get(user=self.brigade_leader)
            if leader_settings.project:
                self.employee.current_project = leader_settings.project
                self.employee.save()
        except UserSettings.DoesNotExist:
            pass

        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Członek brygady"
        verbose_name_plural = "Członkowie brygady"
        unique_together = ('brigade_leader', 'employee')

# Sygnał do aktualizacji członków brygady po zmianie projektu
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=UserSettings)
def update_brigade_members_project(sender, instance, **kwargs):
    """Aktualizuje projekt dla wszystkich członków brygady po zmianie projektu lidera"""
    if instance.project:
        # Pobierz wszystkich członków brygady
        brigade_members = BrigadeMember.objects.filter(brigade_leader=instance.user)
        for member in brigade_members:
            if member.employee.current_project != instance.project:
                member.employee.current_project = instance.project
                member.employee.save()

class ProgressReport(models.Model):
    """Model reprezentujący raport postępu prac z danego dnia"""
    date = models.DateField(verbose_name="Data raportu")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='progress_reports', verbose_name="Projekt")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_progress_reports', verbose_name="Utworzony przez")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")
    is_draft = models.BooleanField(default=False, verbose_name="Draft Status")

    def __str__(self):
        return f"Raport z dnia {self.date} - {self.project.name}"

    class Meta:
        verbose_name = "Raport postępu"
        verbose_name_plural = "Raporty postępu"
        unique_together = ('date', 'project', 'created_by')  # Jeden raport na dzień dla projektu od danego użytkownika

class ProgressReportEntry(models.Model):
    """Model reprezentujący pojedynczy wpis w raporcie postępu dla danego pracownika"""
    report = models.ForeignKey(ProgressReport, on_delete=models.CASCADE, related_name='entries', verbose_name="Raport")
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='progress_entries', verbose_name="Pracownik")
    hours_worked = models.DecimalField(max_digits=4, decimal_places=1, default=0, verbose_name="Przepracowane godziny")
    notes = models.TextField(blank=True, null=True, verbose_name="Notatki")

    def __str__(self):
        return f"{self.employee} - {self.hours_worked}h ({self.report.date})"

    class Meta:
        verbose_name = "Wpis w raporcie postępu"
        verbose_name_plural = "Wpisy w raportach postępu"
        unique_together = ('report', 'employee')  # Jeden wpis dla pracownika w raporcie

class ProgressReportImage(models.Model):
    """Model dla zdjęć w raportach postępu prac"""
    report = models.ForeignKey(ProgressReport, on_delete=models.CASCADE, related_name='images', verbose_name="Raport")
    image = models.ImageField(upload_to='progress_report_images/', verbose_name="Zdjęcie")
    name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Nazwa zdjęcia")
    description = models.TextField(blank=True, null=True, verbose_name="Opis zdjęcia")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_progress_report_images', verbose_name="Utworzony przez")

    class Meta:
        verbose_name = "Zdjęcie raportu postępu"
        verbose_name_plural = "Zdjęcia raportów postępu"
        ordering = ['-created_at']

    def __str__(self):
        return f"Zdjęcie raportu {self.report.date} ({self.id})"

class HRRequisition(models.Model):
    """Model dla zapotrzebowań HR"""

    # Opcje stanowisk
    POSITION_CHOICES = [
        ('brygadzista', 'Brygadzista'),
        ('brygada_elektryków', 'Brygada elektryków'),
        ('brygada_monterów', 'Brygada monterów'),
        ('elektromonter', 'Elektromonter'),
        ('kafar', 'Kafar'),
        ('koparka', 'Koparka'),
        ('mini_ladowarka', 'Mini ładowarka gąsienicowa'),
        ('monter', 'Monter'),
        ('starszy_elektryk', 'Starszy elektryk'),
        ('starszy_monter', 'Starszy monter'),
        ('miernica', 'Miernica'),
    ]

    # Opcje doświadczenia
    EXPERIENCE_CHOICES = [
        ('konstrukcja', 'Na konstrukcji'),
        ('panele', 'Na panelach'),
        ('elektryka', 'Elektryka'),
        ('operator', 'Operator'),
        ('brak', 'Brak'),
    ]

    number = models.CharField(max_length=100, unique=True, verbose_name="Numer zapotrzebowania")
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, related_name='hr_requisitions', verbose_name="Projekt")
    deadline = models.DateField(verbose_name="Termin realizacji")
    status = models.CharField(
        max_length=20,
        choices=Requisition.REQUISITION_STATUS_CHOICES,
        default='to_accept',
        verbose_name="Status"
    )
    special_requirements = models.TextField(blank=True, null=True, verbose_name="Specjalne wymagania")
    experience = models.CharField(
        max_length=20,
        choices=EXPERIENCE_CHOICES,
        default='brak',
        verbose_name="Wymagane doświadczenie"
    )
    comment = models.TextField(blank=True, null=True, verbose_name="Komentarz")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_hr_requisitions', verbose_name="Utworzony przez")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_hr_requisitions', verbose_name="Zaktualizowany przez")
    email_sent = models.BooleanField(default=False, verbose_name="E-mail wysłany")

    def __str__(self):
        return f"{self.number} - {self.project.name if self.project else 'Brak projektu'}"

    def save(self, *args, **kwargs):
        # Generowanie numeru zapotrzebowania HR, jeśli nie jest ustawiony
        if not self.number:
            today = datetime.date.today()
            year = today.year
            month = today.month
            day = today.day

            # Prefiks numeru zapotrzebowania HR dla dzisiejszego dnia
            prefix = f"HR/{year}/{month:02d}/{day:02d}/"

            # Znajdź zapotrzebowania z tym samym prefiksem (tego samego dnia)
            today_requisitions = HRRequisition.objects.filter(
                number__startswith=prefix
            )

            # Znajdź najwyższy numer
            max_number = 0
            for req in today_requisitions:
                try:
                    # Wyciągnij numer z końca (po ostatnim "/")
                    num = int(req.number.split('/')[-1])
                    if num > max_number:
                        max_number = num
                except (ValueError, IndexError):
                    pass

            # Ustaw nowy numer jako najwyższy + 1
            self.number = f"{prefix}{max_number + 1}"

        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Zapotrzebowanie HR"
        verbose_name_plural = "Zapotrzebowania HR"


class HRRequisitionPosition(models.Model):
    """Model dla pozycji (stanowisk) w zapotrzebowaniu HR"""
    hr_requisition = models.ForeignKey('HRRequisition', on_delete=models.CASCADE, related_name='positions', verbose_name="Zapotrzebowanie HR")
    position = models.CharField(max_length=50, choices=HRRequisition.POSITION_CHOICES, verbose_name="Stanowisko")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Ilość")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")

    def __str__(self):
        return f"{self.get_position_display()} x {self.quantity} w {self.hr_requisition.number}"

    class Meta:
        verbose_name = "Pozycja zapotrzebowania HR"
        verbose_name_plural = "Pozycje zapotrzebowań HR"

class TransportRequest(models.Model):
    """Model zapotrzebowania na transport"""
    LOADING_METHOD_CHOICES = [
        ('external', 'Firma zewnętrzna'),
        ('internal', 'Nasz wewnętrzny'),
    ]

    STATUS_CHOICES = [
        ('new', 'Nowy'),
        ('accepted', 'Zaakceptowany'),
        ('in_progress', 'W realizacji'),
        ('completed', 'Zrealizowany'),
        ('cancelled', 'Anulowany')
    ]

    # Miejsca załadunku i rozładunku
    pickup_project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pickup_transports',
        verbose_name="Projekt załadunku"
    )
    pickup_address = models.TextField(null=True, blank=True, verbose_name="Adres załadunku")
    pickup_date = models.DateField(verbose_name="Data załadunku")

    delivery_project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='delivery_transports',
        verbose_name="Projekt rozładunku"
    )
    delivery_address = models.TextField(null=True, blank=True, verbose_name="Adres rozładunku")
    delivery_date = models.DateField(verbose_name="Data rozładunku")

    # Sposób transportu
    loading_method = models.CharField(
        max_length=20,
        choices=LOADING_METHOD_CHOICES,
        default='external',
        verbose_name="Sposób załadunku i rozładunku"
    )

    # Projekt kosztowy
    cost_project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        related_name='cost_transports',
        verbose_name="Projekt kosztowy"
    )

    # Informacje kontaktowe
    requester_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Numer telefonu zamawiającego"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Uwagi")

    # Status i dane utworzenia
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        verbose_name="Status"
    )
    number = models.CharField(max_length=50, unique=True, verbose_name="Numer transportu")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_transports',
        verbose_name="Utworzony przez"
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_transports',
        verbose_name="Zaktualizowany przez"
    )

    def save(self, *args, **kwargs):
        # Generowanie numeru transportu przy pierwszym zapisie
        if not self.number:
            today = datetime.date.today()

            # Format numeru: TR/YYYY/MM/DD/XXX
            prefix = f"TR/{today.year}/{today.month:02d}/{today.day:02d}/"

            # Znajdź transporty z tym samym prefiksem (z tego samego dnia)
            today_transports = TransportRequest.objects.filter(
                number__startswith=prefix
            )

            # Znajdź najwyższy numer z tego dnia
            max_number = 0
            for transport in today_transports:
                try:
                    current_number = int(transport.number.split('/')[-1])
                    if current_number > max_number:
                        max_number = current_number
                except (ValueError, IndexError):
                    pass

            # Ustaw nowy numer jako najwyższy + 1
            self.number = f"{prefix}{max_number + 1:03d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.number} - {self.pickup_date}"

    class Meta:
        verbose_name = "Zapotrzebowanie na transport"
        verbose_name_plural = "Zapotrzebowania na transport"
        ordering = ['-created_at']


class TransportItem(models.Model):
    """Model reprezentujący pojedynczą przesyłkę w transporcie"""
    transport = models.ForeignKey(
        TransportRequest,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name="Transport"
    )

    description = models.CharField(max_length=255, verbose_name="Opis")
    length = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Długość (cm)"
    )
    width = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Szerokość (cm)"
    )
    height = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Wysokość (cm)"
    )
    weight = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Waga (kg)"
    )
    value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Wartość (PLN)"
    )

    def __str__(self):
        return f"{self.description} ({self.transport.number})"

    class Meta:
        verbose_name = "Przesyłka"
        verbose_name_plural = "Przesyłki"

class ProjectActivityConfig(models.Model):
    """Model przechowujący konfigurację aktywności dla projektów"""
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='activity_config', verbose_name="Projekt")
    config_data = models.JSONField(verbose_name="Konfiguracja aktywności w formacie JSON")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_activity_configs', verbose_name="Utworzony przez")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_activity_configs', verbose_name="Zaktualizowany przez")

    def __str__(self):
        return f"Konfiguracja aktywności dla {self.project.name}"

    class Meta:
        verbose_name = "Konfiguracja aktywności projektu"
        verbose_name_plural = "Konfiguracje aktywności projektów"

class ProgressReportActivity(models.Model):
    """Model reprezentujący aktywność w raporcie postępu"""
    report = models.ForeignKey(ProgressReport, on_delete=models.CASCADE, related_name='activities', verbose_name="Raport")
    activity_type = models.CharField(max_length=100, verbose_name="Typ aktywności")
    sub_activity = models.CharField(max_length=100, verbose_name="Podaktywność")
    zona = models.CharField(max_length=100, verbose_name="Zona")
    row = models.CharField(max_length=100, verbose_name="Rząd")
    quantity = models.PositiveIntegerField(verbose_name="Ilość")
    unit = models.CharField(max_length=50, verbose_name="Jednostka")
    notes = models.TextField(blank=True, null=True, verbose_name="Uwagi")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data aktualizacji")

    def __str__(self):
        return f"{self.activity_type} - {self.sub_activity} ({self.report.date})"

    class Meta:
        verbose_name = "Aktywność raportu postępu"
        verbose_name_plural = "Aktywności raportów postępu"