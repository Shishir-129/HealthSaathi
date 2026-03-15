import chromadb
import json
import hashlib
import os
import unicodedata
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Initialize ChromaDB with persistent storage
chroma_db_path = Path(__file__).resolve().parent.parent.parent /"backend" / "chromadb_data"
chroma_db_path.mkdir(parents=True, exist_ok=True)

chroma_client = chromadb.PersistentClient(path=str(chroma_db_path))

# Collections
# 1. Global semantic cache for symptom queries (QA pairs)
cache_collection = chroma_client.get_or_create_collection(
    name="semantic_cache",
    metadata={"description": "Global cache for symptom queries and AI responses"}
)

# 2. User conversation history for context retrieval (RAG Memory)
history_collection = chroma_client.get_or_create_collection(
    name="chat_history",
    metadata={"description": "User conversation history for context awareness"}
)

# 3. Medical knowledge base for symptom variations
knowledge_collection = chroma_client.get_or_create_collection(
    name="symptom_knowledge",
    metadata={"description": "Medical knowledge base for symptom variations and conditions"}
)


class ChromaDBManager:
    """Manager class for ChromaDB operations"""

    @staticmethod
    def _normalize_query_text(text: str) -> str:
        """Normalize text for stable semantic caching."""
        normalized = unicodedata.normalize("NFKC", text or "")
        normalized = " ".join(normalized.strip().split())
        return normalized.lower()
    
    @staticmethod
    def check_cache(query: str, threshold: float = 0.15) -> dict | None:
        """
        Check if query exists in semantic cache.
        Returns cached response if found, None otherwise.
        """
        try:
            normalized_query = ChromaDBManager._normalize_query_text(query)
            results = cache_collection.query(
                query_texts=[normalized_query],
                where={"record_type": "query_cache"},
                n_results=1
            )
            
            if results['distances'] and results['distances'][0]:
                distance = results['distances'][0][0]
                
                # Lower distance = more similar (0 = identical, 1 = completely different)
                if distance < threshold:
                    metadata = results['metadatas'][0][0] if results['metadatas'][0] else {}
                    cached_response = metadata.get("response_json")

                    if not cached_response:
                        # Backward-compatibility for legacy entries where response lived in documents
                        cached_response = results['documents'][0][0]
                    
                    print(f"✅ Cache HIT (similarity: {1 - distance:.2%})")
                    return {
                        "cached": True,
                        "response": cached_response,
                        "metadata": metadata,
                        "similarity_score": 1 - distance
                    }
                print(f"🟡 Cache MISS (closest similarity: {1 - distance:.2%}, threshold: {1 - threshold:.2%})")
            else:
                print("🟡 Cache MISS (no vectors found yet)")
        except Exception as e:
            print(f"⚠️  Cache check error: {e}")
        
        return None

    @staticmethod
    def get_user_context(user_id: int, query: str, n_results: int = 3) -> str:
        """
        Retrieve user-specific conversation history for context.
        Returns relevant past conversations formatted as context string.
        """
        try:
            results = history_collection.query(
                query_texts=[query],
                where={"user_id": user_id} if user_id else None,
                n_results=n_results
            )
            
            if results['documents'] and results['documents'][0]:
                context_parts = results['documents'][0]
                context = "\n---\n".join(context_parts)
                print(f"📚 Retrieved {len(context_parts)} historical context(s)")
                return context
        except Exception as e:
            print(f"⚠️  History retrieval error: {e}")
        
        return ""

    @staticmethod
    def save_to_cache(query: str, response: dict, metadata: dict = None) -> bool:
        """
        Save query-response pair to global semantic cache.
        """
        try:
            normalized_query = ChromaDBManager._normalize_query_text(query)
            query_hash = hashlib.md5(normalized_query.encode()).hexdigest()
            response_str = json.dumps(response)
            
            meta = metadata or {}
            meta["original_query"] = query
            meta["normalized_query"] = normalized_query
            meta["response_json"] = response_str
            meta["record_type"] = "query_cache"
            meta["cached_at"] = str(__import__('datetime').datetime.now())
            
            cache_collection.upsert(
                ids=[f"cache_{query_hash}"],
                documents=[normalized_query],
                metadatas=[meta]
            )
            print(f"💾 Saved to cache: {query[:50]}...")
            return True
        except Exception as e:
            print(f"⚠️  Cache save error: {e}")
            return False

    @staticmethod
    def save_to_history(user_id: int, query: str, response: dict, risk_level: str = None) -> bool:
        """
        Save user query and AI response to conversation history.
        """
        try:
            history_entry = {
                "query": query,
                "response": json.dumps(response),
                "risk_level": risk_level or "UNKNOWN",
                "timestamp": str(__import__('datetime').datetime.now())
            }
            
            entry_hash = hashlib.md5(
                f"{user_id}_{query}_{__import__('time').time()}".encode()
            ).hexdigest()
            
            history_collection.add(
                ids=[f"hist_{entry_hash}"],
                documents=[f"Q: {query}\nA: {json.dumps(response)}"],
                metadatas=[{"user_id": user_id, "risk_level": risk_level or "UNKNOWN"}]
            )
            print(f"💬 Saved to user history (user_id: {user_id})")
            return True
        except Exception as e:
            print(f"⚠️  History save error: {e}")
            return False

    @staticmethod
    def add_knowledge(symptom: str, condition: str, details: dict) -> bool:
        """
        Add or update medical knowledge base for symptom variations.
        """
        try:
            symptom_hash = hashlib.md5(f"{symptom}_{condition}".lower().encode()).hexdigest()
            
            doc_text = f"Symptom: {symptom}\nCondition: {condition}\nDetails: {json.dumps(details)}"
            
            knowledge_collection.add(
                ids=[f"know_{symptom_hash}"],
                documents=[doc_text],
                metadatas={
                    "symptom": symptom,
                    "condition": condition,
                    "source": details.get("source", "medical_database")
                }
            )
            return True
        except Exception as e:
            print(f"⚠️  Knowledge base error: {e}")
            return False

    @staticmethod
    def get_stats() -> dict:
        """Get statistics about ChromaDB collections"""
        try:
            return {
                "cache_count": cache_collection.count(),
                "history_count": history_collection.count(),
                "knowledge_count": knowledge_collection.count()
            }
        except Exception as e:
            print(f"⚠️  Stats error: {e}")
            return {"error": str(e)}