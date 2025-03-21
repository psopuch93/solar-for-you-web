from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.response import Response
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
import json
from .models import UserProfile, Project
from .serializers import (
    UserSerializer, UserProfileSerializer, ProjectSerializer
)

class IsAdminOrOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Admin zawsze ma dostęp
        if request.user.is_staff:
            return True

        # Owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'client'):
            return obj.client == request.user
        elif hasattr(obj, 'author'):
            return obj.author == request.user
        else:
            return False

class HasModulePrivilege(permissions.BasePermission):
    """
    Custom permission do sprawdzania uprawnień do konkretnego modułu.
    Wymagane uprawnienie należy podać w view.required_privilege.
    """
    message = "Brak uprawnień do tego modułu."

    def has_permission(self, request, view):
        # Admin zawsze ma dostęp
        if request.user.is_staff:
            return True

        # Pobieramy wymagane uprawnienie z widoku
        required_privilege = getattr(view, 'required_privilege', None)
        if not required_privilege:
            return True  # Jeśli nie określono uprawnienia, domyślnie pozwalamy

        # Sprawdzamy uprawnienia użytkownika
        try:
            profile = request.user.profile
            return profile.has_privilege(required_privilege)
        except UserProfile.DoesNotExist:
            return False

    def has_object_permission(self, request, view, obj):
        # Dla bezpieczeństwa sprawdzamy również na poziomie obiektu
        return self.has_permission(request, view)

class UserViewSet(viewsets.ModelViewSet):
    """API endpoint dla użytkowników"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    required_privilege = 'admin_users'  # Uprawnienie do zarządzania użytkownikami

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Endpoint zwracający dane zalogowanego użytkownika"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class UserProfileViewSet(viewsets.ModelViewSet):
    """API endpoint dla profili użytkowników"""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdminOrOwner, HasModulePrivilege]
    required_privilege = 'manage_users'  # Uprawnienie do zarządzania profilami

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_profile(self, request):
        """Endpoint zwracający profil zalogowanego użytkownika"""
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

class ProjectViewSet(viewsets.ModelViewSet):
    """API endpoint dla projektów"""
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAdminOrOwner, HasModulePrivilege]
    required_privilege = 'manage_projects'  # Uprawnienie do zarządzania projektami

    def get_queryset(self):
        """Filtrowanie projektów w zależności od uprawnień użytkownika"""
        user = self.request.user

        # Admin widzi wszystkie projekty
        if user.is_staff:
            return Project.objects.all()

        # Sprawdzamy uprawnienia użytkownika
        try:
            profile = user.profile
            # Jeśli użytkownik ma uprawnienie do zarządzania wszystkimi projektami
            if profile.has_privilege('view_all_projects'):
                return Project.objects.all()
            # W przeciwnym razie widzi tylko swoje projekty
            return Project.objects.filter(client=user)
        except UserProfile.DoesNotExist:
            # Domyślnie zwracamy projekty, których użytkownik jest klientem
            return Project.objects.filter(client=user)

# Istniejące widoki logowania, dashboard itp. pozostają bez zmian
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET", "POST"])
def login_api(request):
    """API do logowania"""
    if request.method == 'POST':
        # Obsługa żądań JSON
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
        except json.JSONDecodeError:
            username = request.POST.get('username')
            password = request.POST.get('password')

        if not username or not password:
            return JsonResponse({
                'success': False,
                'message': 'Proszę podać nazwę użytkownika i hasło'
            }, status=400)

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return JsonResponse({
                'success': True,
                'message': 'Zalogowano pomyślnie',
                'redirect': '/dashboard/'
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Nieprawidłowa nazwa użytkownika lub hasło'
            }, status=401)

    # Dla metody GET - renderowanie widoku logowania
    return render(request, 'index.html')

def login_view(request):
    """Widok renderujący stronę logowania"""
    # Jeśli użytkownik jest już zalogowany, przekieruj do dashboardu
    if request.user.is_authenticated:
        return redirect('dashboard')

    return render(request, 'index.html')

@login_required
def dashboard_view(request):
    """Widok renderujący dashboard React (wymaga logowania)"""
    return render(request, 'dashboard.html')