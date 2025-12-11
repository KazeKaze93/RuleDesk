import os
import logging
import sys
import time
import re
from typing import Tuple, Optional

import google.generativeai as genai  # type: ignore[import-untyped]
from github import Github, GithubException, Auth  # type: ignore[import-untyped] # <--- Added Auth
from google.api_core import exceptions as google_exceptions  # type: ignore[import-untyped]
from google.generativeai.types import GenerationConfig  # type: ignore[import-untyped]

# --- CONFIGURATION ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Constants
REVIEWABLE_EXTENSIONS = ('.ts', '.tsx', '.js', '.css', '.sql', '.py', '.md', '.json', '.yml', '.toml')

# ПРАВИЛЬНЫЕ ИМЕНА МОДЕЛЕЙ (Stable)
# Ставим Flash первой, так как у нее выше лимиты (15 RPM) и она реже падает с 429 ошибкой
MODEL_PRIORITIES = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-pro",
]
# Если ты хочешь использовать experimental 2.0, добавь "gemini-2.0-flash-exp" в начало, 
# но будь готов к нестабильности.

DEFAULT_MODEL_NAME = "gemini-2.5-pro"

class ReviewerError(Exception):
    "Base class for reviewer script errors."
    pass

# Environment Variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO_NAME = os.getenv("REPO_NAME")
PR_NUMBER_STR = os.getenv("PR_NUMBER")
# Если переменная MODEL_NAME не задана или кривая, берем дефолт
MODEL_NAME = os.getenv("MODEL_NAME", DEFAULT_MODEL_NAME)

def load_prompt() -> str:
    "Loads the system prompt from system_prompt.md file located in the same directory."
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        prompt_path = os.path.join(script_dir, 'system_prompt.md')
        
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        try:
            with open('system_prompt.md', 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            raise ReviewerError(f"system_prompt.md not found in {script_dir} or current dir!")
    except Exception as e:
        raise ReviewerError(f"Error reading system_prompt.md: {e}")

def get_pr_diff() -> Tuple[object, str]:
    "Fetches PR diff from GitHub, filtering for relevant files."
    if not GITHUB_TOKEN or not REPO_NAME or not PR_NUMBER_STR:
        raise ValueError("Missing GitHub credentials or PR info.")
    
    try:
        # --- FIX: UPDATED AUTHENTICATION METHOD ---
        auth = Auth.Token(GITHUB_TOKEN)
        g = Github(auth=auth)
        # ------------------------------------------
        
        repo = g.get_repo(REPO_NAME)
        pr = repo.get_pull(int(PR_NUMBER_STR))
        
        files = pr.get_files()
        diff_content = []
        
        logger.info(f"Processing PR #{PR_NUMBER_STR} in {REPO_NAME}...")

        for f in files:
            if f.status == "removed":
                continue
            
            if any(x in f.filename for x in ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "dist/", "out/", "build/"]):
                continue

            if f.filename.endswith(REVIEWABLE_EXTENSIONS):
                diff_content.append(f"### File: {f.filename}\n```diff\n{f.patch}\n```")
        
        return pr, "\n\n".join(diff_content)
        
    except GithubException as e:
        logger.error(f"GitHub API Error: {e}")
        raise
    except ValueError as e:
        logger.error(f"Invalid PR number: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching PR diff: {e}")
        raise

def analyze_code(diff_text: str, system_prompt: str, model_name: str) -> Optional[str]:
    if not GEMINI_API_KEY:
        raise ReviewerError("GEMINI_API_KEY is missing.")

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(model_name)
    
    generation_config = GenerationConfig(
        max_output_tokens=8192,
        temperature=0.2,
    )
    
    safe_prompt = f"{system_prompt}\n\n<code_diff>\n{diff_text}\n</code_diff>"
    
    try:
        response = model.generate_content(safe_prompt, generation_config=generation_config)
        return response.text
    except google_exceptions.GoogleAPIError as e:
        raise
    except Exception as e:
        raise ReviewerError(f"Unexpected error during analysis: {e}")

def parse_retry_delay(error_message: str) -> Optional[float]:
    patterns = [
        r'retry in (\d+(?:\.\d+)?) seconds?',
        r'retry after (\d+(?:\.\d+)?) seconds?',
        r'wait (\d+(?:\.\d+)?) seconds?',
        r'(\d+(?:\.\d+)?) seconds? before retry',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, error_message.lower())
        if match:
            try:
                return float(match.group(1))
            except (ValueError, IndexError):
                continue
    return None

def main() -> None:
    try:
        system_prompt = load_prompt()
        pr, diff_text = get_pr_diff()
        
        if not diff_text:
            logger.warning("No reviewable code changes found.")
            return

        # Строим список моделей. 
        # Если MODEL_NAME передан из Env, ставим его первым, но проверяем, существует ли он
        models_to_try = MODEL_PRIORITIES.copy()
        
        # Убираем проверку "если не в списке", просто добавляем, если он задан пользователем вручную
        if MODEL_NAME and MODEL_NAME not in MODEL_PRIORITIES:
            models_to_try.insert(0, MODEL_NAME)
        
        # Перемещаем приоритет на Flash, если он не первый (для скорости CI)
        if "gemini-1.5-flash" in models_to_try and models_to_try[0] != "gemini-1.5-flash":
             # Если хочешь экономить время и лимиты - Flash должен быть первым
             pass 

        review_comment = None
        successful_model = None
        last_error = None
        
        for model_index, model_name in enumerate(models_to_try):
            is_primary = model_index == 0
            
            try:
                if is_primary:
                    logger.info(f"Analyzing with {model_name}...")
                else:
                    logger.warning(f"Switching to fallback model: {model_name}")
                
                review_comment = analyze_code(diff_text, system_prompt, model_name)
                successful_model = model_name
                logger.info(f"Successfully analyzed with {model_name}")
                break
                
            except google_exceptions.GoogleAPIError as e:
                error_message = str(e)
                last_error = e
                error_code = getattr(e, 'code', None)
                
                is_rate_limit = (
                    error_code == 429 or 
                    '429' in error_message or 
                    'quota' in error_message.lower() or 
                    'rate limit' in error_message.lower() or
                    'resource exhausted' in error_message.lower()
                )
                
                if is_rate_limit:
                    logger.critical(f"Rate limit error with {model_name}. Attempting retry strategy...")
                    retry_delay = parse_retry_delay(error_message)
                    
                    if retry_delay and retry_delay > 1.0:
                        logger.info(f"Waiting {retry_delay}s...")
                        time.sleep(retry_delay)
                        try:
                            review_comment = analyze_code(diff_text, system_prompt, model_name)
                            successful_model = model_name
                            break
                        except Exception as retry_error:
                            last_error = retry_error
                            logger.warning(f"Retry failed for {model_name}. Switching...")
                            continue
                    else:
                        continue
                else:
                    logger.warning(f"API Error ({model_name}): {e}. Trying next model...")
                    continue
        
        if review_comment and successful_model:
            logger.info("Posting comment to GitHub...")
            final_comment = f"## 🛡️ Ревью Архитектора BuildHub\n\n{review_comment}\n\n*Движок: {successful_model}*"
            pr.create_issue_comment(final_comment)
            logger.info("Done.")
        else:
            error_msg = f"All models failed. Last error: {last_error}" if last_error else "Analysis failed."
            raise ReviewerError(error_msg)
            
    except Exception as e:
        logger.critical(f"Fatal Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()