from django.urls import path
from .views import (
    TriageView,
    StatsView,
    RegisterView,
    LoginView,
    LogoutView,
    GetUpdateProfileView,
    HistoryView,
    ChromaDBStatsView,
    UserContextView,
    ImageGenerationView,
    VisionAnalysisView,
    PDFProcessingView,
    ImageProcessingLogsView,
    RateLimitStatusView,
)
from .baato import BaatoView

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("profile/", GetUpdateProfileView.as_view(), name="profile"),
    path("triage/", TriageView.as_view(), name="triage"),
    path('stats/', StatsView.as_view(), name='stats'),
    path('baato/',          BaatoView.as_view()),
    path('history/', HistoryView.as_view(), name='history'),
    path('chromadb/stats/', ChromaDBStatsView.as_view(), name='chromadb_stats'),
    path('chromadb/context/', UserContextView.as_view(), name='user_context'),
    # Image Generation & Vision endpoints
    path('image/generate/', ImageGenerationView.as_view(), name='image_generate'),
    path('image/analyze/', VisionAnalysisView.as_view(), name='vision_analysis'),
    path('image/pdf/', PDFProcessingView.as_view(), name='pdf_processing'),
    path('image/logs/', ImageProcessingLogsView.as_view(), name='image_logs'),
    path('image/rate-limit/', RateLimitStatusView.as_view(), name='rate_limit_status'),
]