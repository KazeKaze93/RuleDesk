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
MODEL_NAME = 'gemini-3-flash-preview'

HEADER = """"""

def setup_gemini():
    if not API_KEY:
        print("❌ Error: GEMINI_API_KEY is missing.")
        sys.exit(1)
    genai.configure(api_key=API_KEY)
    return genai.GenerativeModel(MODEL_NAME)

def translate_text(model, text, filename):
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
        print(f"   ❌ API Error for {filename}: {e}")
        return None

def process_item(model, source, target_base):
    if os.path.isfile(source):
        target_path = target_base
        _translate_file(model, source, target_path)
    
    elif os.path.isdir(source):
        files = glob.glob(f"{source}/**/*.md", recursive=True)
        print(f"📂 Found {len(files)} markdown files in {source}")
        
        for file_path in files:
            rel_path = os.path.relpath(file_path, source)
            target_path = os.path.join(target_base, rel_path)
            
            _translate_file(model, file_path, target_path)

def _translate_file(model, source_path, target_path):
    try:
        with open(source_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        if not content.strip():
            return

        translated = translate_text(model, content, source_path)
        if not translated:
            return

        os.makedirs(os.path.dirname(target_path), exist_ok=True)

        with open(target_path, "w", encoding="utf-8") as f:
            f.write(HEADER + translated)
            
        print(f"   ✅ Saved to {target_path}")
        time.sleep(1) 

    except Exception as e:
        print(f"   ❌ File Error {source_path}: {e}")

def main():
    print("🚀 Starting Documentation Translator for RuleDesk...")
    model = setup_gemini()
    
    for source, target in MAPPINGS.items():
        process_item(model, source, target)
        
    print("🏁 Translation complete.")

if __name__ == "__main__":
    main()