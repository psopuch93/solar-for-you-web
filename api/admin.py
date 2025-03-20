from django.contrib import admin
from django import forms
from .models import UserProfile, Project

class UserProfileAdminForm(forms.ModelForm):
    """Formularz do zarządzania uprawnieniami w adminie"""
    AVAILABLE_PRIVILEGES = [
        ('admin_users', 'Zarządzanie użytkownikami'),
        ('manage_users', 'Zarządzanie profilami'),
        ('manage_projects', 'Zarządzanie projektami'),
        ('view_all_projects', 'Przeglądanie wszystkich projektów'),
        ('manage_components', 'Zarządzanie komponentami'),
        ('view_reports', 'Przeglądanie raportów'),
        ('export_data', 'Eksportowanie danych'),
        ('manage_notes', 'Zarządzanie notatkami'),
        ('manage_clients', 'Zarządzanie klientami'),
        ('manage_invoices', 'Zarządzanie fakturami'),
    ]

    privileges_choices = forms.MultipleChoiceField(
        choices=AVAILABLE_PRIVILEGES,
        widget=forms.CheckboxSelectMultiple,
        required=False,
        label="Uprawnienia"
    )

    class Meta:
        model = UserProfile
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Jeśli edytujemy istniejący profil, zaznaczamy jego uprawnienia
        if self.instance.pk:
            self.fields['privileges_choices'].initial = self.instance.get_privileges_list()

    def save(self, commit=True):
        # Konwertujemy wybrane uprawnienia na format tekstowy z przecinkami
        profile = super().save(commit=False)
        privileges = self.cleaned_data.get('privileges_choices', [])
        profile.privileges = ','.join(privileges)

        if commit:
            profile.save()
        return profile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    form = UserProfileAdminForm
    list_display = ('user', 'get_full_name', 'phone', 'status', 'get_privileges_display', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'phone', 'address')
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 25

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}" if obj.user.first_name and obj.user.last_name else obj.user.username
    get_full_name.short_description = "Pełne imię i nazwisko"

    def get_privileges_display(self, obj):
        privileges = obj.get_privileges_list()
        if not privileges:
            return "Brak"
        return ", ".join(privileges)
    get_privileges_display.short_description = "Uprawnienia"

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'client', 'localization', 'status', 'start_date', 'end_date', 'budget', 'created_at')
    list_filter = ('status', 'start_date', 'end_date')
    search_fields = ('name', 'client__username', 'client__first_name', 'client__last_name', 'localization', 'description')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('status',)
    list_per_page = 25