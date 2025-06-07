# Technofino Thread Summarizer

This application scrapes a discussion thread from the Technofino website, collects all messages (including their posting dates) across all pages, and then uses the Google Gemini API to generate a summary of the discussion. It also supports an interactive Q&A session about the thread content.

## Features

*   **Comprehensive Scraping**: Fetches all messages from all pages of a Technofino thread.
*   **Date-Aware Processing**: Extracts the posting date of each message and uses this information in prompts to Gemini for more relevant summaries and Q&A, helping to identify outdated information.
*   **Gemini API Integration**: Leverages Google's Gemini models for summarization and answering questions.
*   **Multiple Output Formats**: Save summaries as plain text (`.txt`) or Markdown (`.md`).
*   **Keyword-Focused Summaries**: Option to guide the summary generation towards specific keywords.
*   **Content Caching**:
    *   Scraped thread content is cached locally to speed up subsequent requests for the same thread.
    *   Cache expiry can be configured.
    *   Option to disable caching or clear the entire cache.
*   **Interactive Q&A**: After summarization, engage in an interactive session to ask specific questions about the thread content.
*   **URL Canonicalization**: Automatically normalizes thread URLs (e.g., removing page numbers or post anchors) to ensure consistent scraping and caching.
*   **Debug Mode**: Provides verbose output for troubleshooting.
*   **Token Estimation**: In debug mode, estimates the number of tokens the input will consume before calling the Gemini API for summarization.

## Prerequisites

- Python 3.7+
- A Google Gemini API Key

## Setup

1.  **Clone the repository (or create the files as described).**

2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set your Gemini API Key:**
    Create a file named `.env` in the `thread_summarizer_technofino` directory with the following content:
    ```
    GEMINI_API_KEY='YOUR_API_KEY'
    ```
    Replace `YOUR_API_KEY` with your actual Gemini API key. The application will automatically load this key. Alternatively, if the `.env` file is not found or the key isn't in it, the application will prompt you to enter the key manually.

## Usage

Run the main script with the Technofino thread URL as an argument:

```bash
python main.py <technofino_thread_url> [options]
```

**Basic Example:**
```bash
python main.py "https://www.technofino.in/community/threads/some-thread.12345/"
```
**Note on URLs**: It's good practice to enclose the URL in quotes, especially if it contains special characters. The script will attempt to normalize the URL (e.g., `https://example.com/thread/page-2` becomes `https://example.com/thread/`) for caching and processing.

### Options:

*   `thread_url`: (Positional argument) The URL of the Technofino thread. Required unless `--clear-cache` is used.
*   `--debug`: Enable debug mode. Shows API key (partial), lists available Gemini models, and prints estimated token count for summarization.
    ```bash
    python main.py "<url>" --debug
    ```
*   `--output-file <filepath>` or `-o <filepath>`: Save the summary to a file.
    ```bash
    python main.py "<url>" -o summary.txt
    ```
*   `--output-format <format>`: Specify the output file format. Choices: `txt`, `md`. Default: `txt`.
    ```bash
    python main.py "<url>" -o summary.md --output-format md
    ```
*   `--keywords "<keyword1,keyword2,...>"`: Focus the summary on specific comma-separated keywords.
    ```bash
    python main.py "<url>" --keywords "rewards,travel points,benefits"
    ```
*   `--no-cache`: Disable using or saving cached thread content for this run.
    ```bash
    python main.py "<url>" --no-cache
    ```
*   `--cache-dir <directory_path>`: Specify a custom directory for caching. Default: `./.cache/technofino_summarizer`.
    ```bash
    python main.py "<url>" --cache-dir /tmp/tf_cache
    ```
*   `--cache-expiry <days>`: Set the cache expiry duration in days. Default: 7 days.
    ```bash
    python main.py "<url>" --cache-expiry 3
    ```
*   `--clear-cache`: Clear all cached thread data from the specified cache directory (or default if not specified) and exit.
    ```bash
    python main.py --clear-cache
    python main.py --clear-cache --cache-dir /tmp/tf_cache
    ```

**Example with multiple options:**
```bash
python main.py "https://www.technofino.in/community/threads/another-thread.67890/" -o detailed_summary.md --output-format md --keywords "amex,offers" --debug --cache-expiry 1
```

The script will then:
1.  Normalize the input URL.
2.  Check for cached content (unless `--no-cache` is used).
3.  Scrape messages (including dates) if not using cache or cache is invalid/expired.
4.  Save to cache (if applicable).
5.  Generate a summary using the Gemini API, considering message dates and any specified keywords.
6.  Print the summary to the console or save it to the specified file.
7.  Offer an interactive Q&A session.

## How it Works

1.  **URL Normalization**: The input thread URL is canonicalized to its base form (e.g., first page, no anchors).
2.  **Caching (Optional & Default)**:
    *   The script checks for a local cache of the (normalized) thread URL.
    *   If a valid, non-expired cache entry exists, messages are loaded from it, skipping scraping.
    *   Cache files are stored as JSON in the specified `--cache-dir` (default: `.cache/technofino_summarizer`).
3.  **Scraping (if needed)**:
    *   If no valid cache, the script fetches the first page of the thread.
    *   It extracts messages (content and posting date) and determines the total number of pages.
    *   Messages from subsequent pages are fetched in parallel using `concurrent.futures.ThreadPoolExecutor`.
4.  **Aggregation**: All extracted messages (dictionaries containing `date` and `content`) are collected.
5.  **Cache Storage (if scraped)**: If messages were scraped and caching is enabled, they are saved to the cache with a timestamp.
6.  **Summarization**:
    *   The collected messages are formatted to include their dates.
    *   A prompt is constructed for the Gemini API (default model: `models/gemini-2.0-flash`), including the current date and instructions to consider message recency.
    *   If keywords are provided, the prompt is augmented to focus on those.
    *   The API generates the summary.
7.  **Output**: The summary is printed or saved as specified.
8.  **Interactive Q&A (Optional)**:
    *   The user is prompted to ask questions.
    *   For each question, a new prompt is sent to the Gemini API, including the full thread content (with dates) and the user's question. The prompt again emphasizes considering message dates for relevance.
    *   The session continues until the user types 'quit'.

### Sample Summary Output (Illustrative)
The summary output will attempt to highlight key points, questions, and conclusions from the thread, noting the recency of information based on message dates. For example, it might state that certain advice from older posts is now outdated.

*(The previous sample summary for the Myntra thread is a good general example of the kind of output, but the current version will be more explicitly date-aware in its analysis.)*
