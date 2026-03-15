import os
import hashlib
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise Exception("SUPABASE_URL or SUPABASE_KEY missing in .env")
    return create_client(url, key)


def save_triage_session(
    symptoms:        str,
    risk_level:      str,
    advice:          str = "",
    action:          str = "",
    nepali_advice:   str = "",
    district:        str = "",
    latitude:        float = None,
    longitude:       float = None,
    brief_advice:    str = "",
    detailed_advice: str = "",
    food_eat:        str = "",
    food_avoid:      str = "",
    dos:             str = "",
    donts:           str = "",
    user_id:         int = None,      # ← added
    user_email:      str = "",        # ← added
    session_id:      str = "",        # ← added
):
    try:
        supabase = get_supabase()

        symptom_hash = hashlib.sha256(
            symptoms.lower().strip().encode()
        ).hexdigest()

        data = {
            "symptoms":        symptoms,
            "symptom_hash":    symptom_hash,
            "risk_level":      risk_level,
            "advice":          advice or brief_advice,
            "action":          action,
            "nepali_advice":   nepali_advice,
            "district":        district,
            "latitude":        latitude,
            "longitude":       longitude,
            "user_id":         user_id,       # ← added
            "user_email":      user_email,    # ← added
            "session_id":      session_id,    # ← added
        }

        result = supabase.table("triage_sessions").insert(data).execute()
        print(f"✅ Saved to Supabase: {risk_level}")
        return result

    except Exception as e:
        print(f"⚠️ Supabase save failed: {e}")
        return None


def get_all_sessions():
    try:
        supabase = get_supabase()
        result = supabase.table("triage_sessions") \
            .select("*") \
            .order("created_at", desc=True) \
            .execute()
        return result.data
    except Exception as e:
        print(f"⚠️ Failed to fetch sessions: {e}")
        return []


def get_user_history(user_id: int):      # ← added
    try:
        supabase = get_supabase()
        result = supabase.table("triage_sessions") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(50) \
            .execute()
        return result.data
    except Exception as e:
        print(f"⚠️ Failed to fetch user history: {e}")
        return []


def get_real_stats():
    try:
        supabase = get_supabase()
        result = supabase.table("triage_sessions") \
            .select("risk_level, district, created_at") \
            .execute()

        sessions = result.data
        if not sessions:
            return None

        total  = len(sessions)
        high   = sum(1 for s in sessions if s["risk_level"] == "HIGH")
        medium = sum(1 for s in sessions if s["risk_level"] == "MEDIUM")
        low    = sum(1 for s in sessions if s["risk_level"] == "LOW")

        district_counts = {}
        for s in sessions:
            d = s.get("district") or "Unknown"
            if d and d != "Unknown":
                district_counts[d] = district_counts.get(d, 0) + 1

        districts = [
            {"name": k, "count": v}
            for k, v in sorted(
                district_counts.items(),
                key=lambda x: x[1],
                reverse=True
            )
        ][:10]

        return {
            "total_sessions":    total,
            "risk_distribution": {
                "HIGH":   high,
                "MEDIUM": medium,
                "LOW":    low,
            },
            "districts": districts,
            "source":    "live"
        }

    except Exception as e:
        print(f"⚠️ Stats failed: {e}")
        return None


def test_connection():
    try:
        supabase = get_supabase()
        supabase.table("triage_sessions") \
            .select("id") \
            .limit(1) \
            .execute()
        print("✅ Supabase connected!")
        return True
    except Exception as e:
        print(f"❌ Supabase failed: {e}")
        return False