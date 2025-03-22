from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UserProfileViewSet, ProjectViewSet, ClientViewSet, ProjectTagViewSet, check_project_name


# Utwórz router dla widoków ViewSet
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'project-tags', ProjectTagViewSet)

urlpatterns = [
    # Dołącz ścieżki routera
    path('', include(router.urls)),
    # Dodaj ścieżkę do sprawdzania unikalności nazwy projektu
    path('check-project-name/', check_project_name, name='check_project_name'),
]