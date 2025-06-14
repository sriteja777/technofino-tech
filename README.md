# Technofino Thread Summarizer

This project provides tools to scrape discussion threads from the Technofino website, collect messages, and then use the Google Gemini API to generate summaries and support interactive Q&A sessions about the thread content.

It consists of two main parts:
1.  A Command-Line Interface (CLI) tool written in Python.
2.  A Web Application Frontend built with React.

---

## Command-Line Interface (CLI) Tool

The CLI tool allows users to process Technofino threads directly from their terminal.

### CLI Features

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

### CLI Prerequisites

- Python 3.7+
- A Google Gemini API Key

### CLI Setup

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
    (Ensure `requirements.txt` is up-to-date for the CLI tool.)

4.  **Set your Gemini API Key for the CLI:**
    Create a file named `.env` in the project root directory with the following content:
    ```
    GEMINI_API_KEY='YOUR_API_KEY'
    ```
    Replace `YOUR_API_KEY` with your actual Gemini API key. The CLI application will automatically load this key. Alternatively, if the `.env` file is not found or the key isn't in it, the application will prompt you to enter the key manually.

### CLI Usage

Run the main script (`main.py`) with the Technofino thread URL as an argument:

```bash
python main.py <technofino_thread_url> [options]
```

**Basic Example:**
```bash
python main.py "https://www.technofino.in/community/threads/some-thread.12345/"
```
**Note on URLs**: It's good practice to enclose the URL in quotes. The script will attempt to normalize the URL.

#### CLI Options:

*   `thread_url`: (Positional argument) The URL of the Technofino thread. Required unless `--clear-cache` is used.
*   `--debug`: Enable debug mode.
*   `--output-file <filepath>` or `-o <filepath>`: Save the summary to a file.
*   `--output-format <format>`: Specify output file format (`txt`, `md`). Default: `txt`.
*   `--keywords "<keyword1,keyword2,...>"`: Focus summary on specific keywords.
*   `--no-cache`: Disable using or saving cached content for this run.
*   `--cache-dir <directory_path>`: Specify custom cache directory. Default: `./.cache/technofino_summarizer`.
*   `--cache-expiry <days>`: Set cache expiry (days). Default: 7.
*   `--clear-cache`: Clear all cached data and exit.

**Example with multiple options:**
```bash
python main.py "https://www.technofino.in/community/threads/another-thread.67890/" -o detailed_summary.md --output-format md --keywords "amex,offers" --debug --cache-expiry 1
```

The script will then:
1.  Normalize URL.
2.  Check cache.
3.  Scrape if needed.
4.  Save to cache.
5.  Generate summary using Gemini.
6.  Output summary.
7.  Offer interactive Q&A.

### CLI - How it Works (Brief)

1.  **URL Normalization & Caching**: As described above.
2.  **Scraping (if needed)**: Fetches pages, extracts messages (content & date). Subsequent pages fetched in parallel.
3.  **Summarization & Q&A**: Formats messages, constructs prompts for Gemini (model: `gemini-1.5-flash-latest`), and handles API interaction.

### CLI Sample Outputs

*   **Sample Summary:** An example of the summary output can be found in `summary.md`.
*   **Sample Q&A Session:** An example of an interactive Q&A session can be found in `SAMPLE_QNA.md`.

---

## Web Application Frontend (React)

A user-friendly web interface built with React to perform summarization and Q&A on Technofino threads.

### Web App Overview

The web application allows users to:
*   Authenticate using their Google account.
*   Securely save their personal Gemini API key.
*   Input a Technofino thread URL.
*   View a summary of the thread generated by the Gemini API.
*   Ask follow-up questions about the thread content.

All processing, including scraping and Gemini API calls, happens client-side in the user's browser.

### Web App Features

*   **Authentication:** Google Sign-In for user authentication.
*   **API Key Management:** User-specific Gemini API keys are stored securely in Firestore, linked to their authenticated account.
*   **Client-Side Scraping:** Fetches and parses Technofino thread content directly in the browser.
    *   **Note:** Requires a browser extension to disable CORS for `technofino.in` for this feature to work.
*   **Summarization:** Uses the Gemini API (specifically `gemini-1.5-flash-latest`) to generate thread summaries.
*   **Q&A:** Allows users to ask questions about the summarized thread, with answers generated by the Gemini API.
*   **Responsive UI:** Basic responsive design for usability on different screen sizes.

### Prerequisites for Running Web App

*   **Node.js and npm (or yarn):** For managing project dependencies and running the development server.
*   **Firebase Project:** You'll need your own Firebase project to handle authentication and Firestore storage for API keys.
*   **Personal Gemini API Key:** Each user will need their own Gemini API key to interact with the Gemini models.
*   **CORS Browser Extension:** A browser extension (like "Allow CORS: Access-Control-Allow-Origin" or similar) is **required** to disable Cross-Origin Resource Sharing restrictions when fetching content from `technofino.in`. This is necessary because the scraping happens client-side.

### Firebase Setup (for self-hosting or new development)

If you want to run your own instance of this web application, you'll need to set up Firebase:

1.  **Create Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and follow the on-screen instructions.

2.  **Register Web App in Firebase:**
    *   In your Firebase project, go to Project Overview and click the "Web" icon (`</>`) to add a web app.
    *   Register your app (give it a nickname). You don't need to set up Firebase Hosting at this stage unless you plan to deploy it there.
    *   After registration, Firebase will provide you with a `firebaseConfig` object. Copy this object.

3.  **Enable Google Sign-In:**
    *   In the Firebase Console, go to "Authentication" (under Build).
    *   Navigate to the "Sign-in method" tab.
    *   Click on "Google" in the list of providers, enable it, and select a project support email. Save.

4.  **Set up Firestore Database:**
    *   In the Firebase Console, go to "Firestore Database" (under Build).
    *   Click "Create database".
    *   Choose "Start in **production mode**". Click Next.
    *   Select your Firestore location (choose one close to your users). Click Enable.
    *   **Important: Set Firestore Security Rules:**
        *   Go to the "Rules" tab in Firestore.
        *   Replace the existing rules with the following to allow users to read/write their own API keys:
            ```firestore-rules
            rules_version = '2';
            service cloud.firestore {
              match /databases/{database}/documents {
                // Allow users to read and write only their own API key document
                match /userApiKeys/{userId} {
                  allow read, write: if request.auth != null && request.auth.uid == userId;
                }
              }
            }
            ```
        *   Publish these rules.

5.  **Configure Web App with Firebase Details:**
    *   Take the `firebaseConfig` object you copied in Step 2.
    *   In the cloned repository, navigate to `frontend_webapp/react-app/src/firebaseConfig.js`.
    *   Replace the placeholder `firebaseConfig` object in this file with your own.

### Running the React Web Application

1.  **Clone the Repository:**
    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Navigate to the React App Directory:**
    ```bash
    cd frontend_webapp/react-app
    ```

3.  **Install Dependencies:**
    ```bash
    npm install
    # or if you prefer yarn:
    # yarn install
    ```

4.  **Run the Development Server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```

5.  **Access the Application:**
    *   Open your browser and go to `http://localhost:5173` (or the port specified by Vite in your terminal).

6.  **IMPORTANT - Disable CORS:**
    *   Before using the summarizer, **you must disable CORS restrictions for `technofino.in` in your browser.** Use a browser extension for this.
    *   Search for "Allow CORS" or "CORS Unblock" in your browser's extension store.
    *   Configure the extension to allow requests to `technofino.in`. Without this, the client-side scraping will fail.

Once running, you can sign in with Google, save your Gemini API key, and then use the summarizer and Q&A features.

---

*This README provides setup and usage instructions for both the CLI and Web App components of the Technofino Thread Summarizer.*
