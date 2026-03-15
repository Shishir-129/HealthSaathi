"""
URL Configuration for NepalCare AI backend.
Main Django project URL routing.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

admin.site.site_header = 'NepalCare AI Administration'
admin.site.site_title = 'NepalCare Admin'
