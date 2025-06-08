import os
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
import argparse
from dotenv import load_dotenv
import concurrent.futures # Added
import re # Added for parsing page numbers
import json # Added for caching
from pathlib import Path # Added for caching
import datetime # Added for caching
import hashlib # Added for caching
from colorama import Fore, init # Added for colored output

# Load environment variables from .env file
load_dotenv() # Added

# Configure the Gemini API key
try:
    GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
except KeyError:
    GEMINI_API_KEY = input("Please enter your Gemini API Key: ")

# The API key print statement is now conditional within the main block

genai.configure(api_key=GEMINI_API_KEY)

# --- Caching Configuration ---
DEFAULT_CACHE_DIR = Path(".cache/technofino_summarizer")
DEFAULT_CACHE_EXPIRY_DAYS = 7

# --- Utility to List Models ---
def list_available_models():
    print("\\n--- Available Gemini Models ---")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Model name: {m.name} - Display name: {m.display_name}")
    print("-----------------------------\\n")

# --- Caching Functions ---
def get_cache_filepath(thread_url, cache_dir):
    """Generates a unique filepath for caching a thread's content."""
    url_hash = hashlib.md5(thread_url.encode('utf-8')).hexdigest()
    return cache_dir / f"{url_hash}.json"

def load_from_cache(cache_filepath, expiry_days):
    """Loads messages from cache if valid and not expired."""
    if cache_filepath.exists():
        try:
            with open(cache_filepath, 'r') as f:
                cache_data = json.load(f)
            
            timestamp_str = cache_data.get("timestamp")
            if timestamp_str:
                timestamp = datetime.datetime.fromisoformat(timestamp_str)
                if (datetime.datetime.now() - timestamp).days < expiry_days:
                    print(f"{Fore.GREEN}Cache hit: Loading messages from {cache_filepath}{Fore.RESET}")
                    return cache_data.get("messages")
                else:
                    print(f"{Fore.YELLOW}Cache expired: {cache_filepath}{Fore.RESET}")
            else:
                print(f"{Fore.YELLOW}Cache invalid (no timestamp): {cache_filepath}{Fore.RESET}")
        except (json.JSONDecodeError, IOError) as e:
            print(f"{Fore.RED}Error loading cache file {cache_filepath}: {e}{Fore.RESET}")
    return None

def save_to_cache(cache_filepath, messages):
    """Saves messages to cache with a timestamp."""
    cache_filepath.parent.mkdir(parents=True, exist_ok=True)
    cache_data = {
        "timestamp": datetime.datetime.now().isoformat(),
        "messages": messages
    }
    try:
        with open(cache_filepath, 'w') as f:
            json.dump(cache_data, f)
        print(f"{Fore.GREEN}Messages cached to {cache_filepath}{Fore.RESET}")
    except IOError as e:
        print(f"{Fore.RED}Error saving cache to {cache_filepath}: {e}{Fore.RESET}")

def clear_cache_dir(cache_dir):
    """Clears all files in the cache directory."""
    if cache_dir.exists():
        for item in cache_dir.iterdir():
            if item.is_file():
                try:
                    item.unlink()
                    print(f"{Fore.YELLOW}Deleted cache file: {item}{Fore.RESET}")
                except OSError as e:
                    print(f"{Fore.RED}Error deleting cache file {item}: {e}{Fore.RESET}")
        print(f"{Fore.GREEN}Cache directory {cache_dir} cleared.{Fore.RESET}")
    else:
        print(f"{Fore.YELLOW}Cache directory {cache_dir} does not exist.{Fore.RESET}")

# --- Scraper ---

def get_canonical_url(url_str):
    """Converts a potentially specific page/anchor URL to the base thread URL (first page)."""
    # 1. Strip anchor/fragment
    url_no_anchor = url_str.split('#')[0]
    
    # 2. Strip /page-N... if present at the end
    # This regex looks for '/page-' followed by digits, optionally followed by a slash, at the end of the string.
    match = re.search(r'/page-\d+(?:/)?$', url_no_anchor)
    if match:
        # Take the part of the string before this match
        base_url_path = url_no_anchor[:match.start()]
    else:
        base_url_path = url_no_anchor
        
    # Ensure the canonical URL ends with a slash for consistency
    if not base_url_path.endswith('/'):
        base_url_path += '/'
        
    return base_url_path

def fetch_page_messages(page_url):
    """Fetches messages with their dates from a single page URL."""
    messages_with_dates = []
    print(f"{Fore.CYAN}Fetching messages from: {page_url}{Fore.RESET}")
    try:
        response = requests.get(page_url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        message_articles = soup.select('article.message') 
        for article in message_articles:
            date_str = "Unknown date"
            time_tag = article.select_one('time.u-dt')
            if time_tag:
                if time_tag.has_attr('datetime'):
                    date_str = time_tag['datetime']
                else:
                    date_str = time_tag.get_text(strip=True) # Fallback to text

            content_tag = article.select_one('.message-content .bbWrapper')
            if not content_tag:
                 content_tag = article.select_one('.bbWrapper') # General fallback within article

            if content_tag:
                content_text = content_tag.get_text(separator='\\n', strip=True) # MODIFIED: separator='\n'
                if content_text: # Only add if there's actual content
                    messages_with_dates.append({'date': date_str, 'content': content_text})
    except requests.exceptions.RequestException as e:
        print(f"{Fore.RED}Error fetching page {page_url}: {e}{Fore.RESET}")
    return messages_with_dates

def get_all_messages_from_thread(thread_url, use_cache, cache_dir, cache_expiry_days):
    """Extracts all messages (with dates) from all pages of a Technofino thread, using cache if enabled."""
    
    original_user_url = thread_url # Keep for logging or other purposes if needed
    canonical_first_page_url = get_canonical_url(original_user_url)
    
    if original_user_url != canonical_first_page_url:
        print(f"{Fore.YELLOW}Normalized URL from '{original_user_url}' to '{canonical_first_page_url}' for processing.{Fore.RESET}")

    cache_filepath = get_cache_filepath(canonical_first_page_url, cache_dir) # Use canonical URL for caching

    if use_cache:
        cached_messages = load_from_cache(cache_filepath, cache_expiry_days)
        if cached_messages is not None:
            return cached_messages

    all_messages_by_page = {} # Store messages keyed by page number to maintain order

    # Fetch the first page to get total pages and first page messages
    print(f"{Fore.CYAN}Fetching initial page to determine pagination: {canonical_first_page_url}{Fore.RESET}") # Use canonical URL
    try:
        response = requests.get(canonical_first_page_url, headers={ # Use canonical URL
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"{Fore.RED}Error fetching initial page {canonical_first_page_url}: {e}{Fore.RESET}") # Use canonical URL
        return []

    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Extract messages from the first page
    first_page_messages_with_dates = []
    message_articles_fp = soup.select('article.message')
    for article_fp in message_articles_fp:
        date_str_fp = "Unknown date"
        time_tag_fp = article_fp.select_one('time.u-dt')
        if time_tag_fp:
            if time_tag_fp.has_attr('datetime'):
                date_str_fp = time_tag_fp['datetime']
            else:
                date_str_fp = time_tag_fp.get_text(strip=True)
        
        content_tag_fp = article_fp.select_one('.message-content .bbWrapper')
        if not content_tag_fp:
             content_tag_fp = article_fp.select_one('.bbWrapper')

        if content_tag_fp:
            content_text_fp = content_tag_fp.get_text(separator='\\n', strip=True) # MODIFIED: separator='\n'
            if content_text_fp: # Only add if there's actual content
                first_page_messages_with_dates.append({'date': date_str_fp, 'content': content_text_fp})
    
    all_messages_by_page[1] = first_page_messages_with_dates

    # Determine total number of pages
    total_pages = 1
    page_nav = soup.select_one('.pageNav-main')
    if page_nav:
        # Try to find the last page number from pagination links
        page_links = page_nav.select('li.pageNav-page a[href]')
        if page_links:
            last_page_link_text = page_links[-1].get_text(strip=True)
            if last_page_link_text.isdigit():
                total_pages = int(last_page_link_text)
            else: # Fallback if last link is not a number (e.g., "Next")
                # Check previous elements if the last one is "Next" or similar
                if len(page_links) > 1 and page_links[-2].get_text(strip=True).isdigit():
                    total_pages = int(page_links[-2].get_text(strip=True))
                # If still not found, it might be a single page or very few pages
                # The initial value of total_pages = 1 will handle single page cases.
                # This part can be further improved if specific non-numeric last links are common.
        else: # No page links found, assume single page
             pass # total_pages remains 1

    print(f"{Fore.BLUE}Total pages identified: {total_pages}{Fore.RESET}")

    page_urls_to_fetch = []
    if total_pages > 1:
        # Construct base URL for subsequent pages using the canonical first page URL
        base_thread_url_for_pages = canonical_first_page_url.rstrip('/')
        
        for page_num in range(2, total_pages + 1):
            page_urls_to_fetch.append(f"{base_thread_url_for_pages}/page-{page_num}")

    if page_urls_to_fetch:
        # Max workers can be tuned. None usually defaults to number of processors * 5
        # Let's cap it to avoid overwhelming the server or hitting rate limits quickly.
        # Technofino might be sensitive to too many rapid requests.
        max_workers = min(10, len(page_urls_to_fetch)) 
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_url = {executor.submit(fetch_page_messages, url): url for url in page_urls_to_fetch}
            for future in concurrent.futures.as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    page_messages = future.result()
                    # Extract page number from URL to store in order
                    match = re.search(r'page-(\d+)', url)
                    if match:
                        page_num = int(match.group(1))
                        all_messages_by_page[page_num] = page_messages
                    else: # Fallback for URLs not matching page-X, though unlikely with current construction
                        print(f"{Fore.YELLOW}Warning: Could not determine page number for {url}{Fore.RESET}")
                        # Append to a temporary list if page number unknown, then append at the end
                        # For now, we assume URLs will match the pattern
                except Exception as exc:
                    print(f'{Fore.RED}{url} generated an exception: {exc}{Fore.RESET}')
    
    # Combine all messages in page order
    final_messages_list = []
    for page_num in sorted(all_messages_by_page.keys()):
        final_messages_list.extend(all_messages_by_page[page_num])
        
    if use_cache and final_messages_list: # Save to cache only if scraping was successful
        save_to_cache(cache_filepath, final_messages_list)
        
    return final_messages_list

# --- Summarizer ---
def summarize_text_with_gemini(text_to_summarize, keywords=None, model_name="models/gemini-2.0-flash"): 
    """Summarizes the given text (list of message dicts) using the Gemini API, optionally focusing on keywords."""
    if not text_to_summarize:
        return f"{Fore.YELLOW}No text provided to summarize.{Fore.RESET}"

    model = genai.GenerativeModel(model_name)
    try:
        formatted_messages = []
        for msg_dict in text_to_summarize:
            date_info = msg_dict.get('date', 'Unknown date')
            content_info = msg_dict.get('content', '')
            try:
                if date_info.endswith('Z'): # Handle UTC 'Z'
                    dt_object = datetime.datetime.fromisoformat(date_info[:-1] + '+00:00')
                else:
                    dt_object = datetime.datetime.fromisoformat(date_info)
                standardized_date_str = dt_object.strftime("%Y-%m-%d %H:%M %Z%z")
            except (ValueError, TypeError):
                standardized_date_str = date_info # Fallback
            formatted_messages.append(f"Date: {standardized_date_str}\\nMessage: {content_info}") # MODIFIED: \n
        full_text = "\\n\\n---\\n\\n".join(formatted_messages) # MODIFIED: \n\n---\n\n
        
        current_date_str = datetime.date.today().strftime('%Y-%m-%d')
        prompt_parts = [
            f"Please summarize the following forum discussion thread. Each message includes its posting date. The current date is {current_date_str}.",
            "Consider the dates of the messages to identify the most current information and highlight if some points are outdated.",
            "Extract the key points, main questions, and any conclusions or consensus reached by the users, noting the recency of information."
        ]
        if keywords:
            prompt_parts.append(f"Pay special attention to topics related to: {', '.join(keywords)}.")
        
        prompt_parts.append(f"The thread is from Technofino:\\n\\n{full_text}\\n\\nSummary:") # MODIFIED: \n\n{full_text}\n\n
        prompt = "\\n".join(prompt_parts) # MODIFIED: \\n
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"{Fore.RED}An error occurred during summarization: {e}{Fore.RESET}"

def estimate_token_count(text_data, model_name="models/gemini-2.0-flash"):
    """Estimates the token count for the given text data (list of message dicts) using the Gemini API."""
    if not text_data:
        return 0, f"{Fore.YELLOW}No text data to count tokens for.{Fore.RESET}"
    
    model = genai.GenerativeModel(model_name)
    try:
        formatted_messages = []
        for msg_dict in text_data:
            date_info = msg_dict.get('date', 'Unknown date')
            content_info = msg_dict.get('content', '')
            try:
                if date_info.endswith('Z'):
                    dt_object = datetime.datetime.fromisoformat(date_info[:-1] + '+00:00')
                else:
                    dt_object = datetime.datetime.fromisoformat(date_info)
                standardized_date_str = dt_object.strftime("%Y-%m-%d %H:%M %Z%z")
            except (ValueError, TypeError):
                standardized_date_str = date_info
            formatted_messages.append(f"Date: {standardized_date_str}\\nMessage: {content_info}") # MODIFIED: \n
        full_text = "\\n\\n---\\n\\n".join(formatted_messages) # MODIFIED: \n\n---\n\n
        
        current_date_str = datetime.date.today().strftime('%Y-%m-%d')
        prompt_for_counting = [
            f"Please summarize the following forum discussion thread. Each message includes its posting date. The current date is {current_date_str}.",
            "Consider the dates of the messages to identify the most current information and highlight if some points are outdated.",
            f"The thread is from Technofino:\\n\\n{full_text}\\n\\nSummary:" # MODIFIED: \n\n{full_text}\n\n
        ]
        content_to_count = "\\n".join(prompt_for_counting) # MODIFIED: \\n
        
        response = model.count_tokens(content_to_count)
        return response.total_tokens, None
    except Exception as e:
        return 0, f"{Fore.RED}An error occurred during token count estimation: {e}{Fore.RESET}"

def answer_question_with_gemini(thread_messages, question, model_name="models/gemini-2.0-flash"):
    """Answers a question based on the provided thread messages (list of dicts) using the Gemini API."""
    if not thread_messages:
        return f"{Fore.YELLOW}No thread content available to answer questions.{Fore.RESET}"
    if not question:
        return f"{Fore.YELLOW}No question provided.{Fore.RESET}"

    model = genai.GenerativeModel(model_name)
    try:
        formatted_messages = []
        for msg_dict in thread_messages:
            date_info = msg_dict.get('date', 'Unknown date')
            content_info = msg_dict.get('content', '')
            try:
                if date_info.endswith('Z'):
                    dt_object = datetime.datetime.fromisoformat(date_info[:-1] + '+00:00')
                else:
                    dt_object = datetime.datetime.fromisoformat(date_info)
                standardized_date_str = dt_object.strftime("%Y-%m-%d %H:%M %Z%z")
            except (ValueError, TypeError):
                standardized_date_str = date_info
            formatted_messages.append(f"Date: {standardized_date_str}\\nMessage: {content_info}") # MODIFIED: \n
        full_text = "\\\\n\\\\n---\\\\n\\\\n".join(formatted_messages) # MODIFIED: \n\n---\n\n
        
        current_date_str = datetime.date.today().strftime('%Y-%m-%d') # This line is fine, but prompt uses datetime.datetime.now()
        prompt = (
            f"Current date: {datetime.datetime.now().strftime('%Y-%m-%d')}.\\n\\n" # MODIFIED: .\n\n
            f"Consider the posting dates of the messages when answering. More recent information is generally more relevant. If the information might be outdated, please say so.\\n\\n" # MODIFIED: .\n\n
            f"Context from the thread (includes message dates):\\n" # MODIFIED: :\n
            f"{full_text}\\n\\n"  # MODIFIED: {full_text}\n\n (was {formatted_messages_for_prompt})
            f"Based on the above, please answer the question: \"{question}\". "
            f"If the answer is not found in the provided messages, say so. "
            f"If the question is subjective or opinion-based, acknowledge that."
        )
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"{Fore.RED}An error occurred while trying to answer the question: {e}{Fore.RESET}"

# --- Main Execution --- 
if __name__ == "__main__":
    init(autoreset=True) # Initialize colorama

    parser = argparse.ArgumentParser(description="Summarize a Technofino thread.")
    # Make thread_url optional at the parser level
    parser.add_argument("thread_url", nargs='?', default=None, help="The URL of the Technofino thread to summarize. Required unless --clear-cache is used.")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode for more verbose output.")
    
    # Arguments for output format
    parser.add_argument("--output-file", "-o", help="Path to save the summary (e.g., summary.txt or summary.md).")
    parser.add_argument("--output-format", choices=['txt', 'md'], default='txt', help="Format for the output file (txt or md). Default: txt.")
    
    # Arguments for keyword-focused summary
    parser.add_argument("--keywords", help="Comma-separated keywords to focus the summary on (e.g., 'credit card,rewards,travel').")

    # Arguments for caching
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE_DIR, help=f"Directory to store cached thread content. Default: {DEFAULT_CACHE_DIR}")
    parser.add_argument("--cache-expiry", type=int, default=DEFAULT_CACHE_EXPIRY_DAYS, help=f"Cache expiry in days. Default: {DEFAULT_CACHE_EXPIRY_DAYS} days.")
    parser.add_argument("--no-cache", action="store_true", help="Disable caching for this run.")
    parser.add_argument("--clear-cache", action="store_true", help="Clear all cached data from the cache directory and exit.")

    args = parser.parse_args()

    if args.clear_cache:
        # If --clear-cache is present, thread_url is not strictly needed for this action.
        # The cache_dir argument (which has a default) will be used.
        clear_cache_dir(args.cache_dir)
        print(f"{Fore.GREEN}Cache clearing requested. Exiting.{Fore.RESET}")
        exit(0)

    # If not --clear-cache, thread_url is now mandatory.
    if not args.thread_url:
        parser.error("thread_url is required if --clear-cache is not specified.")

    if args.debug:
        # Corrected f-string for API key debug print
        api_key_display = f"{GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-5:]}" if len(GEMINI_API_KEY) > 10 else GEMINI_API_KEY
        print(f"{Fore.BLUE}[DEBUG] Attempting to use API Key: {api_key_display}{Fore.RESET}")
        list_available_models()
    
    print(f"{Fore.BLUE}Starting to scrape messages...{Fore.RESET}")
    messages = get_all_messages_from_thread(
        args.thread_url,
        use_cache=not args.no_cache,
        cache_dir=args.cache_dir,
        cache_expiry_days=args.cache_expiry
    )

    if messages:
        print(f"{Fore.GREEN}Found {len(messages)} messages (from cache or scraping). Now summarizing...{Fore.RESET}")
        
        user_keywords = [k.strip() for k in args.keywords.split(',')] if args.keywords else None

        if args.debug:
            token_count, error_msg = estimate_token_count(messages)
            if error_msg:
                print(f"{Fore.RED}[DEBUG] Token estimation error: {error_msg}{Fore.RESET}")
            else:
                print(f"{Fore.BLUE}[DEBUG] Estimated token count for summarization: {token_count}{Fore.RESET}")
        
        summary = summarize_text_with_gemini(messages, keywords=user_keywords)
        
        if args.output_file:
            output_path = Path(args.output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            try:
                with open(output_path, 'w', encoding='utf-8') as f:
                    if args.output_format == 'md':
                        f.write(f"# Summary of: {args.thread_url}\\n\\n")
                        if user_keywords:
                            f.write(f"**Keywords focused:** {', '.join(user_keywords)}\\n\\n")
                    f.write(summary)
                print(f"{Fore.GREEN}Summary saved to: {output_path}{Fore.RESET}")
            except IOError as e:
                print(f"{Fore.RED}Error saving summary to file: {e}{Fore.RESET}")
                print(f"{Fore.BLUE}--- Summary of the Thread (Console Fallback) ---{Fore.RESET}")
                print(summary)
        else:
            print(f"{Fore.BLUE}--- Summary of the Thread ---{Fore.RESET}")
            print(summary)

        # Interactive Q&A session
        if messages: # Ensure messages were loaded before starting Q&A
            while True:
                try:
                    ask_qna = input(f"{Fore.YELLOW}Do you want to ask questions about this thread? (yes/no): {Fore.RESET}").strip().lower()
                except EOFError: # Handle cases where input stream is closed (e.g. piping)
                    break
                if ask_qna == 'yes':
                    print(f"{Fore.BLUE}Entering Q&A mode. Type 'quit' to exit.{Fore.RESET}")
                    while True:
                        try:
                            user_question = input(f"{Fore.CYAN}Your question: {Fore.RESET}").strip()
                        except EOFError:
                            user_question = "quit"
                        if not user_question:
                            continue
                        if user_question.lower() == 'quit':
                            print(f"{Fore.YELLOW}Exiting Q&A mode.{Fore.RESET}")
                            break
                        
                        answer = answer_question_with_gemini(messages, user_question)
                        print(f"{Fore.MAGENTA}Answer: {answer}{Fore.RESET}")
                    break # Exit Q&A loop and main program after Q&A session ends
                elif ask_qna == 'no':
                    print(f"{Fore.YELLOW}Skipping Q&A.{Fore.RESET}")
                    break
                else:
                    print(f"{Fore.RED}Invalid input. Please answer 'yes' or 'no'.{Fore.RESET}")
    else:
        print(f"{Fore.RED}No messages were found from the thread (or cache). Cannot summarize or start Q&A.{Fore.RESET}")
