from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Project, Client, ProjectTag, Empl_tag, Employee, Requisition, RequisitionItem, Item, Quarter, QuarterImage, UserSettings, BrigadeMember, ProgressReportEntry, ProgressReportImage, ProgressReport, HRRequisition, HRRequisitionPosition, TransportRequest, TransportItem

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
    quarter_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = ('id', 'first_name', 'last_name', 'full_name', 'pesel',
                  'current_project', 'project_name',
                  'employee_tag', 'tag_serial',
                  'created_at', 'updated_at', 'created_by', 'created_by_name',
                  'updated_by', 'updated_by_name', 'quarter', 'quarter_name',)
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

    def get_quarter_name(self, obj):
        try:
            return obj.quarter.name if obj.quarter else None
        except AttributeError:
            return None

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

class QuarterSerializer(serializers.ModelSerializer):
    """Serializer for Quarter model"""
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()
    occupants_count = serializers.SerializerMethodField()

    class Meta:
        model = Quarter
        fields = ('id', 'name', 'address', 'city', 'country', 'payment_day', 'max_occupants',
                  'created_at', 'updated_at', 'created_by', 'created_by_name',
                  'updated_by', 'updated_by_name', 'occupants_count')
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.username
        return None

    def get_occupants_count(self, obj):
        return obj.employees.count()

class QuarterImageSerializer(serializers.ModelSerializer):
    """Serializer dla zdjęć kwater"""
    image_url = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = QuarterImage
        fields = ('id', 'quarter', 'image', 'image_url', 'name', 'created_at', 'created_by', 'created_by_name')
        read_only_fields = ('id', 'created_at', 'created_by')

    def get_image_url(self, obj):
        """Zwraca pełny URL do zdjęcia"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_created_by_name(self, obj):
        """Zwraca nazwę użytkownika, który dodał zdjęcie"""
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

class UserSettingsSerializer(serializers.ModelSerializer):
    """Serializer dla modelu UserSettings"""
    username = serializers.CharField(source='user.username', read_only=True)
    project_name = serializers.SerializerMethodField()
    project_details = serializers.SerializerMethodField()

    class Meta:
        model = UserSettings
        fields = ('id', 'user', 'username', 'project', 'project_name', 'project_details', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'username', 'created_at', 'updated_at')

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def get_project_details(self, obj):
        if not obj.project:
            return None
        return {
            'id': obj.project.id,
            'name': obj.project.name,
            'status': obj.project.status
        }

class BrigadeMemberSerializer(serializers.ModelSerializer):
    """Serializer dla modelu BrigadeMember"""
    employee_name = serializers.SerializerMethodField()
    brigade_leader_name = serializers.CharField(source='brigade_leader.username', read_only=True)
    employee_data = serializers.SerializerMethodField()

    class Meta:
        model = BrigadeMember
        fields = ('id', 'brigade_leader', 'brigade_leader_name', 'employee', 'employee_name', 'employee_data', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'brigade_leader', 'brigade_leader_name', 'employee_data')

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

    def get_employee_data(self, obj):
        """Zwraca szczegółowe dane pracownika"""
        return {
            "id": obj.employee.id,
            "first_name": obj.employee.first_name,
            "last_name": obj.employee.last_name,
            "pesel": obj.employee.pesel
        }

class ProgressReportImageSerializer(serializers.ModelSerializer):
    """Serializer dla zdjęć raportów postępu"""
    image_url = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ProgressReportImage
        fields = ('id', 'report', 'image', 'image_url', 'name', 'description', 'created_at', 'created_by', 'created_by_name')
        read_only_fields = ('id', 'created_at', 'created_by')

    def get_image_url(self, obj):
        """Zwraca pełny URL do zdjęcia"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_created_by_name(self, obj):
        """Zwraca nazwę użytkownika, który dodał zdjęcie"""
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

class ProgressReportEntrySerializer(serializers.ModelSerializer):
    """Serializer dla wpisów w raportach postępu"""
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = ProgressReportEntry
        fields = ('id', 'report', 'employee', 'employee_name', 'hours_worked', 'notes')
        read_only_fields = ('id',)

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}" if obj.employee else None

class ProgressReportSerializer(serializers.ModelSerializer):
    """Serializer dla raportów postępu"""
    entries = ProgressReportEntrySerializer(many=True, read_only=True)
    images = ProgressReportImageSerializer(many=True, read_only=True)
    project_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ProgressReport
        fields = ('id', 'date', 'project', 'project_name', 'created_by', 'created_by_name',
                  'created_at', 'updated_at', 'entries', 'images')
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

class HRRequisitionPositionSerializer(serializers.ModelSerializer):
    """Serializer dla modelu HRRequisitionPosition"""
    position_display = serializers.CharField(source='get_position_display', read_only=True)

    class Meta:
        model = HRRequisitionPosition
        fields = ('id', 'hr_requisition', 'position', 'position_display', 'quantity', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class HRRequisitionSerializer(serializers.ModelSerializer):
    """Serializer dla modelu HRRequisition"""
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    positions = HRRequisitionPositionSerializer(many=True, read_only=True)
    status_display = serializers.SerializerMethodField()
    experience_display = serializers.CharField(source='get_experience_display', read_only=True)
    current_user_id = serializers.SerializerMethodField()

    class Meta:
        model = HRRequisition
        fields = ('id', 'number', 'project', 'project_name', 'deadline',
                  'status', 'status_display', 'special_requirements', 'experience',
                  'experience_display', 'comment', 'positions', 'created_at', 'updated_at',
                  'created_by', 'created_by_name', 'updated_by', 'updated_by_name',
                  'current_user_id')
        read_only_fields = ('id', 'number', 'created_at', 'updated_at', 'created_by', 'updated_by')

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

    def get_status_display(self, obj):
        status_map = {
            'to_accept': 'Do akceptacji',
            'accepted': 'Zaakceptowano',
            'rejected': 'Odrzucono',
            'in_progress': 'W trakcie realizacji',
            'completed': 'Zrealizowano'
        }
        return status_map.get(obj.status, obj.status)

class TransportItemSerializer(serializers.ModelSerializer):
    """Serializer dla pozycji transportu"""

    class Meta:
        model = TransportItem
        fields = ('id', 'description', 'length', 'width', 'height', 'weight', 'value')


class TransportRequestSerializer(serializers.ModelSerializer):
    """Serializer dla zapotrzebowania na transport"""
    items = TransportItemSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()
    pickup_project_name = serializers.SerializerMethodField()
    delivery_project_name = serializers.SerializerMethodField()
    cost_project_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    loading_method_display = serializers.CharField(source='get_loading_method_display', read_only=True)

    class Meta:
        model = TransportRequest
        fields = (
            'id', 'number', 'pickup_project', 'pickup_project_name', 'pickup_address',
            'pickup_date', 'delivery_project', 'delivery_project_name', 'delivery_address',
            'delivery_date', 'loading_method', 'loading_method_display', 'cost_project',
            'cost_project_name', 'requester_phone', 'notes', 'status', 'status_display',
            'created_at', 'updated_at', 'created_by', 'created_by_name',
            'updated_by', 'updated_by_name', 'items'
        )
        read_only_fields = ('id', 'number', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def get_created_by_name(self, obj):
        """Zwraca imię i nazwisko osoby, która utworzyła zapotrzebowanie"""
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

    def get_updated_by_name(self, obj):
        """Zwraca imię i nazwisko osoby, która ostatnio zaktualizowała zapotrzebowanie"""
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.username
        return None

    def get_pickup_project_name(self, obj):
        """Zwraca nazwę projektu załadunku, jeśli istnieje"""
        return obj.pickup_project.name if obj.pickup_project else None

    def get_delivery_project_name(self, obj):
        """Zwraca nazwę projektu rozładunku, jeśli istnieje"""
        return obj.delivery_project.name if obj.delivery_project else None

    def get_cost_project_name(self, obj):
        """Zwraca nazwę projektu kosztowego, jeśli istnieje"""
        return obj.cost_project.name if obj.cost_project else None

    def create(self, validated_data):
        """Metoda do utworzenia nowego zapotrzebowania transportowego wraz z przesyłkami"""
        items_data = self.context.get('items', [])

        # Pobierz zalogowanego użytkownika z kontekstu
        user = self.context['request'].user

        # Utwórz zapotrzebowanie transportowe
        transport_request = TransportRequest.objects.create(
            **validated_data,
            created_by=user,
            updated_by=user
        )

        # Utwórz powiązane przesyłki
        for item_data in items_data:
            TransportItem.objects.create(transport=transport_request, **item_data)

        return transport_request