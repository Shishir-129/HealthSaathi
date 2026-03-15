"""Database client for PostgreSQL backend instead of Supabase."""
from .models import TriageSession


def save_triage_session(
    symptoms: str,
    risk_level: str,
    advice: str = "",
    action: str = "",
    nepali_advice: str = "",
    district: str = "",
    latitude: float = None,
    longitude: float = None,
    brief_advice: str = "",
    detailed_advice: str = "",
    food_eat: str = "",
    food_avoid: str = "",
    dos: str = "",
    donts: str = "",
    user_id: int = None,
    user_email: str = "",
    session_id: str = "",
):
    """Save a triage session to PostgreSQL database."""
    try:
        session = TriageSession.objects.create(
            symptoms=symptoms,
            risk_level=risk_level,
            advice=advice or brief_advice,
            action=action,
            nepali_advice=nepali_advice,
            district=district,
            latitude=latitude,
            longitude=longitude,
            brief_advice=brief_advice,
            detailed_advice=detailed_advice,
            food_eat=food_eat,
            food_avoid=food_avoid,
            dos=dos,
            donts=donts,
            user_id=user_id,
            user_email=user_email,
            session_id=session_id,
        )
        print(f"✅ Saved to PostgreSQL: {risk_level}")
        return session
    except Exception as e:
        print(f"⚠️ Database save failed: {e}")
        return None


def get_all_sessions():
    """Get all triage sessions from database."""
    try:
        sessions = TriageSession.objects.all().order_by('-created_at')
        return sessions
    except Exception as e:
        print(f"⚠️ Failed to fetch sessions: {e}")
        return []


def get_user_history(user_id: int):
    """Get triage session history for a specific user."""
    try:
        sessions = TriageSession.objects.filter(user_id=user_id).order_by('-created_at')[:50]
        return sessions
    except Exception as e:
        print(f"⚠️ Failed to fetch user history: {e}")
        return []


def get_real_stats():
    """Get real-time statistics from database."""
    try:
        sessions = TriageSession.objects.all().values('risk_level', 'district', 'created_at')
        
        if not sessions.exists():
            return None

        total = sessions.count()
        high = sessions.filter(risk_level="HIGH").count()
        medium = sessions.filter(risk_level="MEDIUM").count()
        low = sessions.filter(risk_level="LOW").count()

        # Get district counts
        district_counts = {}
        for session in sessions:
            district = session.get("district") or "Unknown"
            if district and district != "Unknown":
                district_counts[district] = district_counts.get(district, 0) + 1

        districts = [
            {"name": k, "count": v}
            for k, v in sorted(
                district_counts.items(),
                key=lambda x: x[1],
                reverse=True,
            )
        ][:10]

        return {
            "total_sessions": total,
            "risk_distribution": {
                "HIGH": high,
                "MEDIUM": medium,
                "LOW": low,
            },
            "districts": districts,
            "source": "live",
        }

    except Exception as e:
        print(f"⚠️ Stats failed: {e}")
        return None


def test_connection():
    """Test database connection."""
    try:
        TriageSession.objects.all().count()
        print("✅ PostgreSQL connected!")
        return True
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False
