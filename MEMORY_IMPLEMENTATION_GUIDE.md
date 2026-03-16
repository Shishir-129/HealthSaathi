# Conversational Memory System - Complete Setup Guide

## The Problem You're Facing

**"Why every time the same prompt is asked, the previous prompt is not recognized?"**

The memory system **requires 3 conditions to work**. If any one is missing, it falls back to stateless responses (treating each query as brand new).

---

## ✅ Solution: 3 Requirements for Memory to Work

### Requirement 1️⃣: User Must Be Authenticated

**Problem:** If user is unauthenticated, memory is disabled
- System uses old `analyze_symptoms()` (stateless, no memory)
- Instead of new `get_ai_response_with_memory()` (context-aware)

**Fix:** Authenticate user before triage

```bash
# Step 1: Register or Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Response: {"session_token": "abc123xyz...", ...}

# Step 2: Store the token
SESSION_TOKEN="abc123xyz..."

# Step 3: Always include token in requests
curl -X POST http://localhost:8000/api/triage/ \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: $SESSION_TOKEN" \
  -d '{"symptoms": "I have fever"}'
```

**Frontend Implementation:**
```javascript
// After login, store token
const { session_token } = await loginAPI();
localStorage.setItem('sessionToken', session_token);

// Before every API call, include it
const token = localStorage.getItem('sessionToken');
const headers = {
  'X-Session-Token': token,
  'Content-Type': 'application/json'
};
```

---

### Requirement 2️⃣: conversation_id Must Be Reused

**Problem:** If you don't send `conversation_id` on subsequent requests, it creates a NEW conversation (loses all history)

**Example of WRONG approach:**

```bash
# Request 1 ✓
curl -X POST http://localhost:8000/api/triage/ \
  -H "X-Session-Token: $TOKEN" \
  -d '{"symptoms": "fever"}'

# Response: {"conversation_id": "f704ae54-...", ...}

# Request 2 ❌ WRONG - NO conversation_id!
curl -X POST http://localhost:8000/api/triage/ \
  -H "X-Session-Token: $TOKEN" \
  -d '{"symptoms": "also have cough"}'
  # ↑ Creates NEW conversation, forgets about fever!
```

**Example of CORRECT approach:**

```bash
# Request 1 ✓
curl -X POST http://localhost:8000/api/triage/ \
  -H "X-Session-Token: $TOKEN" \
  -d '{"symptoms": "fever"}'

# Response: {"conversation_id": "f704ae54-731a-44e4-9711-e2bbffbe6db0", ...}
# SAVE THIS ID!

# Request 2 ✅ CORRECT - Include conversation_id!
curl -X POST http://localhost:8000/api/triage/ \
  -H "X-Session-Token: $TOKEN" \
  -d '{
    "symptoms": "also have cough",
    "conversation_id": "f704ae54-731a-44e4-9711-e2bbffbe6db0"
  }'
  # ↑ AI now remembers the fever from Request 1!
```

**Frontend Implementation:**
```javascript
// After first triage request
const firstResponse = await triageAPI.analyze(symptoms, { token });
const conversationId = firstResponse.conversation_id;
sessionStorage.setItem('conversationId', conversationId);  // SAVE IT

// For all subsequent requests
const conversationId = sessionStorage.getItem('conversationId');
const nextResponse = await triageAPI.analyze(newSymptoms, { 
  token,
  conversation_id: conversationId  // REUSE IT
});
```

---

### Requirement 3️⃣: Messages Must Be Saved in Database

**Problem:** If ChatMessage model isn't migrated, messages aren't stored (memory has nothing to retrieve)

**Fix:** Ensure migrations applied

```bash
# Step 1: Create migrations
cd /home/prashant/Coding/Projects/HealthSathi/backend
python3 manage.py makemigrations

# Output should show:
#   Migrations for 'triage':
#     triage/migrations/0004_chatmessage.py
#       - Create model ChatMessage

# Step 2: Apply migrations
python3 manage.py migrate

# Output should show:
#   Applying triage.0004_chatmessage... OK

# Step 3: Verify in database
sqlite3 db.sqlite3 ".tables" | grep chatmessage
# Should show: triage_chatmessage
```

---

## 🔍 How to Verify Memory is Working

### Test 1: Check if authenticated (Requirement 1)

```bash
# Make triage request WITHOUT token
curl -X POST http://localhost:8000/api/triage/ \
  -d '{"symptoms": "fever"}'

# Look at server logs - should show:
#   🔐 Authenticated user: NONE (unauthenticated)
#   ⚠️  Using STATELESS response (NOT authenticated - NO MEMORY)

# If you see above, memory is OFF!
```

### Test 2: Check if conversation_id is reused (Requirement 2)

```bash
# Check server logs for:
#   💬 Conversation ID received: f704ae54-731a-44e4-9711-e2bbffbe6db0
#   ✓ Found existing conversation: f704ae54-731a-44e4-9711-e2bbffbe6db0

# If you see "Found existing", memory is ON!
# If you see no conversation_id line, you didn't send it
```

### Test 3: Check if messages are persisting (Requirement 3)

```bash
# Use diagnostic endpoint
curl -X GET http://localhost:8000/api/conversation/f704ae54-731a-44e4-9711-e2bbffbe6db0/memory-diagnostic/ \
  -H "X-Session-Token: $TOKEN"

# Look for "messages": {"total": X}
# If total > 0, messages are saved!
# If total = 0, ChatMessage migration failed
```

---

## 📊 Full Example: Memory Flow

### Turn 1: First symptom
```bash
curl -X POST http://localhost:8000/api/triage/ \
  -H "X-Session-Token: eye34k2m3k2m..." \
  -d '{"symptoms": "I feel very hot"}'
```

**Response:**
```json
{
  "risk": "MEDIUM",
  "brief_advice": "Visit clinic if fever persists",
  "conversation_id": "abc-123",
  "_memory_aware": true
}
```

**Server logs show:**
```
🔐 Authenticated user: test_user
🧠 Using MEMORY-AWARE response (authenticated)
✓ NEW conversation created: abc-123
✓ Response ready with conversation_id: abc-123
✓ Memory-aware: true
```

**Behind the scenes:**
- Creates new Conversation record
- Saves user query to ChatMessage
- Saves AI response to ChatMessage
- Saves both to ChromaDB

---

### Turn 2: Follow-up symptom (WITH conversation_id)
```bash
curl -X POST http://localhost:8000/api/triage/ \
  -H "X-Session-Token: eye34k2m3k2m..." \
  -d '{
    "symptoms": "my throat is also sore now",
    "conversation_id": "abc-123"
  }'
```

**Response includes awareness of previous fever:**
```json
{
  "risk": "MEDIUM",
  "brief_advice": "Fever + sore throat suggests viral infection. Rest and hydrate...",
  "conversation_id": "abc-123",
  "_memory_aware": true
}
```

**Server logs show:**
```
🔐 Authenticated user: test_user
💬 Conversation ID received: abc-123
✓ Found existing conversation: abc-123
🧠 Using MEMORY-AWARE response (authenticated)
📚 Retrieved 2 history messages  ← IT REMEMBERS!
📚 Retrieved 1 historical context(s)  ← RAG WORKING!
✓ Response ready with conversation_id: abc-123
✓ Memory-aware: true
```

**Behind the scenes:**
- Found existing Conversation (abc-123)
- Retrieved last 4 messages (Turn 1: fever + response)
- Queried ChromaDB (matched "hot" → remembered fever)
- Built prompt with context: system + rag_context + history + new_query
- Azure GPT-5.4 received: "Previous: fever. Current: sore throat"
- Returned better answer that connects the symptoms
- Saved new Q&A to both ChatMessage and ChromaDB

---

### Turn 3: Another follow-up (conversation_id automatic)
```bash
curl -X POST http://localhost:8000/api/triage/ \
  -H "X-Session-Token: eye34k2m3k2m..." \
  -d '{
    "symptoms": "should I eat anything specific?",
    "conversation_id": "abc-123"
  }'
```

**Response is informed by FULL symptom picture:**
```json
{
  "risk": "MEDIUM",
  "brief_advice": "For fever + sore throat: soft foods, warm liquids, avoid dairy",
  "food_eat": "Rice water | Warm honey-lemon | Broth | Soft fruits",
  "food_avoid": "Dairy | Spicy food | Hard foods that hurt throat",
  "conversation_id": "abc-123",
  "_memory_aware": true
}
```

**Key point:** AI knows about BOTH fever AND sore throat from previous turns!

---

## 🐛 Troubleshooting Checklist

| Problem | Symptom | Solution |
|---------|---------|----------|
| **Same answer every time** | AI doesn't reference previous symptoms | Check: Is user authenticated? Is conversation_id sent? |
| **"not authenticated" in logs** | Memory OFF | Login first, get token, send X-Session-Token header |
| **"NEW conversation created" every time** | Creates new conversation each request | Send conversation_id from 1st response in 2nd request |
| **"Cannot find message history"** | Memory retrieval error | Run: python manage.py migrate |
| **Memory diagnostic shows total: 0** | Messages not saving | Check database write permissions, check error logs |
| **_memory_aware: false in response** | Memory system bypassed | Check if auth_user is None in TriageView logs |

---

## 📝 Implementation Checklist for Frontend

- [ ] After login, store `session_token` in localStorage
- [ ] Before every API call, include `X-Session-Token` header
- [ ] After first triage request, store `conversation_id` from response
- [ ] Before subsequent triage requests, send `conversation_id` in payload
- [ ] Test with diagnostic endpoint to verify messages persist
- [ ] Check browser console for 401/403 errors (auth issues)
- [ ] Check server logs for "MEMORY-AWARE" and history retrieval messages

---

## ⏰ Critical Deadline

**API keys expire: March 17, 2026 at midnight**

- ✅ Memory system implemented and tested
- ✅ Authentication required for memory
- ✅ Token trimming implemented (2000 token limit)
- ✅ Rate limiting enforced (10 RPM)
- ⚠️ **TODO:** Test with real user flows before midnight

---

## 📚 API Reference

### Memory-Aware Triage Request
```
POST /api/triage/
Headers:
  X-Session-Token: <token>
  Content-Type: application/json

Body:
{
  "symptoms": "string (required)",
  "conversation_id": "uuid (optional - required for memory)",
  "lat": float (optional),
  "lng": float (optional),
  "district": string (optional)
}
```

### Memory Diagnostic Endpoint
```
GET /api/conversation/<conversation_id>/memory-diagnostic/
Headers:
  X-Session-Token: <token>
  
Response includes:
  - All messages in conversation
  - Token counts
  - Memory status
  - Troubleshooting instructions
```

---

## 🎯 Key Takeaway

Memory doesn't work without **all 3**:

1. **Authenticated user** (have X-Session-Token? ✅)
2. **conversation_id reused** (saving and sending back ID? ✅)
3. **Messages persisting** (migrations applied? ✅)

If memory still isn't working:
1. Check server logs for "Authenticated user" and "Memory-aware" messages
2. Call diagnostic endpoint and check total message count
3. Verify all 3 conditions above are met
