from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from api.views import dashboard_view, login_view, login_api, logout_api, check_project_name
from django.views.decorators.csrf import csrf_exempt

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(('api.urls', 'api'), namespace='api')),
    path('api/login/', csrf_exempt(login_api), name='login_api'),
    path('dashboard/', dashboard_view, name='dashboard'),
    path('api/logout/', csrf_exempt(logout_api), name='logout_api'),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('check-project-name/', check_project_name, name='check_project_name'),

    # Obsługa React Router dla pozostałych ścieżek
    path('', login_view, name='login'),
    re_path(r'^(?!admin|api|dashboard).*$', login_view, name='login_all'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)