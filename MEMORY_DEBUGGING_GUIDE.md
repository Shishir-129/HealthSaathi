"""
CONVERSATIONAL MEMORY DEBUGGING GUIDE
======================================

Memory System Requirements (ALL 3 must be true):

1️⃣  USER MUST BE AUTHENTICATED
   - If not authenticated → uses old analyze_symptoms() (NO MEMORY)
   - If authenticated → uses get_ai_response_with_memory() (WITH MEMORY)
   
   How to test:
   - Get X-Session-Token from /api/auth/login/
   - Include in request header: "X-Session-Token: <token>"

2️⃣  conversation_id MUST BE REUSED
   - First request: Response includes "conversation_id"
   - Subsequent requests: MUST send same "conversation_id" in payload
   - If no conversation_id provided → creates NEW conversation (loses history!)
   
   How to test:
   - Save conversation_id from first response
   - Send it back in next request: {"symptoms": "...", "conversation_id": "xyz"}

3️⃣  MESSAGES MUST BE SAVED IN DATABASE
   - Each Q&A is saved to ChatMessage table
   - Each Q&A is also saved to ChromaDB
   - If not saving → memory won't work in next turn
   
   How to test:
   - Check triage_chatmessage table directly
   - Verify conversation has multiple messages

═══════════════════════════════════════════════════════════════════════════════
QUICK DIAGNOSIS TEST
═══════════════════════════════════════════════════════════════════════════════

SCENARIO 1: User is NOT authenticated
────────────────────────────────────────────────────────────────────────────────

Request 1:
  POST /api/triage/
  Body: {"symptoms": "fever"}
  Headers: {} ← NO authentication
  
  Result: Uses analyze_symptoms() → NO PREVIOUS CONTEXT
  
  ❌ PROBLEM: Unauthenticated user gets no memory
  
  Fix: 
    1. Login first: POST /api/auth/login/ 
    2. Get token from response
    3. Include token in subsequent requests


SCENARIO 2: User IS authenticated BUT conversation_id is NOT reused
────────────────────────────────────────────────────────────────────────────────

Request 1:
  POST /api/triage/
  Body: {"symptoms": "fever"}
  Headers: {"X-Session-Token": "abc123"}
  
  Response:
    {
      "risk": "MEDIUM",
      "conversation_id": "f704ae54-731a-44e4-9711-e2bbffbe6db0",  ← SAVE THIS!
      ...
    }

Request 2:  ❌ WRONG
  POST /api/triage/
  Body: {"symptoms": "still have cough"}  ← NO conversation_id!
  Headers: {"X-Session-Token": "abc123"}
  
  Result: Creates NEW conversation (loses previous fever context)
  
  Fix: ALWAYS send conversation_id in subsequent requests:
  
  Request 2:  ✅ CORRECT
  POST /api/triage/
  Body: {
    "symptoms": "still have cough",
    "conversation_id": "f704ae54-731a-44e4-9711-e2bbffbe6db0"  ← REUSE!
  }
  Headers: {"X-Session-Token": "abc123"}


SCENARIO 3: User IS authenticated, conversation_id IS reused
                    BUT ChatMessage not saving
────────────────────────────────────────────────────────────────────────────────

Request 1 & 2: Correct setup, but messages aren't persisted

Check database:
  $ sqlite3 /path/to/db.sqlite3
  sqlite> SELECT COUNT(*) FROM triage_chatmessage;
  
  If return is 0 → Messages not saving
  
  Likely cause: 
    - ChatMessage model not migrated
    - Database write permission issue
    - Exception in _save_messages_to_conversation()
    
  Fix:
    - Run: python manage.py migrate
    - Check logs for "Failed to save messages:"


═══════════════════════════════════════════════════════════════════════════════
VERIFY EVERYTHING IS WORKING
═══════════════════════════════════════════════════════════════════════════════

Step 1: Check migrations applied
  $ python manage.py showmigrations triage | grep -i chatmessage
  
  Should show: [X] 0004_chatmessage  ← marked with [X]

Step 2: Test with proper flow
  
  # Step A: Register/Login
  $ curl -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"email": "user@test.com", "password": "password123"}'
  
  Response: {"session_token": "abc123def456..."}
  
  # Step B: First symptom (gets conversation_id)
  $ curl -X POST http://localhost:8000/api/triage/ \
    -H "Content-Type: application/json" \
    -H "X-Session-Token: abc123def456..." \
    -d '{"symptoms": "I have fever"}'
  
  Response: {"risk": "MEDIUM", "conversation_id": "XXX-YYY-ZZZ", ...}
  
  # Step C: Second symptom (REUSE conversation_id)
  $ curl -X POST http://localhost:8000/api/triage/ \
    -H "Content-Type: application/json" \
    -H "X-Session-Token: abc123def456..." \
    -d '{"symptoms": "now also have cough", "conversation_id": "XXX-YYY-ZZZ"}'
  
  Response should include:
    - "_memory_aware": true  ← Indicates memory was used!
    - "_source": "azure_gpt_5_4"  ← Used GPT-5.4 with context
    - Retrieved context from: "fever" in previous turn
    
  # Step D: Verify in database
  $ python manage.py dbshell
  
  > SELECT id, conversation_id, role, content FROM triage_chatmessage 
    WHERE conversation_id = 'XXX-YYY-ZZZ' 
    ORDER BY created_at;
    
  Should show: 2 messages minimum (user's fever, assistant's response)
              + 2 messages (user's cough, assistant's response)
              = 4 total messages


═══════════════════════════════════════════════════════════════════════════════
COMMON MISTAKES
═══════════════════════════════════════════════════════════════════════════════

❌ Mistake 1: Forgetting to include X-Session-Token
   → Falls back to unauthenticated path (no memory)
   
❌ Mistake 2: Not reusing conversation_id
   → Creates new conversation each time (loses history)
   
❌ Mistake 3: Passing conversation_id but not authenticated
   → Authenticated check happens FIRST
   → Still gets no memory if not logged in
   
❌ Mistake 4: Migrations not applied
   → ChatMessage table doesn't exist
   → _save_messages_to_conversation() fails silently
   → Memory system activated but not persisting


═══════════════════════════════════════════════════════════════════════════════
EXPECTED BEHAVIOR WHEN WORKING CORRECTLY
═══════════════════════════════════════════════════════════════════════════════

Turn 1:
  Input: "I feel hot and tired"
  Output: {"risk": "MEDIUM", "conversation_id": "abc123", ...}
  
  Behind scenes:
  ✓ Conversation created with id="abc123"
  ✓ User message saved to ChatMessage
  ✓ AI response saved to ChatMessage
  ✓ Everything also saved to ChromaDB

Turn 2:
  Input: "my cough is getting worse" + conversation_id="abc123"
  
  Behind scenes:
  ✓ Retrieves last 4 messages (has Turn 1 context)
  ✓ Queries ChromaDB for relevant facts ("hot and tired" from Turn 1)
  ✓ Builds: system_prompt + rag_context + history + new_query
  ✓ Azure GPT-5.4 receives context about Turn 1
  ✓ Returns better answer that references previous symptoms
  ✓ Saves new Q&A to both ChatMessage and ChromaDB

Turn 3:
  Input: "any dietary restrictions?" + conversation_id="abc123"
  
  Behind scenes:
  ✓ Retrieves last 4: Turn 1 (~2 hrs ago), Turn 2 (recent)
  ✓ ChromaDB retrieves: "hot", "tired", "fever", "cough" from history
  ✓ AI response now aware of full symptom progression
  ✓ Recommends diet based on accumulated symptom picture
  
  💡 KEY: Each turn gets RICHER context!


═══════════════════════════════════════════════════════════════════════════════
WHERE TO ADD LOGGING TO DEBUG
═══════════════════════════════════════════════════════════════════════════════

Edit: backend/triage/views.py TriageView.post()

Add these lines to see what's happening:

    print(f"🔍 auth_user: {auth_user}")  # Will be None if not authenticated
    print(f"🔍 conversation_id received: {conversation_id}")
    print(f"🔍 Using memory_aware: {bool(auth_user)}")
    
    if auth_user:
        result = get_ai_response_with_memory(...)
    else:
        result = analyze_symptoms(...)
        print(f"⚠️  NOT USING MEMORY (unauthenticated)")
    
    print(f"🔍 Response has _memory_aware: {result.get('_memory_aware')}")


═══════════════════════════════════════════════════════════════════════════════
FRONTEND REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Your frontend MUST:

1. After login, store the session_token:
   const token = response.session_token;  // or token
   localStorage.setItem('sessionToken', token);

2. Before each API call, include it:
   const token = localStorage.getItem('sessionToken');
   headers: {
     'X-Session-Token': token,
     'Content-Type': 'application/json'
   }

3. After first triage request, store conversation_id:
   const { conversation_id } = await triageAPI.analyze(symptoms);
   sessionStorage.setItem('conversationId', conversation_id);

4. On subsequent requests, INCLUDE conversation_id:
   const conversationId = sessionStorage.getItem('conversationId');
   const result = await triageAPI.analyze(newSymptoms, {
     conversation_id: conversationId
   });

═══════════════════════════════════════════════════════════════════════════════
"""

print(__doc__)
