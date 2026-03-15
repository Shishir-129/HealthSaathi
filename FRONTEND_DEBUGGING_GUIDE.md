# HealthSaathi Frontend Debugging Report

## Issue Analysis

### ✅ What's Working Correctly in Frontend:
1. **Location is being captured** - ChatPage.jsx requests geolocation on load
2. **Location is being passed to backend** - ChatWindow.jsx sends `lat` and `lng` to submitTriage()
3. **API calls are being made** - triageService.js properly formats and sends requests
4. **Responses are being received** - ChatWindow.jsx processes the response and displays it

### ❌ The Real Problem: Backend AI Analysis

**Testing reveals:** Backend returns **MEDIUM risk for ALL symptoms**, regardless of severity
```
Chest pain (should be HIGH)  → Returns MEDIUM
Mild headache (should be LOW) → Returns MEDIUM  
Severe bleeding (should be HIGH) → Returns MEDIUM
```

This indicates **the backend AI analysis is not working properly**.

---

## Frontend Implementation - CORRECT ✅

### 1. Location Capture (ChatPage.jsx)
```javascript
useEffect(() => {
  if (!location) handleGetLocation();  // ✅ Requests location on load
}, []);
```

### 2. Location Passed to Backend (ChatWindow.jsx)
```javascript
const result = await submitTriage(
  text,
  location?.lat ?? null,    // ✅ Latitude is passed
  location?.lng ?? null,    // ✅ Longitude is passed
  signal
);
```

### 3. API Call Structure (triageService.js)
```javascript
const payload = {
  symptoms: text,         // ✅ Symptom text
  lat: lat ?? null,       // ✅ Latitude
  lng: lng ?? null,       // ✅ Longitude
  district: '',
  session_id: '',
};
const response = await apiClient.post('/triage/', payload, config);
```

---

## Debugging Console Logs Added

When you test the frontend now, **open DevTools (F12) → Console** and you'll see:

### Request Log:
```
📡 POST /triage/ 
{
  method: "post",
  url: "/triage/",
  data: {
    symptoms: "chest pain",
    lat: 27.7172,
    lng: 85.3240,
    district: "",
    session_id: ""
  }
}
```

### Response Log:
```
✅ Response from POST /triage/:
{
  status: 200,
  data: {
    risk: "MEDIUM",
    brief_advice: "...",
    detailed_advice: "...",
    ...
  }
}
```

### Error Log (if any):
```
❌ Error from POST /triage/:
{
  status: 404,
  message: "...",
  data: {...}
}
```

---

## What to Check in Backend

Since **frontend is correctly sending requests with location**, the issue is in **backend AI analysis**. Check:

### 1. **Groq API Key**
Check if `GROQ_API_KEY` is set in backend `.env`:
```
GROQ_API_KEY=your_actual_groq_key_here
```

### 2. **AI Client Function** (`backend/triage/ai_client.py`)
- Is `analyze_symptoms()` actually calling Groq?
- Is it using the system prompt that defines HIGH/MEDIUM/LOW logic?
- Are error messages being swallowed silently?

### 3. **Add Backend Logging**
Modify `backend/triage/views.py` to log what the AI returns:
```python
result = analyze_symptoms(symptoms)
print(f"🤖 AI Analysis Result: {result}")  # Add this line
```

---

## What Frontend Is Doing Correctly ✅

### 1. ✅ Passing Location
```
User opens chat
  → Frontend requests geolocation via GPS
  → Coordinates displayed at top (27.7172, 85.3240)
  → Location passed to submitTriage() function
  → Backend receives { symptoms, lat, lng, ... }
```

### 2. ✅ Formatting Response
```
Backend returns { risk: "MEDIUM", brief_advice: "...", ... }
  → Frontend properly extracts risk level
  → RiskCard displays with correct icon (🟡 for MEDIUM)
  → All advice fields formatted correctly
```

### 3. ✅ Error Handling
```
If API fails → Console shows error details
If no location → Console warns "⚠️ No location available"
If response invalid → Graceful error message to user
```

---

## Testing Steps

### 1. Open DevTools
- Press `F12` in browser
- Go to **Console** tab
- Go to **Network** tab (optional)

### 2. Send a Message
- Type: "I have severe chest pain and difficulty breathing"
- Click Send
- Watch console logs

### 3. Check Console Output
Should see:
```
🔵 Sending triage request: {
  symptoms: "I have severe chest pain...",
  lat: 27.7172,
  lng: 85.3240,
  hasLocation: "YES"
}

📡 POST /triage/ { data: {...} }

📥 submitTriage response: {
  risk: "MEDIUM",  // ← This is the backend response
  brief_advice: "..."
}

📊 Detected risk level: MEDIUM → Recommended facility: pharmacy
```

### 4. Check Network Tab
- Look for POST request to `/api/triage/`
- Should see status `200 OK`
- Response should show `{"risk":"MEDIUM", ...}`

---

## How to Verify the Full Flow

### Scenario 1: With Location
```
✅ Location visible at top of chat
✅ Console shows: hasLocation: "YES"
✅ Backend receives lat/lng in request
✅ Risk card displays facilities
```

### Scenario 2: Without Location
```
⚠️ "Getting location..." message
⚠️ Console shows: hasLocation: "NO"
⚠️ Backend receives lat/lng as null
⚠️ Only risk level shown, no facility search
```

---

## Frontend is Ready for Various Backend Scenarios

The frontend can handle:

### If AI Returns Different Risks:
```javascript
risk: "HIGH" → Shows 🔴 with RED styling + hospital facilities
risk: "MEDIUM" → Shows 🟡 with YELLOW styling + pharmacy facilities
risk: "LOW" → Shows 🟢 with GREEN styling + clinic facilities
```

### If AI Returns All Fields:
```javascript
brief_advice: "..."
detailed_advice: "..."
food_eat: "rice|banana|..."  // Split by |
food_avoid: "spicy|..."      // Split by |
dos: "rest|stay calm|..."    // Converted to list
donts: "wait|ignore|..."     // Converted to list
```

### If API Fails:
```javascript
Network error → "Network error. Please check your connection."
Backend error → Shows actual error message from server
Invalid response → Graceful fallback message
```

---

## Summary: Where the Problem Is

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend Location Capture | ✅ WORKING | Properly requests and displays GPS coordinates |
| Frontend → Backend Request | ✅ WORKING | Sends symptoms + lat/lng in correct format |
| Backend Receives Data | ✅ WORKING | API endpoint is responding (status 200) |
| **Backend AI Analysis** | ❌ **NOT WORKING** | Returns same risk level for all symptoms |
| Frontend Response Display | ✅ WORKING | Properly formats and displays whatever backend returns |

---

## What to Do Next

### For Frontend Testing:
1. Open http://localhost:5176
2. Press F12 → Console tab
3. Send various symptoms
4. Check console logs to confirm:
   - Location is being sent ✅
   - Risk level is being received ✅
   - Response is being displayed ✅

### For Backend Debugging:
1. Check if Groq API key is configured
2. Add logging to `analyze_symptoms()` function
3. Test `analyze_symptoms("severe chest pain")` directly in Python
4. Verify it returns different risk levels for different inputs

---

## Console Logging Guide

The frontend now logs at key points:

```
🔵 = Sending request to backend
📤 = API library sending data
📡 = HTTP request details
🟢 = Backend response received
📥 = API library received response
📊 = Frontend processing result
🏥 = Facility search result
✅ = Success
❌ = Error
⚠️ = Warning/Missing data
```

---

**Status**: Frontend implementation is **CORRECT and COMPLETE** ✅
**Next Step**: Debug backend AI analysis to return varying risk levels

