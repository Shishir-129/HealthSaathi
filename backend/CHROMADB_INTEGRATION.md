# ChromaDB Integration Guide

## Overview
ChromaDB has been successfully integrated into the HealthSaathi backend for **semantic caching**, **user context retrieval (RAG)**, and **medical knowledge management**.

## Architecture

### Collections

#### 1. **Semantic Cache** (`semantic_cache`)
- **Purpose**: Global cache for symptom queries and AI responses
- **Use Case**: Reduces API calls by returning cached responses for similar queries
- **Similarity Threshold**: 0.15 (configurable)
- **Benefits**: 
  - Token savings on repeated queries
  - Faster response times
  - Reduced load on LLM APIs

#### 2. **Chat History** (`chat_history`)
- **Purpose**: User-specific conversation history for context awareness
- **Use Case**: Provides RAG (Retrieval-Augmented Generation) context
- **Features**:
  - Filtered by `user_id` to maintain privacy
  - Stores up to N previous interactions
  - Enables context-aware responses

#### 3. **Symptom Knowledge** (`symptom_knowledge`)
- **Purpose**: Medical knowledge base for symptom variations
- **Use Case**: Future enhancement for symptom normalization and medical insights
- **Extensible**: Can be populated with medical literature

## Integration Points

### 1. AI Client (`ai_client.py`)
```python
def analyze_symptoms(symptoms: str) -> dict:
    # STEP 1: Check ChromaDB cache
    cache_result = ChromaDBManager.check_cache(symptoms)
    if cache_result and cache_result["cached"]:
        return json.loads(cache_result["response"])
    
    # STEP 2-4: Try LLM APIs (Groq/Gemini)
    # ...
    
    # Save successful response to cache
    ChromaDBManager.save_to_cache(symptoms, result)
```

#### Flow Diagram:
```
User Query
    ↓
Check Semantic Cache (ChromaDB)
    ├─ Cache Hit → Return cached response ✓
    └─ Cache Miss ↓
       Call Groq API (with fallback to Gemini)
           ↓
       Save to Cache + PostgreSQL
           ↓
       Return response to user
```

### 2. Triage View (`views.py`)
Enhanced `TriageView` now:
1. Analyzes symptoms using `analyze_symptoms()` (which checks cache internally)
2. Saves to PostgreSQL for long-term storage
3. Saves to ChromaDB history for context-aware future queries

```python
class TriageView(APIView):
    def post(self, request):
        # Get result (cached if possible)
        result = analyze_symptoms(symptoms)
        
        # Save to PostgreSQL
        save_triage_session(...)
        
        # Save to ChromaDB for user context
        ChromaDBManager.save_to_history(
            user_id=request.user.id,
            query=symptoms,
            response=result,
            risk_level=result["risk"]
        )
```

## API Endpoints

### New ChromaDB Endpoints

#### 1. Get ChromaDB Statistics
- **Endpoint**: `GET /api/chromadb/stats/`
- **Authentication**: None required (for monitoring)
- **Response**:
```json
{
  "chromadb_stats": {
    "cache_count": 42,
    "history_count": 156,
    "knowledge_count": 0
  },
  "message": "ChromaDB collections active and storing data"
}
```

#### 2. Get User Context
- **Endpoint**: `GET /api/chromadb/context/?query=<symptom>&n_results=5`
- **Authentication**: Required (Token)
- **Parameters**:
  - `query` (required): The symptom query
  - `n_results` (optional): Number of historical contexts to retrieve (default: 5)
- **Response**:
```json
{
  "user_id": 1,
  "query": "fever and cough",
  "context": "Q: fever\nA: {...}\n---\nQ: cough\nA: {...}",
  "message": "User context retrieved successfully"
}
```

## Configuration

### Database Path
ChromaDB stores persistent data at:
```
/home/prashant/Coding/Projects/HealthSaathi/chromadb_data/
```

Directory structure:
```
chromadb_data/
├── chroma.sqlite3          # Main database file
├── index/                  # Vector indices
└── metadata/               # Collection metadata
```

### Cache Similarity Threshold
**Default Threshold**: 0.15 (distance metric)
- Lower values = stricter matching
- Can be adjusted in `chromadb.py`:
```python
def check_cache(query: str, threshold: float = 0.15) -> dict | None:
```

## Usage Examples

### Example 1: Cached Query Response
```
User Query: "I have high fever and severe cough"
  ↓
Cache Check: Similar query found (distance: 0.08)
  ↓
Response: ✅ Cache HIT (similarity: 92%) - Instant response
```

### Example 2: Cache Miss → New Response
```
User Query: "My child has rash on skin and fever"
  ↓
Cache Check: No similar query found
  ↓
Call Groq API: Generate response
  ↓
Save to Cache + PostgreSQL + ChromaDB History
  ↓
Response: New response (cached for future use)
```

## Performance Metrics

### Expected Benefits
| Metric | Expected Improvement |
|--------|----------------------|
| API Call Reduction | 30-40% (with similar queries) |
| Response Time | 50-100ms (cached) vs 1-3s (LLM) |
| Token Cost Savings | 30-40% reduction |
| User Context Awareness | +Enhanced |

## Testing

### Test ChromaDB Integration
```bash
# Check ChromaDB stats
curl -X GET http://localhost:8000/api/chromadb/stats/

# Get user context (requires token)
curl -X GET http://localhost:8000/api/chromadb/context/?query=fever \
  -H "Authorization: Token YOUR_TOKEN"
```

### Example Test Flow
1. Make a triage request with symptoms
2. Check ChromaDB stats - cache_count should increase
3. Make similar request again - should return cached response
4. Query user context endpoint - should show conversation history

## Best Practices

### 1. Cache Management
- Monitor cache growth: `GET /api/chromadb/stats/`
- Consider periodic cleanup for very old entries
- Adjust threshold based on domain (medical vs general)

### 2. User Privacy
- User history is **always filtered by user_id**
- Admins cannot see other users' data
- Conversation history tied to authenticated users only

### 3. Performance Optimization
- Typical response times:
  - Cache hit: ~50ms
  - Cache miss + LLM: ~2-5s
- Consider adding pagination for large history contexts

### 4. Monitoring
- Track cache hit rate: `(cache_hits / total_queries) * 100`
- Monitor cache_count growth in stats
- Alert if cache_count exceeds 10,000 (consider cleanup)

## Troubleshooting

### Issue: ChromaDB not found
**Solution**: Install ChromaDB
```bash
pip install chromadb==0.5.8
```

### Issue: Cache directory permission denied
**Solution**: Check directory permissions
```bash
ls -la chromadb_data/
chmod 755 chromadb_data/
```

### Issue: No cache hits
**Possible Causes**:
1. Threshold too strict (0.15) - increase to 0.2-0.25
2. Different phrasing of symptoms - expected behavior
3. Few queries in cache - normal for new deployment

**Solution**:
```python
# Adjust threshold temporarily
cache_result = ChromaDBManager.check_cache(symptoms, threshold=0.2)
```

## Database Cleanup

### Get Collection Counts
```bash
python manage.py shell
from triage.chromadb import ChromaDBManager
stats = ChromaDBManager.get_stats()
print(stats)
```

### Manual Collection Access
```bash
python manage.py shell
from triage.chromadb import cache_collection, history_collection

# Check cache
print(f"Cache entries: {cache_collection.count()}")

# Query all cache entries (caution: large data)
all_cache = cache_collection.get()
```

## Future Enhancements

1. **Vector Store Optimization**
   - Migrate from SQLite to production vector DB (Milvus, Weaviate)
   - Implement batch indexing

2. **Advanced RAG**
   - Multi-hop retrieval for complex cases
   - Context relevance scoring

3. **Medical Knowledge Integration**
   - Populate `symptom_knowledge` with verified medical data
   - Cross-reference with medical literature

4. **Analytics**
   - Track cache hit rates
   - Identify common symptom patterns
   - Visualize frequently cached queries

5. **Cache Expiration Policy**
   - Implement TTL (time-to-live) for cache entries
   - Automatic cleanup of old entries

## Technical Details

### Dependencies
- `chromadb==0.5.8` - Vector database
- Built on top of existing: Django, DRF, PostgreSQL

### Data Model
```python
class CacheEntry:
    id: str              # hash(query)
    documents: list      # [json_response]
    metadatas: dict      # {original_query, cached_at, ...}
    embeddings: vector   # Auto-generated by ChromaDB

class HistoryEntry:
    id: str              # hash(user_id + query + timestamp)
    documents: list      # [formatted_conversation]
    metadatas: dict      # {user_id, risk_level, ...}
    embeddings: vector   # Auto-generated
```

## Support & Documentation

- **ChromaDB Official**: https://docs.trychroma.com/
- **Project Repo**: HealthSaathi Backend
- **Issues**: Check `chromadb.py` for error logs

---

**Last Updated**: March 15, 2026
**Integration Status**: ✅ Active & Tested
