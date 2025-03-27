from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UserProfileViewSet,ProjectViewSet, ClientViewSet,ProjectTagViewSet, EmplTagViewSet,EmployeeViewSet,check_project_name, check_pesel, ItemViewSet, RequisitionViewSet, RequisitionItemViewSet, validate_requisition

# Utwórz router dla widoków ViewSet
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'project-tags', ProjectTagViewSet)
router.register(r'employee-tags', EmplTagViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'items', ItemViewSet)
router.register(r'requisitions', RequisitionViewSet)
router.register(r'requisition-items', RequisitionItemViewSet)

urlpatterns = [
    # Dołącz ścieżki routera
    path('', include(router.urls)),
    # Dodaj ścieżkę do sprawdzania unikalności nazwy projektu
    path('check-project-name/', check_project_name, name='check_project_name'),
    path('check-pesel/', check_pesel, name='check_pesel'),
    path('validate-requisition/', validate_requisition, name='validate_requisition'),
]