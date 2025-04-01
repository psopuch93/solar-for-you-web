from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Project, Client, ProjectTag, Empl_tag, Employee, Requisition, RequisitionItem, Item

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

class EmplTagSerializer(serializers.ModelSerializer):
    """Serializer dla modelu Empl_tag"""
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Empl_tag
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

class EmployeeSerializer(serializers.ModelSerializer):
    """Serializer dla modelu Employee"""
    project_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()
    tag_serial = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = ('id', 'first_name', 'last_name', 'full_name', 'pesel',
                  'current_project', 'project_name',
                  'employee_tag', 'tag_serial',
                  'created_at', 'updated_at', 'created_by', 'created_by_name',
                  'updated_by', 'updated_by_name')
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')
        # Dodanie niestandardowej walidacji błędów
        extra_kwargs = {
            'pesel': {
                'error_messages': {
                    'unique': 'Pracownik o tym numerze PESEL już istnieje.'
                }
            }
        }

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_project_name(self, obj):
        return obj.current_project.name if obj.current_project else None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.username
        return None

    def get_tag_serial(self, obj):
        return obj.employee_tag.serial if obj.employee_tag else None

class ItemSerializer(serializers.ModelSerializer):
    """Serializer dla modelu Item"""
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()
    area_display = serializers.CharField(source='get_area_display', read_only=True)

    class Meta:
        model = Item
        fields = ('id', 'name', 'area', 'area_display', 'price', 'index', 'created_at', 'updated_at',
                 'created_by', 'created_by_name', 'updated_by', 'updated_by_name')
        read_only_fields = ('id', 'index', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.username
        return None

class RequisitionItemSerializer(serializers.ModelSerializer):
    """Serializer dla modelu RequisitionItem"""
    item_name = serializers.SerializerMethodField()
    item_index = serializers.SerializerMethodField()

    class Meta:
        model = RequisitionItem
        fields = ('id', 'requisition', 'item', 'item_name', 'item_index', 'quantity', 'price', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_item_name(self, obj):
        return obj.item.name if obj.item else None

    def get_item_index(self, obj):
        return obj.item.index if obj.item else None

class RequisitionSerializer(serializers.ModelSerializer):
    """Serializer dla modelu Requisition"""
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    items = RequisitionItemSerializer(many=True, read_only=True)
    type_display = serializers.CharField(source='get_requisition_type_display', read_only=True)
    status_display = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    current_user_id = serializers.SerializerMethodField()

    class Meta:
        model = Requisition
        fields = ('id', 'number', 'project', 'project_name', 'deadline',
                  'requisition_type', 'type_display', 'status', 'status_display',
                  'comment', 'items', 'total_price', 'created_at', 'updated_at',
                  'created_by', 'created_by_name', 'updated_by', 'updated_by_name',
                  'current_user_id')
        read_only_fields = ('id', 'number', 'created_at', 'updated_at', 'created_by', 'updated_by')
        extra_kwargs = {
            'status': {
                'validators': []  # Usuń domyślne walidatory
            }
        }

    def validate_status(self, value):
        """
        Niestandardowa walidacja statusu
        Sprawdza, czy podany status jest dozwolony
        """
        valid_statuses = [status[0] for status in Requisition.REQUISITION_STATUS_CHOICES]

        if value not in valid_statuses:
            raise serializers.ValidationError(f"Niedozwolony status: {value}")

        return value

    def get_current_user_id(self, obj):
        """Zwraca ID aktualnie zalogowanego użytkownika"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return request.user.id
        return None

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else '-'

    def get_updated_by_name(self, obj):
        return obj.updated_by.get_full_name() if obj.updated_by else '-'

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def get_total_price(self, obj):
        """
        Oblicza całkowitą wartość zapotrzebowania
        """
        total = sum(
            item.price * item.quantity
            for item in obj.items.all()
            if item.price is not None
        )
        return float(total)

    def get_status_display(self, obj):
        status_map = {
            'to_accept': 'Do akceptacji',
            'accepted': 'Zaakceptowano',
            'rejected': 'Odrzucono',
            'in_progress': 'W trakcie realizacji',
            'completed': 'Zrealizowano'
        }
        return status_map.get(obj.status, obj.status)
