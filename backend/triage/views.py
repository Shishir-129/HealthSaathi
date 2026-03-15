import math
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from .serializers import (
    TriageRequestSerializer,
    RegisterSerializer,
    LoginSerializer,
    UserSerializer
)
from .ai_client import analyze_symptoms
from .database_client import save_triage_session, get_real_stats
from .chromadb import ChromaDBManager


def _get_authenticated_user(request):
    """Resolve authenticated user from DRF auth or X-Session-Token fallback."""
    if request.user.is_authenticated:
        return request.user

    session_token = request.headers.get("X-Session-Token", "").strip()
    if not session_token:
        return None

    token_obj = Token.objects.select_related("user").filter(key=session_token).first()
    return token_obj.user if token_obj else None


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'session_token': token.key,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        user = authenticate(username=email, password=password)
        
        if not user:
            return Response(
                {"error": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'session_token': token.key,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    def post(self, request):
        user = _get_authenticated_user(request)
        if user:
            Token.objects.filter(user=user).delete()
            return Response(
                {"message": "Logout successful"},
                status=status.HTTP_200_OK
            )
        return Response(
            {"error": "Not authenticated"},
            status=status.HTTP_401_UNAUTHORIZED
        )


class TriageView(APIView):
    def post(self, request):
        auth_user = _get_authenticated_user(request)
        serializer = TriageRequestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        symptoms = serializer.validated_data["symptoms"]
        lat      = serializer.validated_data.get("lat")
        lng      = serializer.validated_data.get("lng")
        district = serializer.validated_data.get("district", "")
        session_id = serializer.validated_data.get("session_id", "")

        # 1. AI result
        result = analyze_symptoms(symptoms)

        # Map risk to facility type
        RISK_TO_FACILITY_TYPE = {
            "HIGH": "hospital",
            "MEDIUM": "pharmacy",
            "LOW": "clinic",
        }
        recommended_type = RISK_TO_FACILITY_TYPE.get(result.get("risk", "MEDIUM"), "pharmacy")
        result["recommended_facility_type"] = recommended_type

        # 2. Save to PostgreSQL
        save_triage_session(
            symptoms        = symptoms,
            risk_level      = result["risk"],
            advice          = result.get("brief_advice", ""),
            action          = result.get("dos", ""),
            nepali_advice   = result.get("nepali_advice", ""),
            brief_advice    = result.get("brief_advice", ""),
            detailed_advice = result.get("detailed_advice", ""),
            food_eat        = result.get("food_eat", ""),
            food_avoid      = result.get("food_avoid", ""),
            dos             = result.get("dos", ""),
            donts           = result.get("donts", ""),
            district        = district,
            latitude        = lat,
            longitude       = lng,
            user_id         = auth_user.id if auth_user else None,
            user_email      = auth_user.email if auth_user else "",
            session_id      = session_id,
        )

        # 3. Save to ChromaDB for context awareness
        if auth_user:
            user_id = auth_user.id
            ChromaDBManager.save_to_history(
                user_id=user_id,
                query=symptoms,
                response=result,
                risk_level=result.get("risk", "UNKNOWN")
            )

        return Response(result, status=status.HTTP_200_OK)


class HistoryView(APIView):
    def get(self, request):
        """Get user's triage history grouped by session"""
        user = _get_authenticated_user(request)
        if not user:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        from .models import TriageSession
        
        # Get all sessions for this user grouped by session_id
        sessions = TriageSession.objects.filter(
            user=user
        ).order_by('-created_at')
        
        # Group by session_id
        grouped_sessions = {}
        for session in sessions:
            sid = session.session_id or str(session.created_at)
            if sid not in grouped_sessions:
                grouped_sessions[sid] = {
                    'session_id': sid,
                    'created_at': session.created_at.isoformat(),
                    'risk_level': session.risk_level,
                    'district': session.district,
                    'items': []
                }
            grouped_sessions[sid]['items'].append({
                'id': session.id,
                'risk_level': session.risk_level,
                'district': session.district,
                'created_at': session.created_at.isoformat(),
            })
        
        return Response(list(grouped_sessions.values()), status=status.HTTP_200_OK)


class StatsView(APIView):
    def get(self, request):
        try:
            real_stats = get_real_stats()
            if real_stats:
                return Response(real_stats)
        except Exception as e:
            print(f"❌ Stats error: {e}")

        return Response({
            "total_sessions": 1247,
            "source": "hardcoded",
            "risk_distribution": {
                "HIGH":   187,
                "MEDIUM": 634,
                "LOW":    426
            },
            "districts": [
                {"name": "Kathmandu",  "count": 412},
                {"name": "Lalitpur",   "count": 261},
                {"name": "Pokhara",    "count": 184},
                {"name": "Chitwan",    "count": 142},
                {"name": "Biratnagar", "count": 103},
                {"name": "Butwal",     "count": 87},
                {"name": "Dharan",     "count": 76},
                {"name": "Bhaktapur",  "count": 98},
                {"name": "Nepalgunj",  "count": 58},
                {"name": "Janakpur",   "count": 42},
            ]
        })


class ChromaDBStatsView(APIView):
    """Get ChromaDB statistics and collection information"""
    def get(self, request):
        try:
            stats = ChromaDBManager.get_stats()
            return Response({
                "chromadb_stats": stats,
                "message": "ChromaDB collections active and storing data"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "error": f"Failed to get ChromaDB stats: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserContextView(APIView):
    """Get user's ChromaDB context history for context-aware responses"""
    def get(self, request):
        """Get user's conversation history for context"""
        user = _get_authenticated_user(request)
        if not user:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get recent query from request params for context retrieval
        query = request.query_params.get("query", "")
        n_results = int(request.query_params.get("n_results", 5))
        
        if not query:
            return Response(
                {"error": "query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            context = ChromaDBManager.get_user_context(
                user_id=user.id,
                query=query,
                n_results=n_results
            )
            return Response({
                "user_id": user.id,
                "query": query,
                "context": context,
                "message": "User context retrieved successfully"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "error": f"Failed to retrieve context: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
