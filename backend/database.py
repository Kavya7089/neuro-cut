import os
import json
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Check if using mock/default placeholder keys
IS_MOCK_SUPABASE = (
    not SUPABASE_URL 
    or not SUPABASE_KEY 
    or "your-project-id" in SUPABASE_URL 
    or "your-anon-or-service-role-key" in SUPABASE_KEY
)

supabase_client = None

if not IS_MOCK_SUPABASE:
    try:
        from supabase import create_client, Client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[Supabase Database] Connected successfully to Supabase.")
    except Exception as e:
        print(f"[Supabase Database Warning] Failed to initialize Supabase client: {e}. Falling back to memory-based database.")
        IS_MOCK_SUPABASE = True
else:
    print("[Supabase Database Info] Using placeholder credentials. Supabase is running in Mock Fallback mode.")

# Memory stores for fallback
_in_memory_jobs: Dict[str, Dict[str, Any]] = {}
_in_memory_users: Dict[str, str] = {} # email -> password
_in_memory_sessions: Dict[str, Dict[str, str]] = {} # token -> {id, email}

class SupabaseDB:
    @staticmethod
    def signup(email: str, password: str) -> Dict[str, Any]:
        """
        Signs up a user.
        """
        if IS_MOCK_SUPABASE or supabase_client is None:
            if email in _in_memory_users:
                raise Exception("Email already registered.")
            _in_memory_users[email] = password
            print(f"[Mock Auth] Signed up user: {email}")
            import hashlib
            user_id = hashlib.md5(email.encode()).hexdigest()
            return {"user": {"id": user_id, "email": email}}
            
        try:
            res = supabase_client.auth.sign_up({
                "email": email,
                "password": password
            })
            if res and res.user:
                return {
                    "user": {
                        "id": res.user.id,
                        "email": res.user.email
                    }
                }
            raise Exception("Signup failed.")
        except Exception as e:
            print(f"[Supabase Auth Error] signup failed: {e}")
            raise e

    @staticmethod
    def signin(email: str, password: str) -> Dict[str, Any]:
        """
        Signs in a user and returns their session credentials.
        """
        if IS_MOCK_SUPABASE or supabase_client is None:
            if email not in _in_memory_users or _in_memory_users[email] != password:
                raise Exception("Invalid email or password.")
            print(f"[Mock Auth] Signed in user: {email}")
            import hashlib
            user_id = hashlib.md5(email.encode()).hexdigest()
            token = f"mock-token-{email}"
            _in_memory_sessions[token] = {"id": user_id, "email": email}
            return {
                "session": {
                    "access_token": token,
                    "user": {
                        "id": user_id,
                        "email": email
                    }
                }
            }
            
        try:
            res = supabase_client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            if res and res.session:
                return {
                    "session": {
                        "access_token": res.session.access_token,
                        "user": {
                            "id": res.user.id,
                            "email": res.user.email
                        }
                    }
                }
            raise Exception("Signin failed.")
        except Exception as e:
            print(f"[Supabase Auth Error] signin failed: {e}")
            raise e

    @staticmethod
    def get_user_id_from_token(token: str) -> Optional[str]:
        """
        Verifies a bearer JWT token and extracts the user ID.
        """
        if not token:
            return None
        if token.startswith("Bearer "):
            token = token.replace("Bearer ", "")
            
        if IS_MOCK_SUPABASE or supabase_client is None:
            session = _in_memory_sessions.get(token)
            if session:
                return session["id"]
            if token.startswith("mock-token-"):
                import hashlib
                email = token.replace("mock-token-", "")
                user_id = hashlib.md5(email.encode()).hexdigest()
                _in_memory_sessions[token] = {"id": user_id, "email": email}
                return user_id
            return None
            
        try:
            res = supabase_client.auth.get_user(token)
            if res and res.user:
                return res.user.id
        except Exception as e:
            print(f"[Supabase Auth Error] Token verification failed: {e}")
        return None

    @staticmethod
    def create_job(job_id: str, script: str, art_style: str = "pixar", user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Creates a new video production job in the database associated with a user.
        """
        record = {
            "id": job_id,
            "script": script,
            "art_style": art_style,
            "status": "initializing",
            "current_node": "ingestion",
            "structured_storyboard": [],
            "assets": [],
            "safety_report": {},
            "bgm_volume": 30,
            "video_url": "",
            "user_id": user_id
        }
        
        if IS_MOCK_SUPABASE or supabase_client is None:
            _in_memory_jobs[job_id] = record
            print(f"[Mock DB] Created job record locally for ID: {job_id} (User: {user_id})")
            return record
            
        try:
            res = supabase_client.table("jobs").insert(record).execute()
            if hasattr(res, 'data') and res.data:
                print(f"[Supabase DB] Job record created in Supabase: {job_id}")
                return res.data[0]
            return record
        except Exception as e:
            print(f"[Supabase DB Error] create_job failed: {e}. Storing in memory.")
            _in_memory_jobs[job_id] = record
            return record

    @staticmethod
    def update_job(job_id: str, updates: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Updates an existing job record in the database.
        """
        # Clean updates keys to only match table column schema
        valid_columns = {
            "script", "art_style", "status", "current_node", 
            "structured_storyboard", "assets", "safety_report", 
            "bgm_volume", "video_url", "celery_task_id", "user_id"
        }
        filtered_updates = {k: v for k, v in updates.items() if k in valid_columns}
        
        if IS_MOCK_SUPABASE or supabase_client is None:
            if job_id not in _in_memory_jobs:
                _in_memory_jobs[job_id] = {"id": job_id}
            _in_memory_jobs[job_id].update(filtered_updates)
            print(f"[Mock DB] Updated job ID {job_id}: {list(filtered_updates.keys())}")
            return _in_memory_jobs[job_id]
            
        try:
            # If user_id is provided, we double-check or enforce RLS criteria
            query = supabase_client.table("jobs").update(filtered_updates).eq("id", job_id)
            if user_id:
                query = query.eq("user_id", user_id)
            res = query.execute()
            if hasattr(res, 'data') and res.data:
                print(f"[Supabase DB] Updated job ID {job_id} successfully.")
                return res.data[0]
            return _in_memory_jobs.get(job_id, {})
        except Exception as e:
            print(f"[Supabase DB Error] update_job failed: {e}. Storing locally.")
            if job_id not in _in_memory_jobs:
                _in_memory_jobs[job_id] = {"id": job_id}
            _in_memory_jobs[job_id].update(filtered_updates)
            return _in_memory_jobs[job_id]

    @staticmethod
    def get_job(job_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Retrieves a job record from the database.
        """
        if IS_MOCK_SUPABASE or supabase_client is None:
            record = _in_memory_jobs.get(job_id)
            if record:
                print(f"[Mock DB] Retrieved job {job_id} locally.")
            return record
            
        try:
            query = supabase_client.table("jobs").select("*").eq("id", job_id)
            if user_id:
                query = query.eq("user_id", user_id)
            res = query.execute()
            if hasattr(res, 'data') and res.data:
                print(f"[Supabase DB] Retrieved job {job_id} successfully.")
                return res.data[0]
            return _in_memory_jobs.get(job_id)
        except Exception as e:
            print(f"[Supabase DB Error] get_job failed: {e}. Searching local memory.")
            return _in_memory_jobs.get(job_id)

    @staticmethod
    def get_user_jobs(user_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves all jobs created by a specific user.
        """
        if IS_MOCK_SUPABASE or supabase_client is None:
            user_jobs = [job for job in _in_memory_jobs.values() if job.get("user_id") == user_id]
            print(f"[Mock DB] Retrieved {len(user_jobs)} jobs for user: {user_id}")
            return user_jobs
            
        try:
            res = supabase_client.table("jobs").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            if hasattr(res, 'data') and res.data:
                print(f"[Supabase DB] Retrieved {len(res.data)} jobs for user: {user_id}")
                return res.data
            return []
        except Exception as e:
            print(f"[Supabase DB Error] get_user_jobs failed: {e}. Searching memory.")
            return [job for job in _in_memory_jobs.values() if job.get("user_id") == user_id]
