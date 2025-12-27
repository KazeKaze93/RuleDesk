import os
import sys
import glob
import hashlib
import google.generativeai as genai
from pathlib import Path
from typing import Optional, Tuple

# --- CONFIGURATION ---
MAPPINGS = {
    "README.md": ".docs-i18n/ru/README.md",
    "docs": ".docs-i18n/ru/docs"
}

MODEL_PRIORITIES = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-pro",
]

CONTEXT_PROMPT = """
Project Context: "RuleDesk" - A modern desktop client for Rule34 imageboard content built with Electron, React, TypeScript, and Drizzle ORM.

GLOSSARY (DO NOT TRANSLATE THESE):
- Rule34, Gelbooru, Booru
- IPC (Inter-Process Communication)
- Main Process, Renderer Process
- Drizzle ORM, SQLite
- Store, State
- Props, Components
- Tag, Blacklist
"""

API_KEY = os.environ.get("GEMINI_API_KEY")
HEADER = """"""

def setup_gemini():
    """Initialize Gemini API and return (model, model_index)."""
    if not API_KEY:
        print("❌ Error: GEMINI_API_KEY is missing.")
        sys.exit(1)
    genai.configure(api_key=API_KEY)
    return _select_available_model()

def _select_available_model() -> Tuple[genai.GenerativeModel, int]:
    """Select first available model from priority list with fallback.
    Returns (model, model_index)."""
    for index, model_name in enumerate(MODEL_PRIORITIES):
        try:
            print(f"🔍 Trying model: {model_name}...")
            model = genai.GenerativeModel(model_name)
            print(f"✅ Selected model: {model_name}")
            return (model, index)
        except Exception as e:
            error_type = type(e).__name__
            error_str = str(e).lower()
            
            # Check for specific API errors (quota, rate limit, unavailable)
            is_api_error = (
                "APIError" in error_type or
                "GoogleAPIError" in error_type or
                "quota" in error_str or
                "rate limit" in error_str or
                "429" in error_str or
                "unavailable" in error_str or
                "not found" in error_str or
                "permission" in error_str
            )
            
            if is_api_error:
                # Specific API errors - model unavailable or quota exceeded
                print(f"   ⚠️ Model {model_name} unavailable: {e}")
                continue
            
            # Check for configuration errors
            if isinstance(e, (ValueError, AttributeError)):
                # Invalid model name or configuration error
                print(f"   ⚠️ Model {model_name} invalid: {e}")
                continue
            
            # Unexpected errors - log but don't fail immediately
            print(f"   ⚠️ Model {model_name} initialization warning: {e}, will retry on actual translation")
            return (model, index)
    
    print("❌ Error: No available models from priority list.")
    sys.exit(1)

def _get_file_hash(file_path: str) -> str:
    """Calculate SHA-256 hash of file content."""
    with open(file_path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

def _needs_translation(source_path: str, target_path: str) -> bool:
    """Check if file needs translation by comparing content hashes.
    
    Uses SHA-256 hashing instead of mtime because GitHub Actions checkout
    resets file modification times, making mtime comparison unreliable.
    """
    if not os.path.exists(target_path):
        return True
    
    try:
        source_hash = _get_file_hash(source_path)
        
        # Check if hash file exists (stores hash of last translated source)
        hash_file = target_path + ".hash"
        if os.path.exists(hash_file):
            with open(hash_file, "r", encoding="utf-8") as f:
                stored_hash = f.read().strip()
            return source_hash != stored_hash
        
        # No hash file - needs translation
        return True
    except (IOError, OSError) as e:
        print(f"   ⚠️ Error checking hash for {source_path}: {e}")
        # On error, assume translation is needed
        return True

def _exponential_backoff_retry(
    fn, max_retries: int = 3, base_delay: float = 1.0
) -> Optional[str]:
    """Execute function with exponential backoff retry logic.
    
    Uses exponential backoff (2^attempt * base_delay) for rate limit errors.
    This is more efficient than fixed delays and respects API rate limits.
    
    Args:
        fn: Function to execute (should return response text or raise exception)
        max_retries: Maximum number of retry attempts
        base_delay: Base delay in seconds (will be multiplied by 2^attempt)
    
    Returns:
        Response text on success, None on failure
    """
    import time
    
    for attempt in range(max_retries + 1):
        try:
            return fn()
        except Exception as e:
            error_type = type(e).__name__
            error_str = str(e).lower()
            
            # Check for API-specific errors
            is_api_error = (
                "APIError" in error_type or
                "GoogleAPIError" in error_type or
                "quota" in error_str or
                "rate limit" in error_str or
                "429" in error_str
            )
            
            is_unavailable = (
                "unavailable" in error_str or
                "not found" in error_str or
                "permission" in error_str
            )
            
            if is_unavailable:
                # Model unavailable - don't retry, switch model
                raise RuntimeError(f"Model unavailable: {e}")
            
            if is_api_error and attempt < max_retries:
                # Rate limit or quota error - retry with exponential backoff
                delay = base_delay * (2 ** attempt)
                print(f"   ⏳ Rate limit/quota hit, retrying in {delay:.1f}s (attempt {attempt + 1}/{max_retries + 1})")
                time.sleep(delay)
                continue
            
            # Other API errors or max retries reached
            if is_api_error:
                print(f"   ❌ API Error after {attempt + 1} attempts: {e}")
            else:
                print(f"   ❌ Unexpected error: {e}")
            return None
    
    return None

def translate_text(model: genai.GenerativeModel, text: str, filename: str) -> Optional[str]:
    """Translate text using the provided model, with exponential backoff retry.
    
    Args:
        model: Gemini GenerativeModel instance
        text: Source text to translate
        filename: Source filename (for logging)
    
    Returns:
        Translated text on success, None on failure
    """
    print(f"   🤖 Translating {filename}...")
    
    prompt = f"""
    Role: Senior Technical Translator (English -> Russian).
    Task: Translate the Markdown documentation for the "RuleDesk" project.
    
    {CONTEXT_PROMPT}
    
    STRICT RULES:
    1. KEEP all Markdown syntax (tables, links, code blocks, bold/italic) EXACTLY as is.
    2. DO NOT translate code blocks or inline code (`const x = 1`).
    3. DO NOT translate the glossary terms listed above.
    4. Tone: Professional, concise, suitable for GitHub technical docs (Хабр style).
    5. Output ONLY the translated markdown.
    
    File Content:
    {text}
    """
    
    def _call_api():
        response = model.generate_content(prompt)
        if not response.text or len(response.text) < 10:
            raise ValueError("Empty or too short response from API")
        return response.text
    
    result = _exponential_backoff_retry(_call_api, max_retries=3, base_delay=2.0)
    
    if result is None:
        print(f"   ⚠️ Warning: Failed to translate {filename} after retries. Skipping.")
    
    return result

def process_item(model, source, target_base, current_model_index=0):
    """Process source file or directory with model fallback support."""
    if os.path.isfile(source):
        target_path = target_base
        _translate_file_with_fallback(model, source, target_path, current_model_index)
    
    elif os.path.isdir(source):
        files = glob.glob(f"{source}/**/*.md", recursive=True)
        print(f"📂 Found {len(files)} markdown files in {source}")
        
        model_index = current_model_index
        current_model = model
        
        for file_path in files:
            rel_path = os.path.relpath(file_path, source)
            target_path = os.path.join(target_base, rel_path)
            
            # Try to translate with current model, fallback if needed
            result = _translate_file_with_fallback(current_model, file_path, target_path, model_index)
            if result is not None:
                model_index, current_model = result

def _translate_file_with_fallback(model, source_path, target_path, current_model_index):
    """Translate file with automatic model fallback on errors.
    Returns (new_model_index, new_model) if model was switched, None otherwise."""
    # Check if translation is needed
    if not _needs_translation(source_path, target_path):
        print(f"   ⏭️ Skipping {source_path} (no changes detected)")
        return None
    
    model_index = current_model_index
    current_model = model
    initial_index = current_model_index
    
    while model_index < len(MODEL_PRIORITIES):
        try:
            result = _translate_file(current_model, source_path, target_path)
            # Success or non-model error - return new model info if switched
            if model_index > initial_index:
                return (model_index, current_model)
            return None
        except RuntimeError:
            # Model unavailable, try next model
            model_index += 1
            if model_index >= len(MODEL_PRIORITIES):
                print(f"   ❌ Error: All models exhausted for {source_path}")
                return None
            
            print(f"   🔄 Switching to model: {MODEL_PRIORITIES[model_index]}")
            current_model = genai.GenerativeModel(MODEL_PRIORITIES[model_index])
            continue
    
    return None

def _translate_file(model: genai.GenerativeModel, source_path: str, target_path: str) -> bool:
    """Translate a single file if it has been modified.
    
    Args:
        model: Gemini GenerativeModel instance
        source_path: Path to source file
        target_path: Path to target file
    
    Returns:
        True on success, False on failure
    
    Raises:
        RuntimeError: If model is unavailable (triggers model fallback)
    """
    try:
        with open(source_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        if not content.strip():
            return False

        translated = translate_text(model, content, source_path)
        if not translated:
            return False

        os.makedirs(os.path.dirname(target_path), exist_ok=True)

        # Write translated content
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(HEADER + translated)
        
        # Save source file hash for future comparison
        source_hash = _get_file_hash(source_path)
        hash_file = target_path + ".hash"
        with open(hash_file, "w", encoding="utf-8") as f:
            f.write(source_hash)
            
        print(f"   ✅ Saved to {target_path}")
        return True

    except RuntimeError:
        # Model unavailable error - needs fallback
        raise
    except (IOError, OSError) as e:
        print(f"   ❌ File I/O Error {source_path}: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error translating {source_path}: {e}")
        return False

def main():
    print("🚀 Starting Documentation Translator for RuleDesk...")
    model, model_index = setup_gemini()
    
    for source, target in MAPPINGS.items():
        process_item(model, source, target, model_index)
        
    print("🏁 Translation complete.")

if __name__ == "__main__":
    main()