import math
import os
import tempfile
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
    UserSerializer,
    TriageSessionSerializer,
    UserProfileSerializer
)
from .ai_client import analyze_symptoms
from .database_client import save_triage_session, get_real_stats
from .chromadb import ChromaDBManager
from .image_client import (
    generate_image,
    analyze_image,
    extract_images_from_pdf,
    get_processing_logs,
    check_rate_limit_status,
)


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
        
        # Get user profile data
        profile_data = {}
        if hasattr(user, 'profile'):
            profile_data = {
                'phone_number': user.profile.phone_number,
                'blood_group': user.profile.blood_group,
            }
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'session_token': token.key,
            'phone_number': profile_data.get('phone_number', ''),
            'blood_group': profile_data.get('blood_group', ''),
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


class GetUpdateProfileView(APIView):
    """Get and update user profile (phone number and blood group)"""
    
    def get(self, request):
        """Get current user's profile"""
        user = _get_authenticated_user(request)
        if not user:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        profile = getattr(user, 'profile', None)
        if not profile:
            return Response(
                {"error": "User profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Update phone_number and blood_group"""
        user = _get_authenticated_user(request)
        if not user:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        profile = getattr(user, 'profile', None)
        if not profile:
            return Response(
                {"error": "User profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(
            {"error": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
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
        conversation_id = serializer.validated_data.get("conversation_id")

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
        saved_session = save_triage_session(
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
            conversation_id = conversation_id,
        )

        # Return the conversation_id for frontend to use in future requests
        if saved_session and saved_session.conversation:
            result["conversation_id"] = str(saved_session.conversation.id)

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
        """Get user's conversations with their sessions grouped together"""
        user = _get_authenticated_user(request)
        
        # Return empty list if not authenticated (no error)
        if not user:
            return Response([], status=status.HTTP_200_OK)
        
        from .models import TriageSession, Conversation
        
        # Get all conversations for this user, ordered by most recent update
        conversations = Conversation.objects.filter(
            user=user
        ).order_by('-updated_at')[:20].prefetch_related('sessions')
        
        result = []
        for conv in conversations:
            # Get the sessions for this conversation, ordered by creation
            sessions = conv.sessions.all().order_by('created_at')
            
            if not sessions.exists():
                continue
            
            # Use the first session's data as the conversation preview
            first_session = sessions.first()
            last_session = sessions.last()
            
            conv_data = {
                'conversation_id': str(conv.id),
                'session_id': str(conv.id),  # Use conversation ID as session_id for backward compatibility
                'created_at': conv.created_at.isoformat(),
                'updated_at': conv.updated_at.isoformat(),
                'risk_level': first_session.risk_level,
                'symptoms_preview': first_session.symptoms[:50] + ('...' if len(first_session.symptoms) > 50 else ''),
                'symptoms': first_session.symptoms,
                'district': first_session.district,
                'brief_advice': first_session.brief_advice,
                'detailed_advice': first_session.detailed_advice,
                'food_eat': first_session.food_eat,
                'food_avoid': first_session.food_avoid,
                'dos': first_session.dos,
                'donts': first_session.donts,
                'nepali_advice': first_session.nepali_advice,
                'session_count': sessions.count(),
                'sessions': [
                    {
                        'id': s.id,
                        'symptoms': s.symptoms,
                        'risk_level': s.risk_level,
                        'brief_advice': s.brief_advice,
                        'detailed_advice': s.detailed_advice,
                        'food_eat': s.food_eat,
                        'food_avoid': s.food_avoid,
                        'dos': s.dos,
                        'donts': s.donts,
                        'nepali_advice': s.nepali_advice,
                        'created_at': s.created_at.isoformat(),
                    }
                    for s in sessions
                ]
            }
            result.append(conv_data)
        
        return Response(result, status=status.HTTP_200_OK)
    
    def delete(self, request):
        """Delete a conversation and all its sessions"""
        user = _get_authenticated_user(request)
        
        if not user:
            return Response(
                {"error": "Not authenticated"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        from .models import Conversation
        
        conversation_id = request.query_params.get('session_id') or request.data.get('session_id') or request.data.get('conversation_id')
        
        if not conversation_id:
            return Response(
                {"error": "conversation_id or session_id required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get the conversation (use session_id as fallback for conversation_id)
            conv = Conversation.objects.filter(
                user=user,
                id=conversation_id
            ).first()
            
            if not conv:
                return Response(
                    {"error": "Conversation not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Delete the conversation (cascades to all sessions)
            conv.delete()
            
            return Response(
                {"message": "Conversation deleted successfully"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f"❌ Delete error: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StatsView(APIView):
    def get(self, request):
        # Get authenticated user
        user = _get_authenticated_user(request)
        
        try:
            real_stats = get_real_stats(user_id=user.id if user else None)
            if real_stats:
                return Response(real_stats)
        except Exception as e:
            print(f"❌ Stats error: {e}")

        # Return empty stats if user not authenticated or no data
        if not user:
            return Response({
                "total_sessions": 0,
                "source": "no_auth",
                "risk_distribution": {
                    "HIGH": 0,
                    "MEDIUM": 0,
                    "LOW": 0
                },
                "districts": []
            })

        return Response({
            "total_sessions": 0,
            "source": "no_data",
            "risk_distribution": {
                "HIGH": 0,
                "MEDIUM": 0,
                "LOW": 0
            },
            "districts": []
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


# ==================== IMAGE GENERATION & VISION ====================

class ImageGenerationView(APIView):
    """Generate images from text prompts using Azure OpenAI GPT-image-1.5"""
    
    def post(self, request):
        """
        Generate image from prompt.
        
        Expected payload:
        {
            "prompt": "A doctor examining a patient",
            "size": "1024x1024",  // optional, default: 1024x1024
            "quality": "standard", // optional, default: standard
            "n": 1                 // optional, number of images
        }
        """
        try:
            prompt = request.data.get("prompt", "").strip()
            if not prompt:
                return Response(
                    {"error": "prompt is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            size = request.data.get("size", "1024x1024")
            quality = request.data.get("quality", "standard")
            n = int(request.data.get("n", 1))
            
            # Validate size
            valid_sizes = ["1024x1024", "1024x1792", "1792x1024"]
            if size not in valid_sizes:
                return Response(
                    {"error": f"Invalid size. Must be one of: {valid_sizes}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate quality
            valid_quality = ["standard", "hd"]
            if quality not in valid_quality:
                return Response(
                    {"error": f"Invalid quality. Must be one of: {valid_quality}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = generate_image(prompt=prompt, size=size, quality=quality, n=n)
            
            if "error" in result:
                return Response(
                    result,
                    status=status.HTTP_429_TOO_MANY_REQUESTS if "Rate limit" in result["error"] else status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(result, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {"error": f"Image generation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VisionAnalysisView(APIView):
    """Analyze images using Azure OpenAI vision capabilities"""
    
    def post(self, request):
        """
        Analyze an image.
        
        Expected payload:
        {
            "image_source": "data:image/jpeg;base64,...",  // base64 or URL
            "question": "What is in this image?"
        }
        """
        try:
            image_source = request.data.get("image_source", "").strip()
            question = request.data.get("question", "").strip()
            
            if not image_source:
                return Response(
                    {"error": "image_source is required (base64 or URL)"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not question:
                return Response(
                    {"error": "question is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = analyze_image(image_source=image_source, question=question)
            
            if "error" in result:
                return Response(
                    result,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(result, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {"error": f"Vision analysis failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PDFProcessingView(APIView):
    """Extract and process images from PDF files"""
    
    def post(self, request):
        """
        Process a PDF file.
        
        Expected payload:
        {
            "pdf_path": "/path/to/file.pdf"
        }
        """
        temp_pdf_path = None
        try:
            uploaded_file = request.FILES.get("file")
            pdf_path = request.data.get("pdf_path", "").strip()

            if uploaded_file:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                    for chunk in uploaded_file.chunks():
                        temp_file.write(chunk)
                    temp_pdf_path = temp_file.name
                pdf_path = temp_pdf_path

            if not pdf_path:
                return Response(
                    {"error": "Provide either 'file' upload or 'pdf_path'"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            result = extract_images_from_pdf(pdf_path=pdf_path)
            
            if "error" in result:
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
                if "requires" in result["error"] or "install_command" in result:
                    status_code = status.HTTP_400_BAD_REQUEST
                return Response(result, status=status_code)
            
            return Response(result, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {"error": f"PDF processing failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            if temp_pdf_path and os.path.exists(temp_pdf_path):
                try:
                    os.remove(temp_pdf_path)
                except OSError:
                    pass


class ImageProcessingLogsView(APIView):
    """Get all image processing logs and metadata"""
    
    def get(self, request):
        """
        Retrieve all image generation, vision analysis, and PDF processing logs.
        Useful for final presentation and auditing.
        """
        try:
            logs = get_processing_logs()
            return Response({
                "logs": logs,
                "total_entries": logs.get("total_entries", 0),
                "message": "Image processing logs retrieved successfully"
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {"error": f"Failed to retrieve logs: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RateLimitStatusView(APIView):
    """Check current image request rate limit status"""
    
    def get(self, request):
        """Get rate limit information and current status"""
        try:
            status_info = check_rate_limit_status()
            return Response(status_info, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {"error": f"Failed to check rate limit: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
