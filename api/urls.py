from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UserProfileViewSet, ProjectViewSet

# Utwórz router dla widoków ViewSet
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'projects', ProjectViewSet)

urlpatterns = [
    # Dołącz ścieżki routera
    path('', include(router.urls)),
]