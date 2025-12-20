#!/usr/bin/env python3
import ast
import subprocess
import sys
import os
import time
import re
from pathlib import Path
from typing import List, Set, Optional

# --- DEPENDENCIES CHECK ---
try:
    import google.generativeai as genai
    from google.api_core import exceptions as google_exceptions
    from google.generativeai.types import GenerationConfig
except ImportError:
    print("❌ Critical Error: Library 'google-generativeai' is missing.")
    print("Run: pip install google-generativeai")
    sys.exit(1)

# --- CONFIGURATION FROM REFERENCE ---
MODEL_PRIORITIES = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-pro",
]

DEFAULT_MODEL_NAME = "gemini-2.5-flash"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ENV_MODEL_NAME = os.getenv("MODEL_NAME")

INDENT = "    "

class FunctionInfo:
    """Контейнер для метаданных функции."""
    def __init__(self, node: ast.FunctionDef, filepath: Path, full_source: str):
        self.name = node.name
        self.lineno = node.lineno
        self.end_lineno = node.end_lineno
        self.args = [a.arg for a in node.args.args if a.arg != 'self']
        self.node = node
        self.has_docstring = ast.get_docstring(node) is not None
        
        lines = full_source.splitlines()
        func_lines = lines[node.lineno-1 : node.end_lineno]
        self.source_code = "\n".join(func_lines)

def run_git_command(args: List[str]) -> str:
    try:
        result = subprocess.run(
            ["git"] + args, capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"❌ Git Error: {e.stderr}")
        sys.exit(1)

def get_changed_files() -> List[Path]:
    raw_staged = run_git_command(["diff", "--name-only", "--cached", "*.py"])
    raw_unstaged = run_git_command(["diff", "--name-only", "*.py"])
    files = set()
    for line in (raw_staged + "\n" + raw_unstaged).splitlines():
        if line.strip():
            files.add(Path(line.strip()))
    return [f for f in files if f.exists()]

def get_changed_lines(filepath: Path) -> Set[int]:
    diff = run_git_command(["diff", "--unified=0", str(filepath)])
    changed_lines = set()
    for line in diff.splitlines():
        if line.startswith("@@"):
            try:
                parts = line.split(" ")
                new_chunk = parts[2]
                if "," in new_chunk:
                    start, count = map(int, new_chunk[1:].split(","))
                else:
                    start = int(new_chunk[1:])
                    count = 1
                for i in range(start, start + count):
                    changed_lines.add(i)
            except Exception:
                continue
    return changed_lines

def generate_doc_with_gemini(func_code: str) -> Optional[str]:
    """
    Пытается сгенерировать докстринг, перебирая модели из MODEL_PRIORITIES.
    """
    if not GEMINI_API_KEY:
        return None

    genai.configure(api_key=GEMINI_API_KEY)

    models_to_try = MODEL_PRIORITIES.copy()
    if ENV_MODEL_NAME and ENV_MODEL_NAME not in MODEL_PRIORITIES:
        models_to_try.insert(0, ENV_MODEL_NAME)

    system_prompt = (
        "You are a Senior Python Developer. "
        "Generate a Google-style docstring for the provided Python function. "
        "Analyze the code to understand arguments, return types, and exceptions. "
        "Strict Rules:\n"
        "1. Do NOT include the function signature.\n"
        "2. Output ONLY the docstring content (inside triple quotes).\n"
        "3. Do NOT use Markdown formatting like ```python.\n"
        "4. Be concise."
    )

    full_prompt = f"{system_prompt}\n\nFunction Code:\n{func_code}"
    
    generation_config = GenerationConfig(
        max_output_tokens=1024,
        temperature=0.1,
    )

    last_error = None

    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(full_prompt, generation_config=generation_config)
            
            content = response.text.strip()
            
            content = content.replace("```python", "").replace("```", "").strip()
            if content.startswith('"""') and content.endswith('"""'):
                content = content[3:-3].strip()
            elif content.startswith("'''") and content.endswith("'''"):
                content = content[3:-3].strip()
                
            return content

        except google_exceptions.GoogleAPIError as e:
            last_error = e
            if "429" in str(e) or "quota" in str(e).lower():
                continue
            continue
        except Exception as e:
            last_error = e
            continue

    print(f"⚠️ All models failed. Last error: {last_error}")
    return None

def generate_fallback_docstring(func: FunctionInfo) -> str:
    """Заглушка, если API недоступен."""
    lines = ['Short description here.', '']
    if func.args:
        lines.append("Args:")
        for arg in func.args:
            lines.append(f"{INDENT}{arg}: Description for {arg}.")
    lines.append("")
    lines.append("Returns:")
    lines.append(f"{INDENT}Any: Description of return value.")
    return "\n".join(lines)

def process_file(filepath: Path, dry_run: bool = False):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        return

    try:
        tree = ast.parse(content)
    except SyntaxError:
        print(f"⚠️  Skipping {filepath}: Syntax Error")
        return

    changed_lines_indices = get_changed_lines(filepath)
    if not changed_lines_indices:
        return

    lines = content.splitlines()
    functions = [node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
    functions.sort(key=lambda x: x.lineno, reverse=True)

    updates_made = False

    for node in functions:
        func_range = set(range(node.lineno, node.end_lineno + 1))
        if not func_range.intersection(changed_lines_indices):
            continue

        func_info = FunctionInfo(node, filepath, content)
        
        if not func_info.has_docstring:
            print(f"🤖 Generating doc for {filepath.name}::{func_info.name}...")
            
            doc_body = generate_doc_with_gemini(func_info.source_code)
            
            if not doc_body:
                doc_body = generate_fallback_docstring(func_info)
            
            doc_lines = doc_body.splitlines()
            formatted_doc = ['"""'] + doc_lines + ['"""']
            
            indentation = " " * node.col_offset
            final_block = "\n".join([f"{indentation}{INDENT}{l}" for l in formatted_doc])
            
            insert_idx = node.body[0].lineno - 1
            
            if not dry_run:
                lines.insert(insert_idx, final_block)
                updates_made = True
            else:
                print(f"[DRY RUN] Would insert:\n{final_block}\n")

    if updates_made and not dry_run:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        print(f"✅ Updated {filepath}")

def main():
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        print("🔍 Running in DRY RUN mode")

    if not GEMINI_API_KEY:
        print("⚠️  GEMINI_API_KEY not found. Using static templates.")
    else:
        print(f"🧠 Gemini Enabled. Priority model: {ENV_MODEL_NAME or MODEL_PRIORITIES[0]}")

    changed_files = get_changed_files()
    
    if not changed_files:
        print("No Python files changed.")
        return

    print(f"🕵️  Scanning {len(changed_files)} changed files...")

    for file in changed_files:
        print(f"   > Checking {file.name}...") 
        process_file(file, dry_run)

    print("🏁 Done.")

if __name__ == "__main__":
    main()