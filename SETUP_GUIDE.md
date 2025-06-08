# Easy Setup Guide for the Technofino Thread Summarizer

Hello! This guide will help you get the Technofino Thread Summarizer tool running on your computer, even if you're not a tech expert. We'll go step-by-step.

## What You're Setting Up

This tool is a small computer program that helps you read and understand long discussion threads from the Technofino website. It uses Artificial Intelligence (AI) to summarize threads and answer your questions about them.

## Step 1: Do You Have Python?

This program is written in a language called Python. Think of Python as a special language that computers understand. Many computers already have Python installed.

**How to check (for Windows, Mac, or Linux):**

1.  **Open your computer's "command prompt" or "terminal":**
    *   **Windows:** Search for "cmd" or "Command Prompt" in your Start Menu.
    *   **Mac:** Search for "Terminal" in Spotlight (the magnifying glass icon in the top right).
    *   **Linux:** Usually `Ctrl+Alt+T` opens the Terminal, or find it in your applications menu.

2.  **Type this command and press Enter:**
    ```
    python --version
    ```
    Or, if that doesn't work, try:
    ```
    python3 --version
    ```

3.  **What you might see:**
    *   If you see something like `Python 3.7.9` or `Python 3.10.2` (any version starting with `3.7` or higher is great!), you're all set for this step! You can skip to **Step 2**.
    *   If you see a version starting with `2` (like `Python 2.7.1`), or get an error message like "command not found," you'll need to install Python.

**How to install Python (if you need to):**

1.  Go to the official Python website: [https://www.python.org/downloads/](https://www.python.org/downloads/)
2.  The website should automatically suggest the best version for your computer (Windows, Mac, etc.). Click the download button.
3.  Run the installer you downloaded.
    *   **Important for Windows users:** On the first screen of the installer, make sure to check the box that says **"Add Python to PATH"** or **"Add python.exe to PATH"** before clicking "Install Now." This is very helpful!
4.  Once installed, close and reopen your command prompt/terminal and try `python --version` or `python3 --version` again to make sure it worked.

## Step 2: Get the Tool's Files

These are the files that make the Technofino Thread Summarizer work.

1.  Go to the project's GitHub page: [https://github.com/sriteja777/technofino-tech](https://github.com/sriteja777/technofino-tech)
2.  Click the green **"< > Code"** button.
3.  In the dropdown menu, click **"Download ZIP"**.
4.  Save the ZIP file to your computer (e.g., your Downloads folder or Desktop).
5.  **Unzip the file:** Find the downloaded ZIP file (it will likely be named `technofino-tech-main.zip` or similar) and extract its contents. You can usually do this by right-clicking on the file and selecting "Extract All..." or "Unzip." This will create a folder, probably called `technofino-tech-main`.

## Step 3: Open the Tool's Folder in Your Command Prompt/Terminal

Now you need to tell your command prompt/terminal to look inside the folder you just unzipped.

1.  Open your command prompt or terminal (if it's not still open from Step 1).
2.  Type `cd` (which means "change directory"), followed by a space.
3.  Now, the easiest way to get the folder path is to **drag the `technofino-tech-main` folder directly from your file explorer window into the command prompt/terminal window.** It should paste the full path to the folder.
    *   It might look something like this on Windows: `cd C:\Users\YourName\Downloads\technofino-tech-main`
    *   Or like this on Mac/Linux: `cd /Users/YourName/Downloads/technofino-tech-main`
4.  Press Enter. Your command prompt should now show that it's "inside" that folder.

## Step 4: Set Up a "Virtual Environment" (Recommended)

This sounds technical, but it's like giving the tool its own clean workspace on your computer so it doesn't mess with other Python stuff you might have.

1.  In your command prompt/terminal (make sure you're still in the `technofino-tech-main` folder), type this command and press Enter:
    *   On Mac/Linux: `python3 -m venv venv`
    *   On Windows: `python -m venv venv`
    (This creates a folder named `venv` inside your project folder.)

2.  Now, you need to "activate" this environment. The command is slightly different for Windows vs. Mac/Linux:
    *   **Windows:**
        ```
        venv\Scripts\activate
        ```
    *   **Mac/Linux:**
        ```
        source venv/bin/activate
        ```
    After you press Enter, you should see `(venv)` at the beginning of your command prompt line. This means the virtual environment is active!

## Step 5: Install the Required Tools (Dependencies)

Our summarizer tool needs a few extra helper tools to work correctly. These are listed in a file called `requirements.txt`.

1.  Make sure your virtual environment is still active (you see `(venv)` in the prompt).
2.  In your command prompt/terminal, type this command and press Enter:
    ```
    pip install -r requirements.txt
    ```
    `pip` is Python's tool for installing packages. This command tells it to read `requirements.txt` and install everything listed.
You'll see some text scroll by as it downloads and installs the tools. Wait for it to finish.

## Step 6: Add Your Google Gemini API Key

The tool uses Google's AI (called Gemini) to do the summarizing and Q&A. To use it, you need a special password called an API Key.

1.  **Get a Gemini API Key:**
    *   You'll need to go to Google's AI Studio website: [https://aistudio.google.com/](https://aistudio.google.com/)
    *   You might need to sign in with your Google account.
    *   Look for an option like "Get API key" or "Create API key." Follow the instructions there to generate your key. It will be a long string of letters and numbers.
    *   **Keep this key secret and safe!** Don't share it publicly.

2.  **Create a special file for your API Key:**
    *   In the `technofino-tech-main` folder (the same folder where `main.py` and `README.md` are), you need to create a new plain text file named exactly `.env` (yes, it starts with a dot!).
    *   You can use a simple text editor like Notepad (Windows) or TextEdit (Mac - make sure it's in plain text mode: Format > Make Plain Text).
    *   Open this new `.env` file and type the following, replacing `YOUR_API_KEY_HERE` with the actual API key you got from Google:
        ```
        GEMINI_API_KEY='YOUR_API_KEY_HERE'
        ```
        For example, if your key was `Abc123XYZ789`, it would look like:
        ```
        GEMINI_API_KEY='Abc123XYZ789'
        ```
    *   Save and close the `.env` file.

## Step 7: Run the Technofino Thread Summarizer!

You're all set! Now you can run the tool.

1.  Make sure your virtual environment is still active (you see `(venv)` in the prompt) and you are in the `technofino-tech-main` directory in your command prompt/terminal.
2.  To run the script, you'll type `python main.py` (or `python3 main.py` on some systems) followed by the URL of the Technofino thread you want to summarize, enclosed in quotes.

    **Example:**
    Let's say you want to summarize the thread found at the URL `https://www.technofino.in/community/threads/technofino-ai-thread-summarizer-and-your-companion-for-asking-questions.41511/`. You would type:
    ```
    python main.py "https://www.technofino.in/community/threads/technofino-ai-thread-summarizer-and-your-companion-for-asking-questions.41511/"
    ```
    Then press Enter.

    If you are on a Mac or some Linux systems, you might need to type `python3` instead of `python`:
    ```
    python3 main.py "https://www.technofino.in/community/threads/technofino-ai-thread-summarizer-and-your-companion-for-asking-questions.41511/"
    ```
    Replace the example URL with the actual Technofino thread URL you're interested in.

3.  Press Enter. The tool will start working! It will scrape the messages, then give you a summary, and then ask if you want to start a Q&A session.

## When You're Done

When you want to close the virtual environment, just type this in the command prompt/terminal:
```
deactivate
```
And press Enter. The `(venv)` at the start of your prompt line will disappear.

Next time you want to use the tool, you'll need to:
1. Open your command prompt/terminal.
2. Navigate to the `technofino-tech-main` folder (`cd path/to/your/folder`).
3. Activate the virtual environment (`venv\Scripts\activate` for Windows, or `source venv/bin/activate` for Mac/Linux).
4. Run the script (`python main.py "URL"`).

That's it! Hopefully, this guide helps you get started. If you run into any issues, you can refer to the main `README.md` file in the project folder for more technical details.
