import json
import os
import base64
import time
import threading
import requests
from urllib.parse import quote_plus
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from collections import deque

load_dotenv()

# ==================== CONFIGURATION ====================
# Use OpenAI API keys - fallback to environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_IMAGE_ENDPOINT = os.getenv("AZURE_IMAGE_ENDPOINT", "")
AZURE_VISION_ENDPOINT = os.getenv("AZURE_VISION_ENDPOINT", "")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# OpenAI image generation endpoint
IMAGE_ENDPOINT = "https://api.openai.com/v1/images/generations"

# OpenAI vision endpoint for image analysis  
VISION_ENDPOINT = "https://api.openai.com/v1/chat/completions"

# Hugging Face Inference API for image generation (free alternative)
HUGGINGFACE_IMAGE_ENDPOINT = "https://router.huggingface.co/models/stabilityai/stable-diffusion-3"

# Pollinations free text-to-image fallback
POLLINATIONS_IMAGE_ENDPOINT = "https://image.pollinations.ai/prompt"

# Unsplash fallback (keyword-matched stock image)
UNSPLASH_IMAGE_ENDPOINT = "https://source.unsplash.com"

# Image rate limiting: 3 requests per minute (20 seconds between requests)
IMAGE_RPM_LIMIT = 3
IMAGE_RATE_LIMIT_WINDOW_SECONDS = 60
IMAGE_REQUEST_MIN_INTERVAL = 20  # Seconds between requests

# Vision rate limiting: 10 requests per minute (~6 seconds between requests)
VISION_RPM_LIMIT = 10
VISION_RATE_LIMIT_WINDOW_SECONDS = 60
VISION_REQUEST_MIN_INTERVAL = 6


# ==================== RATE LIMITER ====================
class ImageRateLimiter:
    """Strict rate limiter for image generation (3 RPM = 20 second minimum intervals)"""
    
    def __init__(self, limit: int, window_seconds: int, min_interval: int):
        self.limit = limit
        self.window_seconds = window_seconds
        self.min_interval = min_interval
        self.timestamps = deque()
        self.last_request_time = 0
        self.lock = threading.Lock()

    def wait_if_needed(self) -> float:
        """
        Wait if necessary to maintain rate limit.
        Returns the time waited (0 if no wait needed).
        """
        now = time.time()
        wait_time = 0
        
        with self.lock:
            # Check minimum interval since last request
            if now - self.last_request_time < self.min_interval:
                wait_time = self.min_interval - (now - self.last_request_time)
            
            # Clean old timestamps outside window
            while self.timestamps and now - self.timestamps[0] >= self.window_seconds:
                self.timestamps.popleft()
            
            # Check if we've exceeded limit in current window
            if len(self.timestamps) >= self.limit:
                oldest = self.timestamps[0]
                wait_time = max(wait_time, self.window_seconds - (now - oldest))
        
        if wait_time > 0:
            print(f"⏱️ Rate limit: waiting {wait_time:.2f}s for image request")
            time.sleep(wait_time)
            now = time.time()
        
        with self.lock:
            self.timestamps.append(now)
            self.last_request_time = now
        
        return wait_time

    def get_wait_time(self) -> float:
        """Get estimated wait time without blocking."""
        now = time.time()
        with self.lock:
            while self.timestamps and now - self.timestamps[0] >= self.window_seconds:
                self.timestamps.popleft()
            
            if len(self.timestamps) >= self.limit:
                oldest = self.timestamps[0]
                return self.window_seconds - (now - oldest)
            
            if now - self.last_request_time < self.min_interval:
                return self.min_interval - (now - self.last_request_time)
        
        return 0


image_rate_limiter = ImageRateLimiter(
    limit=IMAGE_RPM_LIMIT,
    window_seconds=IMAGE_RATE_LIMIT_WINDOW_SECONDS,
    min_interval=IMAGE_REQUEST_MIN_INTERVAL
)

vision_rate_limiter = ImageRateLimiter(
    limit=VISION_RPM_LIMIT,
    window_seconds=VISION_RATE_LIMIT_WINDOW_SECONDS,
    min_interval=VISION_REQUEST_MIN_INTERVAL,
)


# ==================== IMAGE STORAGE ====================
class ImageStorage:
    """Manage image storage locally and keep logs for final presentation"""
    
    def __init__(self):
        self.base_dir = Path(os.getenv("IMAGE_STORAGE_DIR", "/tmp/healthsathi_images"))
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.log_file = self.base_dir / "image_operations_log.jsonl"

    def save_generated_image(self, image_data: str, prompt: str, metadata: dict = None) -> str:
        """
        Save generated image and log the operation.
        
        Args:
            image_data: Base64 encoded image data
            prompt: Original prompt used to generate the image
            metadata: Additional metadata
            
        Returns:
            Path to saved image file
        """
        timestamp = datetime.now().isoformat()
        filename = f"generated_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        filepath = self.base_dir / "generated" / filename
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            # Decode and save image
            image_bytes = base64.b64decode(image_data)
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
            
            # Log operation
            log_entry = {
                "timestamp": timestamp,
                "operation": "generate_image",
                "prompt": prompt,
                "filepath": str(filepath),
                "size_bytes": len(image_bytes),
                "metadata": metadata or {}
            }
            self._write_log(log_entry)
            
            print(f"💾 Image saved: {filepath}")
            return str(filepath)
        
        except Exception as e:
            print(f"❌ Failed to save generated image: {e}")
            return None

    def save_vision_analysis(self, image_path: str, analysis: str, question: str = None) -> None:
        """
        Log vision analysis results.
        
        Args:
            image_path: Path or URL of analyzed image
            analysis: Analysis result from vision model
            question: Question asked about the image
        """
        timestamp = datetime.now().isoformat()
        
        log_entry = {
            "timestamp": timestamp,
            "operation": "vision_analysis",
            "image_source": image_path,
            "question": question or "general_analysis",
            "analysis": analysis,
            "metadata": {}
        }
        self._write_log(log_entry)
        print(f"📝 Vision analysis logged")

    def _write_log(self, entry: dict) -> None:
        """Write log entry to JSONL file."""
        try:
            with open(self.log_file, 'a') as f:
                f.write(json.dumps(entry) + '\n')
        except Exception as e:
            print(f"⚠️ Failed to write log: {e}")

    def get_logs(self) -> list:
        """Retrieve all logged image operations."""
        if not self.log_file.exists():
            return []
        
        logs = []
        try:
            with open(self.log_file, 'r') as f:
                for line in f:
                    if line.strip():
                        logs.append(json.loads(line))
        except Exception as e:
            print(f"⚠️ Failed to read logs: {e}")
        
        return logs


image_storage = ImageStorage()


# ==================== IMAGE GENERATION ====================
def generate_image_openai(prompt: str, size: str, quality: str, n: int) -> dict:
    """Generate image using OpenAI DALL-E 3"""
    if not OPENAI_API_KEY or not OPENAI_API_KEY.startswith("sk-"):
        return None
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": "dall-e-3",
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "n": min(n, 1)  # DALL-E 3 supports 1 image per request
    }
    
    try:
        response = requests.post(
            IMAGE_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=60,
        )
        
        if response.status_code == 429:
            return {"error": "Rate limited. Please wait before requesting another image."}
        
        if response.status_code != 200:
            error_detail = response.text[:300]
            print(f"⚠️ OpenAI API: {response.status_code} {error_detail}")
            return None
        
        data = response.json()
        return {
            "success": True,
            "source": "openai_dall_e_3",
            "images": data.get("data", []),
        }
    except Exception as e:
        print(f"⚠️ OpenAI API error: {e}")
        return None


def generate_image_azure(prompt: str, size: str, quality: str, n: int) -> dict:
    """Generate image using Azure OpenAI image endpoint"""
    if not AZURE_OPENAI_API_KEY or not AZURE_IMAGE_ENDPOINT:
        return None

    headers = {
        "api-key": AZURE_OPENAI_API_KEY,
        "Content-Type": "application/json",
    }

    azure_quality = {
        "standard": "medium",
        "hd": "high",
    }.get(quality, quality)

    payload_variants = [
        {
            "prompt": prompt,
            "size": size,
            "quality": azure_quality,
            "n": min(n, 1),
        },
        {
            "model": "gpt-image-1",
            "prompt": prompt,
            "size": size,
            "quality": azure_quality,
            "n": min(n, 1),
        },
    ]

    def _with_path(path_suffix: str) -> str:
        parsed = urlparse(AZURE_IMAGE_ENDPOINT)
        base_path = parsed.path
        if "/generations" in base_path:
            base_path = base_path.split("/generations")[0]
        if "/images/generations" in base_path:
            base_path = base_path.split("/images/generations")[0]
        query = dict(parse_qsl(parsed.query))
        if "api-version" not in query:
            query["api-version"] = "2024-10-21"
        return urlunparse((parsed.scheme, parsed.netloc, f"{base_path}{path_suffix}", "", urlencode(query), ""))

    endpoint_candidates = [
        _with_path("/images/generations"),
        _with_path("/generations"),
    ]

    seen = set()
    endpoint_candidates = [u for u in endpoint_candidates if not (u in seen or seen.add(u))]

    last_error = None
    for endpoint in endpoint_candidates:
        for payload in payload_variants:
            try:
                response = requests.post(
                    endpoint,
                    headers=headers,
                    json=payload,
                    timeout=60,
                )

                if response.status_code == 429:
                    return {"error": "Rate limited. Please wait before requesting another image."}

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "source": "azure_gpt_image",
                        "images": data.get("data", []),
                    }

                last_error = f"{response.status_code} {response.text[:240]}"
                print(f"⚠️ Azure Image API attempt failed: endpoint={endpoint} status={response.status_code}")
            except Exception as e:
                last_error = str(e)
                print(f"⚠️ Azure Image API error on endpoint={endpoint}: {e}")

    if last_error:
        print(f"⚠️ Azure Image API final failure: {last_error}")
    return None


def generate_image_huggingface(prompt: str, size: str, quality: str, n: int) -> dict:
    """Generate image using Hugging Face Stable Diffusion (free)"""
    headers = {"Content-Type": "application/json"}
    
    if HUGGINGFACE_API_KEY:
        headers["Authorization"] = f"Bearer {HUGGINGFACE_API_KEY}"
    
    payload = {"inputs": prompt}
    
    try:
        response = requests.post(
            HUGGINGFACE_IMAGE_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=60,
        )
        
        if response.status_code == 429:
            return {"error": "Rate limited. Please wait before requesting another image."}
        
        if response.status_code != 200:
            error_detail = response.text[:300]
            print(f"⚠️ Hugging Face API: {response.status_code} {error_detail}")
            return None
        
        # Hugging Face returns raw image bytes
        image_bytes = response.content
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        
        return {
            "success": True,
            "source": "huggingface_stable_diffusion",
            "images": [{
                "url": None,
                "b64_json": image_b64  # Convert to base64 for consistency
            }]
        }
    except Exception as e:
        print(f"⚠️ Hugging Face API error: {e}")
        return None


def generate_image_pollinations(prompt: str, size: str, quality: str, n: int) -> dict:
    """Generate image using Pollinations free text-to-image endpoint"""
    try:
        width, height = map(int, size.split("x"))
    except Exception:
        width, height = 1024, 1024

    encoded_prompt = quote_plus(prompt)
    url = (
        f"{POLLINATIONS_IMAGE_ENDPOINT}/{encoded_prompt}"
        f"?width={width}&height={height}&nologo=true&enhance=true"
    )

    try:
        response = requests.get(url, timeout=90)

        if response.status_code != 200:
            print(f"⚠️ Pollinations API: {response.status_code} {response.text[:200]}")
            return None

        image_bytes = response.content
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        return {
            "success": True,
            "source": "pollinations_ai",
            "images": [{
                "url": None,
                "b64_json": image_b64,
            }],
        }
    except Exception as e:
        print(f"⚠️ Pollinations API error: {e}")
        return None


def generate_image_unsplash(prompt: str, size: str, quality: str, n: int) -> dict:
    """Fallback to Unsplash keyword-based image when model APIs are unavailable"""
    try:
        width, height = map(int, size.split("x"))
    except Exception:
        width, height = 1024, 1024

    keywords = quote_plus(prompt.replace(" ", ","))
    url = f"{UNSPLASH_IMAGE_ENDPOINT}/featured/{width}x{height}/?{keywords}"

    try:
        response = requests.get(url, timeout=60)
        if response.status_code != 200:
            print(f"⚠️ Unsplash API: {response.status_code}")
            return None

        content_type = (response.headers.get("content-type") or "").lower()
        if "image" not in content_type:
            print(f"⚠️ Unsplash non-image response: {content_type}")
            return None

        image_b64 = base64.b64encode(response.content).decode("utf-8")
        return {
            "success": True,
            "source": "unsplash_fallback",
            "images": [{
                "url": None,
                "b64_json": image_b64,
            }],
        }
    except Exception as e:
        print(f"⚠️ Unsplash API error: {e}")
        return None


def generate_image_placeholder(prompt: str, size: str, quality: str, n: int) -> dict:
    """Generate a placeholder medical image using PIL when APIs are unavailable"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Parse size
        width, height = map(int, size.split('x'))
        
        image = Image.new('RGB', (width, height), color=(247, 252, 255))
        draw = ImageDraw.Draw(image)

        # Background panels
        draw.rectangle([(0, 0), (width, int(height * 0.22))], fill=(210, 235, 250))
        draw.rectangle([(0, int(height * 0.22)), (width, height)], fill=(238, 247, 255))

        # Patient bed
        bed_y = int(height * 0.68)
        draw.rounded_rectangle(
            [(int(width * 0.12), bed_y), (int(width * 0.88), int(height * 0.82))],
            radius=18,
            fill=(205, 223, 238),
            outline=(140, 170, 195),
            width=3,
        )

        # Patient (simple figure)
        draw.ellipse([(int(width * 0.24), int(height * 0.58)), (int(width * 0.31), int(height * 0.65))], fill=(244, 207, 178))
        draw.rounded_rectangle(
            [(int(width * 0.30), int(height * 0.62)), (int(width * 0.58), int(height * 0.73))],
            radius=12,
            fill=(160, 196, 255),
        )

        # Doctor (simple figure standing)
        draw.ellipse([(int(width * 0.66), int(height * 0.40)), (int(width * 0.74), int(height * 0.50))], fill=(244, 207, 178))
        draw.rounded_rectangle(
            [(int(width * 0.62), int(height * 0.50)), (int(width * 0.79), int(height * 0.74))],
            radius=12,
            fill=(255, 255, 255),
            outline=(180, 180, 180),
            width=2,
        )
        # Stethoscope
        draw.arc([(int(width * 0.66), int(height * 0.52)), (int(width * 0.76), int(height * 0.67))], 0, 180, fill=(60, 80, 100), width=3)
        draw.ellipse([(int(width * 0.70), int(height * 0.66)), (int(width * 0.72), int(height * 0.68))], fill=(60, 80, 100))

        # Prompt/title text
        text = f"Scene: {prompt[:55]}"
        try:
            draw.text((int(width * 0.06), int(height * 0.07)), text, fill=(70, 90, 110))
            draw.text((int(width * 0.06), int(height * 0.12)), "Fallback illustration (API image service unavailable)", fill=(95, 115, 130))
        except Exception:
            pass
        
        # Convert to base64
        import io
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        image_bytes = buffer.getvalue()
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        
        return {
            "success": True,
            "source": "local_placeholder",
            "images": [{
                "b64_json": image_b64,
                "url": None
            }]
        }
    except Exception as e:
        print(f"⚠️ Placeholder generation failed: {e}")
        return None


def generate_image(prompt: str, size: str = "1024x1024", quality: str = "standard", n: int = 1) -> dict:
    """
    Generate image from text prompt. Tries multiple services in order of preference:
    1. Azure OpenAI image endpoint (requires AZURE_OPENAI_API_KEY + AZURE_IMAGE_ENDPOINT)
    2. OpenAI DALL-E 3 (requires OPENAI_API_KEY)
    3. Hugging Face Stable Diffusion (requires auth)
    4. Pollinations AI (free fallback)
    5. Unsplash keyword image (stock fallback)
    6. Local PIL placeholder (always works)
    
    Args:
        prompt: Text description of the image to generate
        size: Image size (1024x1024, 1024x1792, 1792x1024)
        quality: Image quality (standard or hd)
        n: Number of images to generate (1-10)
        
    Returns:
        Dictionary with generated image URLs/data
    """
    # Apply rate limiting
    wait_time = image_rate_limiter.wait_if_needed()
    
    try:
        print(f"🎨 Generating image from prompt: {prompt[:100]}...")

        # Try Azure first
        result = generate_image_azure(prompt, size, quality, n)
        if result:
            result["wait_time"] = wait_time
            result["prompt"] = prompt
            result["_timestamp"] = datetime.now().isoformat()

            # Save generated images
            for idx, image_info in enumerate(result.get("images", [])):
                try:
                    if image_info.get("b64_json"):
                        filepath = image_storage.save_generated_image(
                            image_info["b64_json"],
                            prompt,
                            {"index": idx, "size": size, "quality": quality, "source": "azure"}
                        )
                        if filepath:
                            image_info["local_path"] = filepath
                    elif image_info.get("url"):
                        img_response = requests.get(image_info["url"], timeout=30)
                        if img_response.status_code == 200:
                            image_bytes = img_response.content
                            image_b64 = base64.b64encode(image_bytes).decode("utf-8")
                            filepath = image_storage.save_generated_image(
                                image_b64,
                                prompt,
                                {"index": idx, "size": size, "quality": quality, "source": "azure"}
                            )
                            if filepath:
                                image_info["local_path"] = filepath
                except Exception as e:
                    print(f"⚠️ Could not save Azure image locally: {e}")

            print("✅ Image generated successfully via Azure")
            return result
        
        # Try OpenAI first
        result = generate_image_openai(prompt, size, quality, n)
        if result:
            result["wait_time"] = wait_time
            result["prompt"] = prompt
            result["_timestamp"] = datetime.now().isoformat()
            
            # Save generated images
            for idx, image_info in enumerate(result.get("images", [])):
                if "url" in image_info and image_info["url"]:
                    try:
                        img_response = requests.get(image_info["url"], timeout=30)
                        if img_response.status_code == 200:
                            image_bytes = img_response.content
                            image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                            filepath = image_storage.save_generated_image(
                                image_b64,
                                prompt,
                                {"index": idx, "size": size, "quality": quality, "source": "openai"}
                            )
                            if filepath:
                                image_info["local_path"] = filepath
                    except Exception as e:
                        print(f"⚠️ Could not save OpenAI image locally: {e}")
            
            print(f"✅ Image generated successfully via OpenAI")
            return result
        
        # Fallback to Hugging Face if OpenAI fails
        print("🔄 Falling back to Hugging Face Stable Diffusion...")
        result = generate_image_huggingface(prompt, size, quality, n)
        if result:
            result["wait_time"] = wait_time
            result["prompt"] = prompt
            result["_timestamp"] = datetime.now().isoformat()
            
            # Save generated images
            for idx, image_info in enumerate(result.get("images", [])):
                if "b64_json" in image_info:
                    filepath = image_storage.save_generated_image(
                        image_info["b64_json"],
                        prompt,
                        {"index": idx, "size": size, "quality": quality, "source": "huggingface"}
                    )
                    if filepath:
                        image_info["local_path"] = filepath
            
            print(f"✅ Image generated successfully via Hugging Face")
            return result

        # Fallback to Pollinations if Hugging Face fails
        print("🔄 Falling back to Pollinations AI...")
        result = generate_image_pollinations(prompt, size, quality, n)
        if result:
            result["wait_time"] = wait_time
            result["prompt"] = prompt
            result["_timestamp"] = datetime.now().isoformat()

            for idx, image_info in enumerate(result.get("images", [])):
                if "b64_json" in image_info:
                    filepath = image_storage.save_generated_image(
                        image_info["b64_json"],
                        prompt,
                        {"index": idx, "size": size, "quality": quality, "source": "pollinations"}
                    )
                    if filepath:
                        image_info["local_path"] = filepath

            print("✅ Image generated successfully via Pollinations")
            return result

        # Fallback to Unsplash if Pollinations fails
        print("🔄 Falling back to Unsplash keyword image...")
        result = generate_image_unsplash(prompt, size, quality, n)
        if result:
            result["wait_time"] = wait_time
            result["prompt"] = prompt
            result["_timestamp"] = datetime.now().isoformat()

            for idx, image_info in enumerate(result.get("images", [])):
                if "b64_json" in image_info:
                    filepath = image_storage.save_generated_image(
                        image_info["b64_json"],
                        prompt,
                        {"index": idx, "size": size, "quality": quality, "source": "unsplash"}
                    )
                    if filepath:
                        image_info["local_path"] = filepath

            print("✅ Image generated successfully via Unsplash fallback")
            return result
        
        # Final fallback: generate local placeholder image
        print("🔄 Generating local placeholder image...")
        result = generate_image_placeholder(prompt, size, quality, n)
        if result:
            result["wait_time"] = wait_time
            result["prompt"] = prompt
            result["_timestamp"] = datetime.now().isoformat()
            
            # Save generated placeholder
            for idx, image_info in enumerate(result.get("images", [])):
                if "b64_json" in image_info:
                    filepath = image_storage.save_generated_image(
                        image_info["b64_json"],
                        prompt,
                        {"index": idx, "size": size, "quality": quality, "source": "placeholder"}
                    )
                    if filepath:
                        image_info["local_path"] = filepath
            
            print(f"✅ Placeholder image generated (configure API key for AI-generated images)")
            return result
        
        # If all fail, provide helpful error message
        return {"error": "Image generation unavailable. Please ensure Pillow package is installed."}
    
    except requests.RequestException as e:
        print(f"❌ Image generation request error: {e}")
        return {"error": f"Request failed: {str(e)}"}
    except Exception as e:
        print(f"❌ Image generation error: {e}")
        return {"error": f"Unexpected error: {str(e)}"}


# ==================== VISION PROCESSING ====================
def analyze_image(image_source: str, question: str) -> dict:
    """
    Analyze an image using OpenAI's vision capabilities (GPT-4 Vision).
    
    Args:
        image_source: URL or base64-encoded image
        question: Question or prompt about the image
        
    Returns:
        Dictionary with analysis result
    """
    has_azure_vision = bool(AZURE_OPENAI_API_KEY and AZURE_VISION_ENDPOINT)
    has_openai_vision = bool(OPENAI_API_KEY and OPENAI_API_KEY.startswith("sk-"))

    if not has_azure_vision and not has_openai_vision:
        return {"error": "No valid vision provider configured (set AZURE_VISION_ENDPOINT+AZURE_OPENAI_API_KEY or OPENAI_API_KEY)."}

    # Apply dedicated vision rate limiting (10 RPM)
    vision_wait_time = vision_rate_limiter.wait_if_needed()
    
    # Prepare content based on image source (http/data-url/base64/local path)
    normalized_image_url = image_source
    if not (image_source.startswith("http") or image_source.startswith("data:image/")):
        if os.path.exists(image_source):
            try:
                suffix = Path(image_source).suffix.lower()
                mime_type = {
                    ".png": "image/png",
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".webp": "image/webp",
                    ".gif": "image/gif",
                }.get(suffix, "image/jpeg")

                with open(image_source, "rb") as file_obj:
                    file_b64 = base64.b64encode(file_obj.read()).decode("utf-8")
                normalized_image_url = f"data:{mime_type};base64,{file_b64}"
            except Exception as file_error:
                return {"error": f"Failed to read local image path: {str(file_error)}"}
        else:
            signature = image_source[:20]
            mime_type = "image/jpeg"
            if signature.startswith("iVBORw0KGgo"):
                mime_type = "image/png"
            elif signature.startswith("UklGR"):
                mime_type = "image/webp"
            elif signature.startswith("R0lGOD"):
                mime_type = "image/gif"
            normalized_image_url = f"data:{mime_type};base64,{image_source}"

    image_content = {
        "type": "image_url",
        "image_url": {
            "url": normalized_image_url
        }
    }
    
    payload = {
        "messages": [
            {
                "role": "system",
                "content": "You are a medical image assistant. Respond in clear plain text (not markdown). Use this exact structure: 1) Summary, 2) Visible Findings (bullet-style with '-' prefix), 3) Possible Concerns (non-diagnostic), 4) Recommended Next Steps. Keep it concise and readable."
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": question},
                    image_content
                ]
            }
        ],
    }

    endpoint = VISION_ENDPOINT
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    if has_azure_vision:
        endpoint = AZURE_VISION_ENDPOINT
        headers = {
            "api-key": AZURE_OPENAI_API_KEY,
            "Content-Type": "application/json",
        }
        payload["max_completion_tokens"] = 800
    else:
        payload["model"] = "gpt-4o-mini"
        payload["max_tokens"] = 1200
    
    def _local_image_inspection(source: str) -> dict:
        try:
            import io
            from PIL import Image

            raw_b64 = source
            if source.startswith("data:image/") and "," in source:
                raw_b64 = source.split(",", 1)[1]

            image_bytes = base64.b64decode(raw_b64)
            img = Image.open(io.BytesIO(image_bytes))
            width, height = img.size
            mode = img.mode
            image_format = img.format or "unknown"
            analysis_text = (
                "Summary:\n"
                "Automated local inspection completed (fallback mode).\n\n"
                "Visible Findings:\n"
                f"- Format: {image_format}\n"
                f"- Resolution: {width}x{height}\n"
                f"- Color mode: {mode}\n\n"
                "Possible Concerns:\n"
                "- Cloud vision interpretation is currently unavailable for this deployment.\n"
                "- Detailed clinical interpretation could not be generated in fallback mode.\n\n"
                "Recommended Next Steps:\n"
                "- Configure a chat-capable Azure vision deployment for richer analysis.\n"
                "- Use this result as technical image metadata only, not medical diagnosis."
            )

            return {
                "success": True,
                "source": "local_image_inspection_fallback",
                "question": question,
                "analysis": analysis_text,
                "_timestamp": datetime.now().isoformat(),
            }
        except Exception as local_error:
            return {
                "error": f"Vision analysis unavailable and local fallback failed: {str(local_error)}"
            }

    try:
        print(f"🔍 Analyzing image with question: {question[:100]}...")
        
        response = requests.post(
            endpoint,
            headers=headers,
            json=payload,
            timeout=60,
        )

        if response.status_code == 429:
            return {
                "error": "Vision rate limit reached. Please wait before sending another image (max 10 requests/minute)."
            }
        
        if response.status_code != 200:
            error_detail = response.text[:300]
            print(f"❌ Vision analysis failed: {response.status_code} {error_detail}")

            # Azure/OpenAI content filters for sensitive medical interpretation
            if "content_filter" in error_detail.lower() or "responsible" in error_detail.lower():
                return {
                    "error": "Vision response blocked by safety/content filters. Try a more neutral, non-diagnostic question."
                }

            if "OperationNotSupported" in error_detail or response.status_code in (400, 404):
                print("🔄 Falling back to local image inspection...")
                return _local_image_inspection(normalized_image_url)
            return {"error": f"Vision analysis failed: {response.status_code} - {error_detail}"}
        
        data = response.json()
        analysis_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        result = {
            "success": True,
            "source": "azure_vision" if has_azure_vision else "openai_gpt_4o_mini",
            "question": question,
            "analysis": analysis_text,
            "wait_time": vision_wait_time,
            "_timestamp": datetime.now().isoformat()
        }
        
        # Log the vision analysis
        image_storage.save_vision_analysis(image_source[:100], analysis_text, question)
        
        print(f"✅ Vision analysis completed")
        return result
    
    except requests.RequestException as e:
        print(f"❌ Vision analysis request error: {e}")
        print("🔄 Falling back to local image inspection due to request error...")
        return _local_image_inspection(normalized_image_url)
    except Exception as e:
        print(f"❌ Vision analysis error: {e}")
        print("🔄 Falling back to local image inspection due to unexpected error...")
        return _local_image_inspection(normalized_image_url)


# ==================== PDF PROCESSING ====================
def extract_images_from_pdf(pdf_path: str) -> dict:
    """
    Extract images from PDF file.
    
    Args:
        pdf_path: Path to PDF file
        
    Returns:
        Dictionary with extracted images and metadata
    """
    try:
        import PyPDF2
    except ImportError:
        return {
            "error": "PDF processing requires PyPDF2 library",
            "install_command": "pip install PyPDF2"
        }
    
    try:
        print(f"📄 Processing PDF: {pdf_path}")
        
        # Extract text and metadata
        text_content = []
        metadata = {}
        
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            metadata = reader.metadata
            
            for page_num, page in enumerate(reader.pages):
                text_content.append({
                    "page": page_num + 1,
                    "text": page.extract_text()
                })
        
        # Convert PDF to images (best-effort)
        image_paths = []
        image_warning = None
        try:
            from pdf2image import convert_from_path

            images_dir = Path(image_storage.base_dir) / "pdf_extracts" / Path(pdf_path).stem
            images_dir.mkdir(parents=True, exist_ok=True)

            images = convert_from_path(pdf_path)
            for idx, image in enumerate(images):
                img_path = images_dir / f"page_{idx+1}.png"
                image.save(img_path, "PNG")
                image_paths.append(str(img_path))
        except ImportError:
            image_warning = "pdf2image not installed; extracted text only"
        except Exception as convert_error:
            image_warning = f"Image extraction unavailable: {str(convert_error)[:200]}"
        
        result = {
            "success": True,
            "source": "pdf_extract",
            "pdf_path": pdf_path,
            "total_pages": len(reader.pages),
            "metadata": dict(metadata) if metadata else {},
            "text_content": text_content,
            "extracted_images": image_paths,
            "warning": image_warning,
            "_timestamp": datetime.now().isoformat()
        }
        
        # Log PDF processing
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "operation": "extract_from_pdf",
            "pdf_path": pdf_path,
            "pages": len(reader.pages),
            "images_extracted": len(image_paths),
            "metadata": dict(metadata) if metadata else {}
        }
        image_storage._write_log(log_entry)
        
        print(f"✅ PDF processed: {len(reader.pages)} pages, {len(image_paths)} images extracted")
        return result
    
    except FileNotFoundError:
        return {"error": f"PDF file not found: {pdf_path}"}
    except Exception as e:
        print(f"❌ PDF processing error: {e}")
        return {"error": f"PDF processing failed: {str(e)}"}


# ==================== IMAGE RETRIEVAL ====================
def get_processing_logs() -> dict:
    """Get all image processing logs for review."""
    logs = image_storage.get_logs()
    
    # Organize by operation type
    organized_logs = {
        "generation": [l for l in logs if l.get("operation") == "generate_image"],
        "vision": [l for l in logs if l.get("operation") == "vision_analysis"],
        "pdf": [l for l in logs if l.get("operation") == "extract_from_pdf"],
        "total_entries": len(logs)
    }
    
    return organized_logs


def check_rate_limit_status() -> dict:
    """Get current rate limit status."""
    wait_time = image_rate_limiter.get_wait_time()
    
    return {
        "limit_rpm": IMAGE_RPM_LIMIT,
        "min_interval_seconds": IMAGE_REQUEST_MIN_INTERVAL,
        "current_wait_seconds": wait_time,
        "rate_limited": wait_time > 0,
        "message": f"Rate limit: {IMAGE_RPM_LIMIT} requests per minute (minimum {IMAGE_REQUEST_MIN_INTERVAL}s between requests)"
    }
