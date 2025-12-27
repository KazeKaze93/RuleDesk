import os
import sys
import glob
import time
import google.generativeai as genai
from pathlib import Path

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

def _select_available_model():
    """Select first available model from priority list with fallback.
    Returns (model, model_index)."""
    for index, model_name in enumerate(MODEL_PRIORITIES):
        try:
            print(f"🔍 Trying model: {model_name}...")
            model = genai.GenerativeModel(model_name)
            print(f"✅ Selected model: {model_name}")
            return (model, index)
        except Exception as e:
            error_msg = str(e).lower()
            # Check for quota/availability errors
            if any(keyword in error_msg for keyword in ["quota", "rate limit", "unavailable", "not found", "permission"]):
                print(f"   ⚠️ Model {model_name} unavailable: {e}")
                continue
            # For other errors, still try the model (might be transient)
            print(f"   ⚠️ Model {model_name} initialization warning: {e}, will retry on actual translation")
            return (model, index)
    
    print("❌ Error: No available models from priority list.")
    sys.exit(1)

def _needs_translation(source_path: str, target_path: str) -> bool:
    """Check if file needs translation by comparing modification times."""
    if not os.path.exists(target_path):
        return True
    
    source_mtime = os.path.getmtime(source_path)
    target_mtime = os.path.getmtime(target_path)
    
    return source_mtime > target_mtime

def translate_text(model, text, filename, model_name=None):
    """Translate text using the provided model, with fallback support."""
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
    
    try:
        response = model.generate_content(prompt)
        if not response.text or len(response.text) < 10:
            print(f"   ⚠️ Warning: Empty response for {filename}. Skipping.")
            return None
        return response.text
    except Exception as e:
        error_msg = str(e).lower()
        # Check for quota/availability errors that require model switch
        if any(keyword in error_msg for keyword in ["quota", "rate limit", "unavailable", "not found", "permission"]):
            raise RuntimeError(f"Model unavailable: {e}")
        print(f"   ❌ API Error for {filename}: {e}")
        return None

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

def _translate_file(model, source_path, target_path):
    """Translate a single file if it has been modified."""
    try:
        with open(source_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        if not content.strip():
            return False

        translated = translate_text(model, content, source_path)
        if not translated:
            return False

        os.makedirs(os.path.dirname(target_path), exist_ok=True)

        with open(target_path, "w", encoding="utf-8") as f:
            f.write(HEADER + translated)
            
        print(f"   ✅ Saved to {target_path}")
        time.sleep(1)
        return True

    except RuntimeError as e:
        # Model unavailable error - needs fallback
        raise
    except Exception as e:
        print(f"   ❌ File Error {source_path}: {e}")
        return False

def main():
    print("🚀 Starting Documentation Translator for RuleDesk...")
    model, model_index = setup_gemini()
    
    for source, target in MAPPINGS.items():
        process_item(model, source, target, model_index)
        
    print("🏁 Translation complete.")

if __name__ == "__main__":
    main()