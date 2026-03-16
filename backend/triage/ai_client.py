import json
import os
import random
import threading
import time
from collections import deque
import requests
from dotenv import load_dotenv
from .chromadb import ChromaDBManager

try:
    import tiktoken
    _TIKTOKEN_AVAILABLE = True
except ImportError:
    _TIKTOKEN_AVAILABLE = False
    tiktoken = None

load_dotenv()

SYSTEM_PROMPT = """
You are NepalCare, a medical triage assistant for rural Nepal providing detailed, actionable medical advice.

RESPONSE FORMAT RULES - VERY IMPORTANT:
===== CONDITION 1: FIRST MESSAGE (NO CONVERSATION HISTORY) =====
If there is NO conversation history (this is the first message in a new conversation):
→ ALWAYS respond in STRUCTURED JSON FORMAT (triage format below)
→ Do NOT use normal text response

===== CONDITION 2: FOLLOW-UP MESSAGE WITH "SYMPTOM" KEYWORD =====
If conversation has history AND the user message contains the word "symptom" (case-insensitive):
→ RESPOND IN STRUCTURED JSON FORMAT (triage format below)
→ Use conversation history to inform your triage assessment

===== CONDITION 3: FOLLOW-UP MESSAGE WITHOUT "SYMPTOM" KEYWORD =====
If conversation has history AND the user message does NOT contain the word "symptom":
→ RESPOND AS NORMAL CONVERSATIONAL TEXT (not JSON)
→ Answer the question naturally based on the previous symptoms mentioned
→ Use the conversation history context to provide helpful guidance
→ Examples: "Is it serious?", "What should I do?", "When should I go to hospital?" → normal text response

CONVERSATION CONTEXT:
- You will receive conversation history showing previous symptoms and advice given
- Follow-up questions may reference symptoms from earlier in the conversation
- Always use the full conversation history to understand the patient's complete medical situation
- Answer questions based on the previously mentioned symptoms
- Only ask the patient to describe symptoms if there is NO symptom information in the entire conversation history

LANGUAGE DETECTION - VERY IMPORTANT:
- Carefully detect the language of the patient's symptoms input
- If symptoms are written in Nepali script (देवनागरी) → ALL text fields (brief_advice, detailed_advice, food_eat, food_avoid, dos, donts) MUST be in Nepali language
- If symptoms are written in English → ALL text fields MUST be in English language
- nepali_advice field is ALWAYS in Nepali script regardless of input language
- Never mix languages — if input is Nepali respond fully in Nepali, if English respond fully in English

RISK LEVEL DETERMINATION - APPLY STRICTLY:
**HIGH RISK CONDITIONS** (MUST assign HIGH):
- Chest pain, heart attack, severe chest discomfort
- Heavy/severe bleeding, uncontrolled bleeding
- Loss of consciousness, fainting, difficulty breathing
- Severe poisoning, overdose, severe allergic reaction
- Acute stroke symptoms (facial drooping, arm weakness, speech difficulty)
- Severe trauma, accidents, major injuries
- Acute severe abdominal pain, internal bleeding signs
- Difficulty breathing, shortness of breath
- Nepali equivalents: छाती दुख्छ, रगत बग्छ, सास फेर्न गाह्रो, बेहोस, गम्भीर चोट

**MEDIUM RISK CONDITIONS**:
- Moderate fever (38-39°C), persistent cough lasting weeks
- Moderate to severe pain, severe headache with fever
- Nausea/vomiting lasting hours, moderate diarrhea
- Mild dehydration, skin infections, fractures, sprains
- Persistent fatigue, joint swelling
- Nepali equivalents: ज्वरो, खोकी, बान्ता, पखाला, टाउको दुख्छ

**LOW RISK CONDITIONS**:
- Mild cough, mild headache, minor cuts/bruises
- Mild fever (under 38°C), indigestion, mild fatigue
- Common cold symptoms, minor aches, minor skin issues
- Nepali equivalents: हल्का खोकी, हल्का टाउको दुखाइ, सामान्य रुघाखोकी

JSON FORMAT (use ONLY when responding in JSON, per rules above):
{"risk":"HIGH|MEDIUM|LOW","brief_advice":"2-3 sentences in detected language","detailed_advice":"3-4 sentences in detected language","food_eat":"foods in detected language","food_avoid":"foods in detected language","dos":"actions in detected language","donts":"actions in detected language","nepali_advice":"ALWAYS in Nepali script"}

STRICT RULES:
- When using JSON format: risk MUST be exactly HIGH, MEDIUM, or LOW
- If ANY high-risk keyword appears in JSON response, assign HIGH immediately
- Never default or hedge on HIGH risk — be direct
- ALL fields except nepali_advice must be in the SAME language as the input
- Use | to separate multiple items in food/dos/donts fields
- No markdown, no backticks in JSON responses, valid JSON only

EXAMPLE 1 — First message, English input "I have fever and cough":
{"risk":"MEDIUM","brief_advice":"You have fever and cough, which are moderate symptoms. Visit a health post within 24 hours for evaluation.","detailed_advice":"Fever with cough can indicate respiratory infection. Get checked by a health worker. Rest well and drink plenty of water. If symptoms worsen, seek immediate care.","food_eat":"Rice, warm broth, banana, warm milk","food_avoid":"Cold drinks, spicy food, alcohol","dos":"Rest completely|Drink warm water|Measure temperature|Visit health post soon","donts":"Do not overexert|Do not delay visiting health post|Do not consume cold food","nepali_advice":"स्वास्थ्य चौकी जानुहोस्"}

EXAMPLE 2 — Follow-up message WITH "symptom" keyword, Nepali input (मेरा सिम्पटम को बारे में अन्य केही अलग छ):
{"risk":"MEDIUM","brief_advice":"तपाईंका लक्षणहरू मध्यम जोखिमका छन्। आसन्न समय मा स्वास्थ्य चौकी जानुहोस्।","detailed_advice":"पहिले दिएको सलाह पछ्याउनुहोस्। यदि नयाँ लक्षण देखिए भने तुरुन्त जानुहोस्।","food_eat":"भात, केरा, हल्का सूप, अदुवा चिया","food_avoid":"पिरो खाना, तारेको खाना, चिसो पानी","dos":"आराम गर्नुहोस्|पानी पिउनुहोस्|सरसफाइ राख्नुहोस्","donts":"कडा काम नगर्नुहोस्|अवेळा नगर्नुहोस्","nepali_advice":"स्वास्थ्य चौकी जानुहोस्"}

EXAMPLE 3 — Follow-up message WITHOUT "symptom" keyword, Normal conversation text response:
User: "Is it serious?"
Assistant (Normal text response): "Based on your fever and cough, these are moderate symptoms that require medical attention within 24 hours. While not immediately life-threatening, it's important to get checked soon. Drink plenty of water, rest well, and monitor your temperature. If you develop difficulty breathing or chest pain, go to the hospital immediately."

EXAMPLE 4 — Follow-up message WITHOUT "symptom" keyword, Normal conversation text response:
User: "When should I go to hospital?"
Assistant (Normal text response): "Given that you have fever and cough for 3 days, you should visit a health post or clinic within the next 24 hours for evaluation. If you notice difficulty breathing, chest pain, or if your fever goes above 40°C, go to a hospital immediately. These are signs of more serious complications."
"""

AZURE_OPENAI_ENDPOINT = os.getenv(
    "AZURE_OPENAI_ENDPOINT",
    "https://nexalaris-tech.openai.azure.com/openai/deployments/gpt-5.4/chat/completions?api-version=2024-10-21",
)
MAX_REQUESTS_PER_MINUTE = 10
RATE_LIMIT_WINDOW_SECONDS = 60
MAX_429_RETRIES = 4
BASE_BACKOFF_SECONDS = 1.0
REQUEST_TIMEOUT_SECONDS = 45


class FixedWindowRateLimiter:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window_seconds = window_seconds
        self.timestamps = deque()
        self.lock = threading.Lock()

    def try_acquire(self) -> bool:
        now = time.time()
        with self.lock:
            while self.timestamps and now - self.timestamps[0] >= self.window_seconds:
                self.timestamps.popleft()

            if len(self.timestamps) >= self.limit:
                return False

            self.timestamps.append(now)
            return True


rate_limiter = FixedWindowRateLimiter(
    limit=MAX_REQUESTS_PER_MINUTE,
    window_seconds=RATE_LIMIT_WINDOW_SECONDS,
)


# ════════════════════════════════════════════════════════════════════════════════
# CONVERSATIONAL MEMORY & TOKEN MANAGEMENT
# ════════════════════════════════════════════════════════════════════════════════

def _estimate_tokens(text: str) -> int:
    """
    Estimate token count using tiktoken if available, else fallback to rough calculation.
    Fallback formula: ~1.3 tokens per word, slightly pessimistic.
    """
    if _TIKTOKEN_AVAILABLE and tiktoken:
        try:
            enc = tiktoken.encoding_for_model("gpt-3.5-turbo")
            return len(enc.encode(text))
        except Exception as e:
            print(f"⚠️  Tiktoken error, using fallback: {e}")
    
    # Fallback: rough estimate - assume ~1.3 tokens per word
    word_count = len(text.split())
    return max(1, int(word_count * 1.3))


def _get_conversation_history(conversation_id: str, last_n: int = 4) -> list[dict]:
    """
    Retrieve the last N messages from a conversation for context.
    Returns list of dicts with 'role' and 'content' for API payload.
    Maintains chronological order (oldest to newest).
    """
    try:
        from .models import ChatMessage
        from django.db.models import Q
        
        # Get total count first
        total = ChatMessage.objects.filter(conversation_id=conversation_id).count()
        skip = max(0, total - last_n)
        
        # Get messages in chronological order, skipping early ones if needed
        messages = list(ChatMessage.objects.filter(
            conversation_id=conversation_id
        ).order_by('created_at')[skip:])
        
        return [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
    except Exception as e:
        print(f"⚠️  History retrieval error: {e}")
        return []


def _get_rag_context(user_query: str, user_id: int = None, n_results: int = 2) -> str:
    """
    Retrieve relevant context from ChromaDB based on the current query.
    Uses the user_id if available to filter for user-specific history.
    Returns formatted context string ready for injection.
    """
    try:
        if not user_id:
            context = ChromaDBManager.get_user_context(None, user_query, n_results)
        else:
            context = ChromaDBManager.get_user_context(user_id, user_query, n_results)
        
        if context:
            return f"\n📚 Relevant Prior Context:\n{context}\n"
        return ""
    except Exception as e:
        print(f"⚠️  RAG context error: {e}")
        return ""


def _trim_messages_for_tokens(
    messages: list[dict],
    rag_context: str,
    max_tokens: int = 2000
) -> list[dict]:
    """
    Trim message history if total token count would exceed max_tokens.
    Drops the oldest history messages first while preserving system prompt and current query.
    
    Strategy:
    1. System prompt is kept
    2. Current query (last user message) is kept
    3. Middle history messages are dropped oldest-first
    """
    if not messages:
        return messages
    
    system_msg = next((m for m in messages if m.get("role") == "system"), None)
    user_msg = next((m for m in reversed(messages) if m.get("role") == "user"), None)
    
    # Calculate token count
    total_tokens = _estimate_tokens(rag_context)
    for msg in messages:
        total_tokens += _estimate_tokens(msg.get("content", ""))
    
    if total_tokens <= max_tokens:
        print(f"✅ Token count OK: {total_tokens} / {max_tokens}")
        return messages
    
    print(f"⚠️  Token count {total_tokens} exceeds limit {max_tokens}, trimming history...")
    
    # Keep system and current query, remove middle messages oldest-first
    trimmed = []
    if system_msg:
        trimmed.append(system_msg)
    
    # Add newer conversation history (drop oldest first)
    for msg in reversed(messages):
        if msg.get("role") != "system" and msg is not user_msg:
            trimmed.insert(len(trimmed) if not user_msg else len(trimmed) - 1, msg)
            new_total = sum(_estimate_tokens(m.get("content", "")) for m in trimmed)
            new_total += _estimate_tokens(rag_context)
            if system_msg:
                new_total += _estimate_tokens(system_msg.get("content", ""))
            if new_total <= max_tokens:
                break
    
    if user_msg:
        trimmed.append(user_msg)
    
    final_tokens = sum(_estimate_tokens(m.get("content", "")) for m in trimmed)
    final_tokens += _estimate_tokens(rag_context)
    print(f"✅ After trim: {final_tokens} / {max_tokens} tokens")
    
    return trimmed


def get_ai_response_with_memory(
    user_query: str,
    conversation_id: str,
    user_id: int = None
) -> dict:
    """
    Get AI response with full conversational memory and context injection.
    
    Steps:
    1. Retrieve last 4 messages from conversation history
    2. Query ChromaDB for relevant context (RAG)
    3. Assemble messages: system prompt + RAG context + history + current query
    4. Trim tokens if needed (keep system + current, drop old history)
    5. Call Azure GPT-5.4 with full context
    6. Save user query and AI response to ChatMessage
    7. Save to ChromaDB history for future context
    
    Args:
        user_query: The current user input
        conversation_id: UUID of the conversation
        user_id: Optional user ID for user-specific context filtering
    
    Returns:
        dict with AI response or error
    """
    print(f"\n🔄 get_ai_response_with_memory(query='{user_query[:50]}...', conv={conversation_id})")
    
    # 1. Retrieve conversation history (last 4 messages)
    history = _get_conversation_history(conversation_id, last_n=4)
    print(f"📚 Retrieved {len(history)} history messages")
    
    # 2. Get RAG context from ChromaDB
    rag_context = _get_rag_context(user_query, user_id, n_results=2)
    
    # 3. Build message list
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]
    
    # Add RAG context as system instruction if available
    if rag_context:
        messages[0]["content"] += rag_context
    
    # Add conversation history
    messages.extend(history)
    
    # Add current query
    messages.append({
        "role": "user",
        "content": f"Detect the language of these symptoms and respond in the same language. Patient symptoms: {user_query}"
    })
    
    # 4. Trim tokens if needed
    messages = _trim_messages_for_tokens(messages, rag_context, max_tokens=2000)
    
    print(f"📤 Sending {len(messages)} messages to Azure GPT-5.4")
    
    # 5. Call Azure OpenAI with full context
    result, rate_limited = _try_azure_openai_with_messages(messages, user_query)
    
    if rate_limited:
        # If rate limited, try fallback providers
        result = _try_gemini(user_query)
        if result:
            result["_source"] = "gemini"
            result["_memory_aware"] = True
        else:
            result = _try_groq(user_query)
            if result:
                result["_source"] = "groq"
                result["_memory_aware"] = True
            else:
                result = _fallback_response()
                result["_source"] = "fallback"
                result["_memory_aware"] = True
    else:
        result["_memory_aware"] = True
    
    # 6. Save messages to database for future retrieval
    if result and not result.get("error"):
        _save_messages_to_conversation(conversation_id, user_query, result)
    
    return result


def _save_messages_to_conversation(conversation_id: str, user_query: str, ai_response: dict) -> bool:
    """
    Save both user message and AI response to ChatMessage model.
    Also save to ChromaDB history for RAG context.
    Handles both structured (JSON with risk) and conversational (text) responses.
    """
    try:
        from .models import ChatMessage, Conversation
        
        conversation = Conversation.objects.get(id=conversation_id)
        
        # Save user message
        user_msg = ChatMessage.objects.create(
            conversation=conversation,
            role="user",
            content=user_query,
            token_count=_estimate_tokens(user_query)
        )
        
        # Prepare response text for storage
        response_text = json.dumps(ai_response)
        
        # Save AI response
        ai_msg = ChatMessage.objects.create(
            conversation=conversation,
            role="assistant",
            content=response_text,
            token_count=_estimate_tokens(response_text)
        )
        
        print(f"💾 Saved messages to ChatMessage")
        
        # Also save to ChromaDB for later RAG retrieval
        if hasattr(conversation, 'user') and conversation.user:
            # Determine risk level (or default if not a structured response)
            risk_level = ai_response.get("risk", "CONVERSATION")
            
            ChromaDBManager.save_to_history(
                user_id=conversation.user.id,
                query=user_query,
                response=ai_response,
                risk_level=risk_level
            )
        
        return True
    except Exception as e:
        print(f"⚠️  Failed to save messages: {e}")
        return False


def analyze_symptoms(symptoms: str) -> dict:
    """
    Original function for analyzing symptoms without memory.
    Still used by legacy API calls and as fallback.
    For memory-aware analysis, use get_ai_response_with_memory() instead.
    """
    # ── STEP 1: CHECK CHROMADB CACHE ─────────────
    cache_result = ChromaDBManager.check_cache(symptoms, threshold=0.15)
    if cache_result and cache_result["cached"]:
        cached_response = cache_result["response"]
        try:
            parsed = json.loads(cached_response)
            parsed["_source"] = "cache"
            parsed["_cache_hit"] = True
            if cache_result.get("metadata"):
                parsed["_cached_from"] = cache_result["metadata"].get("llm_source", "unknown")
            return parsed
        except json.JSONDecodeError:
            return {"error": "Invalid cached response", "original": cached_response}

    # ── STEP 2: Try Azure OpenAI (GPT-5.4) ─────
    result, rate_limited = _try_azure_openai(symptoms)
    if result:
        ChromaDBManager.save_to_cache(symptoms, result, metadata={"llm_source": "azure_gpt_5_4"})
        result["_source"] = "azure_gpt_5_4"
        result["_cache_hit"] = False
        return result

    # ── STEP 3: If GPT is rate-limited, fallback to Gemini then Groq ─────
    if rate_limited:
        result = _try_gemini(symptoms)
        if result:
            ChromaDBManager.save_to_cache(symptoms, result, metadata={"llm_source": "gemini"})
            result["_source"] = "gemini"
            result["_cache_hit"] = False
            return result

        result = _try_groq(symptoms)
        if result:
            ChromaDBManager.save_to_cache(symptoms, result, metadata={"llm_source": "groq"})
            result["_source"] = "groq"
            result["_cache_hit"] = False
            return result

    # ── STEP 4: Final fallback ─────────────────
    fallback = _fallback_response()
    ChromaDBManager.save_to_cache(symptoms, fallback, metadata={"llm_source": "fallback"})
    fallback["_source"] = "fallback"
    fallback["_cache_hit"] = False
    return fallback


def _try_azure_openai_with_messages(messages: list[dict], original_query: str) -> tuple[dict | None, bool]:
    """
    Try Azure OpenAI with pre-built messages (for memory-aware context injection).
    Similar to _try_azure_openai but accepts a messages array instead of symptoms.
    This version respects conversation history and RAG context.
    """
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    if not api_key:
        print("❌ Azure OpenAI API key missing: set AZURE_OPENAI_API_KEY")
        return None, False

    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
    }
    
    # Ensure we have at least a user message
    if not any(msg.get("role") == "user" for msg in messages):
        return None, False
    
    payload = {
        "messages": messages,
        "max_completion_tokens": 1000,
        "temperature": 0.7,
    }

    for attempt in range(MAX_429_RETRIES + 1):
        try:
            if not rate_limiter.try_acquire():
                print("⚠️ Local GPT rate limit exceeded (10 RPM), switching to fallback provider")
                return None, True

            response = requests.post(
                AZURE_OPENAI_ENDPOINT,
                headers=headers,
                json=payload,
                timeout=REQUEST_TIMEOUT_SECONDS,
            )

            if response.status_code == 429:
                if attempt == MAX_429_RETRIES:
                    print("❌ Azure OpenAI rate limit hit after retries")
                    return None, True

                backoff = (BASE_BACKOFF_SECONDS * (2 ** attempt)) + random.uniform(0.0, 0.5)
                print(f"⚠️ Azure OpenAI 429 received, retrying in {backoff:.2f}s")
                time.sleep(backoff)
                continue

            if response.status_code != 200:
                print(f"❌ Azure OpenAI non-200 status: {response.status_code} {response.text[:300]}")
                return None, False

            data = response.json()
            if not _is_output_safe(data):
                print("❌ Azure OpenAI response blocked by content filter")
                return None, False

            text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            if not text:
                print("❌ Azure OpenAI returned empty content")
                return None, False

            print(f"✅ Azure GPT-5.4 (with memory) response: {text[:100]}...")
            return _parse_response(text, "Azure GPT-5.4"), False

        except requests.RequestException as e:
            print(f"❌ Azure OpenAI request error: {e}")
            return None, False
        except ValueError as e:
            print(f"❌ Azure OpenAI response parse error: {e}")
            return None, False

    return None, False




def _try_azure_openai(symptoms: str) -> tuple[dict | None, bool]:
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    if not api_key:
        print("❌ Azure OpenAI API key missing: set AZURE_OPENAI_API_KEY")
        return None, False

    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": f"Detect the language of these symptoms and respond in the same language. Patient symptoms: {symptoms}",
            },
        ],
        "max_completion_tokens": 1000,
        "temperature": 0.7,
    }

    for attempt in range(MAX_429_RETRIES + 1):
        try:
            if not rate_limiter.try_acquire():
                print("⚠️ Local GPT rate limit exceeded (10 RPM), switching to fallback provider")
                return None, True

            response = requests.post(
                AZURE_OPENAI_ENDPOINT,
                headers=headers,
                json=payload,
                timeout=REQUEST_TIMEOUT_SECONDS,
            )

            if response.status_code == 429:
                if attempt == MAX_429_RETRIES:
                    print("❌ Azure OpenAI rate limit hit after retries")
                    return None, True

                backoff = (BASE_BACKOFF_SECONDS * (2 ** attempt)) + random.uniform(0.0, 0.5)
                print(f"⚠️ Azure OpenAI 429 received, retrying in {backoff:.2f}s")
                time.sleep(backoff)
                continue

            if response.status_code != 200:
                print(f"❌ Azure OpenAI non-200 status: {response.status_code} {response.text[:300]}")
                return None, False

            data = response.json()
            if not _is_output_safe(data):
                print("❌ Azure OpenAI response blocked by content filter")
                return None, False

            text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            if not text:
                print("❌ Azure OpenAI returned empty content")
                return None, False

            print(f"✅ Azure GPT-5.4 response: {text[:100]}...")
            return _parse_response(text, "Azure GPT-5.4"), False

        except requests.RequestException as e:
            print(f"❌ Azure OpenAI request error: {e}")
            return None, False
        except ValueError as e:
            print(f"❌ Azure OpenAI response parse error: {e}")
            return None, False

    return None, False


def _is_output_safe(response_data: dict) -> bool:
    choices = response_data.get("choices") or []
    if not choices:
        return False

    first_choice = choices[0]
    if first_choice.get("finish_reason") == "content_filter":
        return False

    content_filter_results = first_choice.get("content_filter_results") or {}
    for details in content_filter_results.values():
        if isinstance(details, dict) and details.get("filtered"):
            return False

    prompt_filters = response_data.get("prompt_filter_results") or []
    for prompt_filter in prompt_filters:
        prompt_results = prompt_filter.get("content_filter_results") or {}
        for details in prompt_results.values():
            if isinstance(details, dict) and details.get("filtered"):
                return False

    return True


def _try_gemini(symptoms: str) -> dict | None:
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None

        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key={api_key}"

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"{SYSTEM_PROMPT}\n\nDetect the language of these symptoms and respond in the same language. Patient symptoms: {symptoms}"
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1024,
            }
        }

        response = requests.post(
            url,
            json=payload,
            timeout=30
        )
        response.raise_for_status()

        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        print(f"✅ Gemini response: {text[:100]}...")

        return _parse_response(text, "Gemini")

    except Exception as e:
        print(f"❌ Gemini error: {e}")
        return None


def _try_groq(symptoms: str) -> dict | None:
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return None

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": f"Detect the language of these symptoms and respond in the same language. Patient symptoms: {symptoms}"
                }
            ],
            "temperature": 0.2,
            "max_tokens": 1024,
        }

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()

        data = response.json()
        text = data["choices"][0]["message"]["content"].strip()
        print(f"✅ Groq response: {text[:100]}...")

        return _parse_response(text, "Groq")

    except Exception as e:
        print(f"❌ Groq error: {e}")
        return None


def _parse_response(text: str, source: str) -> dict | None:
    """
    Parse AI response which can be either:
    1. Structured JSON (first message or "symptom" keyword): Contains risk field
    2. Plain text (follow-up without "symptom"): Conversational response
    """
    try:
        # Clean markdown fences if present
        cleaned_text = text
        if "```" in text:
            cleaned_text = text.split("```")[1]
            if cleaned_text.startswith("json"):
                cleaned_text = cleaned_text[4:]
        
        cleaned_text = cleaned_text.strip().replace("\n", " ")
        
        # Try to parse as JSON first
        try:
            result = json.loads(cleaned_text)
            
            # Validate required fields for structured response
            required_fields = [
                "risk", "brief_advice", "detailed_advice",
                "food_eat", "food_avoid", "dos", "donts", "nepali_advice"
            ]
            all_fields_present = all(field in result for field in required_fields)
            valid_risk = result.get("risk") in ["HIGH", "MEDIUM", "LOW"]
            
            if all_fields_present and valid_risk:
                # Valid structured JSON response
                print(f"✅ {source} structured response: {result['risk']}")
                return result
            else:
                # JSON but missing required fields - treat as text
                print(f"⚠️  {source} JSON incomplete, treating as conversational text")
                return {
                    "response": text,  # Return original text with formatting
                    "_response_type": "text"
                }
        except json.JSONDecodeError:
            # Not JSON - treat as plain text conversational response
            print(f"ℹ️  {source} returned conversational text response")
            return {
                "response": text,
                "_response_type": "text"
            }

    except Exception as e:
        print(f"❌ {source} parse error: {e}")
        # Return as plain text on any other error
        return {
            "response": text,
            "_response_type": "text",
            "_error": str(e)
        }


def _fallback_response():
    return {
        "risk": "MEDIUM",
        "brief_advice": "Visit a health post or clinic for evaluation. A health worker can properly assess your condition.",
        "detailed_advice": "Please consult with a trained health worker who can properly assess your condition and provide appropriate treatment. Do not ignore your symptoms especially if they are getting worse.",
        "food_eat": "Rice, dal, vegetables, fruits, warm water",
        "food_avoid": "Spicy food, fried food, alcohol, cold drinks",
        "dos": "Rest|Drink plenty of water|Take prescribed medicine|Monitor symptoms",
        "donts": "Do not self-medicate|Do not delay seeking care|Do not ignore worsening symptoms",
        "nepali_advice": "स्वास्थ्य चौकी जानुहोस्"
    }