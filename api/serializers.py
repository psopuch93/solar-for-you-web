from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Project

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

class ProjectSerializer(serializers.ModelSerializer):
    """Serializer dla modelu Project"""
    client_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)


    class Meta:
        model = Project
        fields = ('id', 'name', 'client', 'client_name', 'localization', 'description',
                 'status', 'status_display', 'start_date', 'end_date', 'budget',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}" if obj.client.first_name and obj.client.last_name else obj.client.username