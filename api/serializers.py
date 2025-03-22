from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Project, Client, ProjectTag

class UserSerializer(serializers.ModelSerializer):
    """Serializer dla modelu User"""
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'is_active')
        read_only_fields = ('is_staff', 'is_active')

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer dla modelu UserProfile"""
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    privileges_list = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ('id', 'user', 'full_name', 'phone', 'address', 'status',
                  'privileges', 'privileges_list', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}" if obj.user.first_name and obj.user.last_name else obj.user.username

    def get_privileges_list(self, obj):
        """Zwraca listę uprawnień w formie listy"""
        return obj.get_privileges_list()

    def validate_privileges(self, value):
        """Walidacja pola privileges - można ją rozszerzyć o sprawdzanie dozwolonych uprawnień"""
        if value:
            # Oczyszczamy dane - usuwamy spacje wokół przecinków
            privileges = [p.strip() for p in value.split(',')]
            return ','.join(privileges)
        return value

class ClientSerializer(serializers.ModelSerializer):
    """Serializer dla modelu Client"""
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = ('id', 'name', 'created_at', 'updated_at', 'created_by', 'created_by_name', 'updated_by', 'updated_by_name')
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.username
        return None

class ProjectTagSerializer(serializers.ModelSerializer):
    """Serializer dla modelu ProjectTag"""
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ProjectTag
        fields = ('id', 'serial', 'created_at', 'updated_at', 'created_by', 'created_by_name', 'updated_by', 'updated_by_name')
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.username
        return None

# api/serializers.py
class ProjectSerializer(serializers.ModelSerializer):
    """Serializer dla modelu Project"""
    client_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tag_serial = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ('id', 'name', 'client', 'client_name', 'localization', 'description',
                 'status', 'status_display', 'start_date', 'end_date', 'budget',
                 'latitude', 'longitude', 'country', 'city', 'street', 'post_code',
                 'project_tag', 'tag_serial',
                 'created_at', 'updated_at', 'created_by', 'created_by_name', 'updated_by', 'updated_by_name')
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')
        # Dodanie niestandardowej walidacji błędów
        extra_kwargs = {
            'name': {
                'error_messages': {
                    'unique': 'Projekt o tej nazwie już istnieje. Wybierz inną nazwę.'
                }
            }
        }

    def get_client_name(self, obj):
        return obj.client.name if obj.client else None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.username
        return None

    def get_tag_serial(self, obj):
        return obj.project_tag.serial if obj.project_tag else None