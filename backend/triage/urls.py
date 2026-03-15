from django.urls import path
from .views import (
    TriageView,
    StatsView,
    RegisterView,
    LoginView,
    LogoutView
)
from .baato import BaatoView

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("triage/", TriageView.as_view(), name="triage"),
    path('stats/', StatsView.as_view(), name='stats'),
]