from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    UserViewSet, UserProfileViewSet, ProjectViewSet, ClientViewSet,
    ProjectTagViewSet, EmplTagViewSet, EmployeeViewSet, check_project_name,
    check_pesel, ItemViewSet, RequisitionViewSet, RequisitionItemViewSet,
    validate_requisition, export_requisitions, assign_employee_to_quarter,
    remove_employee_from_quarter, QuarterViewSet, QuarterImageViewSet,
    UserSettingsViewSet, BrigadeMemberViewSet, my_user_settings, available_employees,
    update_employee_project, create_user_settings, ProgressReportViewSet,
    ProgressReportEntryViewSet, ProgressReportImageViewSet, create_progress_report,
    get_progress_reports_for_date,validate_hr_requisition,HRRequisitionViewSet,
    HRRequisitionPositionViewSet
)

# Dodaj nową funkcję obsługującą CSRF
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Funkcja pomocnicza, która zwraca pusty JsonResponse,
    ale ustawia cookie CSRF w odpowiedzi poprzez dekorator ensure_csrf_cookie
    """
    return JsonResponse({'detail': 'CSRF cookie set'})

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
router.register(r'quarters', QuarterViewSet)
router.register(r'quarter-images', QuarterImageViewSet)
router.register(r'user-settings', UserSettingsViewSet)
router.register(r'brigade-members', BrigadeMemberViewSet)
router.register(r'progress-reports', ProgressReportViewSet)
router.register(r'progress-report-entries', ProgressReportEntryViewSet)
router.register(r'progress-report-images', ProgressReportImageViewSet)
router.register(r'hr-requisitions', HRRequisitionViewSet)
router.register(r'hr-requisition-positions', HRRequisitionPositionViewSet)

urlpatterns = [
    # Bezpośrednie ścieżki muszą być zdefiniowane PRZED include(router.urls)
    path('user-settings/me/', my_user_settings, name='my_user_settings'),
    path('available-employees/', available_employees, name='available_employees'),
    path('update-employee-project/', update_employee_project, name='update_employee_project'),
    path('user-settings/', create_user_settings, name='create_user_settings'),
    path('create-progress-report/', create_progress_report, name='create_progress_report'),
    path('progress-reports-for-date/', get_progress_reports_for_date, name='progress_reports_for_date'),
    path('check-project-name/', check_project_name, name='check_project_name'),
    path('check-pesel/', check_pesel, name='check_pesel'),
    path('validate-requisition/', validate_requisition, name='validate_requisition'),
    path('export-requisitions/', export_requisitions, name='export_requisitions'),
    path('csrf/', get_csrf_token, name='get_csrf_token'),
    path('assign-employee-to-quarter/', assign_employee_to_quarter, name='assign_employee_to_quarter'),
    path('remove-employee-from-quarter/', remove_employee_from_quarter, name='remove_employee_from_quarter'),
    path('validate-hr-requisition/', validate_hr_requisition, name='validate_hr_requisition'),

    # Dołącz ścieżki routera NA KOŃCU
    path('', include(router.urls)),
]

# Dodaj obsługę plików mediów w trybie deweloperskim
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)