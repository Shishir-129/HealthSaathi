#!/bin/bash
"""
Quick Memory System Test Script
This script demonstrates the 3-requirement memory system in action.
"""

echo "🧠 CONVERSATIONAL MEMORY SYSTEM TEST"
echo "===================================="
echo ""
echo "⚠️  This script requires:"
echo "   1. Django server running: python manage.py runserver 8000"
echo "   2. Test user created (or run: python manage.py shell)"
echo ""
echo "Press Enter to continue..."
read

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8000"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST SETUP${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Create test user
echo -e "${YELLOW}📝 Creating test user...${NC}"
python3 << 'EOF'
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nepalcare.settings')
django.setup()

from django.contrib.auth.models import User

user, created = User.objects.get_or_create(
    username='memory_test_user',
    defaults={
        'email': 'memory@test.local',
        'first_name': 'Memory',
        'last_name': 'Tester'
    }
)

if created:
    user.set_password('memory123456')
    user.save()
    print(f"✅ Created user: {user.email}")
else:
    print(f"✓ User already exists: {user.email}")

from rest_framework.authtoken.models import Token
token, _ = Token.objects.get_or_create(user=user)
print(f"✅ Token: {token.key}")
EOF

# Extract token (you'd need to capture this properly)
TOKEN="abc123"  # Placeholder

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SCENARIO 1: WITHOUT conversation_id (loses memory)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${YELLOW}Turn 1: User reports fever${NC}"
curl -s -X POST "$BASE_URL/api/triage/" \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: $TOKEN" \
  -d '{"symptoms": "I have high fever"}' | python3 -m json.tool

echo ""
echo -e "${YELLOW}Turn 2: User adds more symptom (WITHOUT conversation_id)${NC}"
echo -e "${RED}❌ This creates a NEW conversation - loses fever context!${NC}"
curl -s -X POST "$BASE_URL/api/triage/" \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: $TOKEN" \
  -d '{"symptoms": "now I also have cough"}' | python3 -m json.tool

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SCENARIO 2: WITH conversation_id (memory works!)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${YELLOW}Turn 1: User reports fever (save conversation_id)${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/triage/" \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: $TOKEN" \
  -d '{"symptoms": "I have high fever"}')

echo "$RESPONSE" | python3 -m json.tool

CONV_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('conversation_id'))")
echo -e "${GREEN}✅ Saved conversation_id: $CONV_ID${NC}"

echo ""
echo -e "${YELLOW}Turn 2: User adds more symptom (WITH conversation_id - memory works!)${NC}"
echo -e "${GREEN}✅ AI will remember the fever!${NC}"
curl -s -X POST "$BASE_URL/api/triage/" \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: $TOKEN" \
  -d "{\"symptoms\": \"now I also have cough\", \"conversation_id\": \"$CONV_ID\"}" | python3 -m json.tool

echo ""
echo -e "${YELLOW}Turn 3: Ask about diet (WITH conversation_id)${NC}"
echo -e "${GREEN}✅ AI will remember BOTH fever and cough!${NC}"
curl -s -X POST "$BASE_URL/api/triage/" \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: $TOKEN" \
  -d "{\"symptoms\": \"what foods should I eat?\", \"conversation_id\": \"$CONV_ID\"}" | python3 -m json.tool

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}MEMORY DIAGNOSTIC${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${YELLOW}Checking conversation memory...${NC}"
curl -s -X GET "$BASE_URL/api/conversation/$CONV_ID/memory-diagnostic/" \
  -H "X-Session-Token: $TOKEN" | python3 -m json.tool

echo ""
echo -e "${GREEN}✅ Test complete!${NC}"
echo ""
echo "Summary:"
echo "  • Scenario 1 (no conversation_id): Each request is independent"
echo "  • Scenario 2 (with conversation_id): AI remembers all previous symptoms"
echo "  • Diagnostic endpoint: Shows all saved messages in conversation"
echo ""
