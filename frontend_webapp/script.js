import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// Firebase Configuration (from user)
const firebaseConfig = {
  apiKey: "AIzaSyBmHVUQ7gVnKnzOmEaJ5O66al7Xv6S29RQ",
  authDomain: "technofino-tech.firebaseapp.com",
  projectId: "technofino-tech",
  storageBucket: "technofino-tech.firebasestorage.app",
  messagingSenderId: "509178956937",
  appId: "1:509178956937:web:e0251889470fa3de6eca58",
  measurementId: "G-0KHF1FKV9C"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // if already initialized, use that one
}

const auth = firebase.auth();
const db = firebase.firestore();
window.currentUserApiKey = null; // Global store for current session's API key

document.addEventListener('DOMContentLoaded', () => {
    // --- Get references to HTML elements ---
    const authContainer = document.getElementById('authContainer');
    const signupEmailInput = document.getElementById('signupEmail');
    const signupPasswordInput = document.getElementById('signupPassword');
    const signupButton = document.getElementById('signupButton');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const userStatus = document.getElementById('userStatus');

    const apiKeySection = document.getElementById('apiKeySection');
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyButton = document.getElementById('saveApiKeyButton');
    const editApiKeyButton = document.getElementById('editApiKeyButton');
    const apiKeyStatus = document.getElementById('apiKeyStatus');

    const summarizerSection = document.getElementById('summarizerSection');
    const threadUrlInput = document.getElementById('threadUrl');
    const questionInput = document.getElementById('questionInput');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const askBtn = document.getElementById('askBtn');
    const statusArea = document.getElementById('statusArea');
    const summaryResult = document.getElementById('summaryResult');
    const qnaResult = document.getElementById('qnaResult');

    // --- UI Update Functions ---
    function displaySummary(summaryText) {
        summaryResult.innerHTML = `<p>${summaryText.replace(/\n/g, '<br>')}</p>`;
        summaryResult.style.display = 'block';
    }

    function displayQnaResult(answerText) {
        qnaResult.innerHTML = `<p>${answerText.replace(/\n/g, '<br>')}</p>`;
        qnaResult.style.display = 'block';
    }

    function displayStatus(message, isError = false, isSuccess = false) {
        statusArea.textContent = message;
        statusArea.className = 'status-message';
        if (isError) statusArea.classList.add('error');
        else if (isSuccess) statusArea.classList.add('success');
        else statusArea.classList.add('info');
    }

    function clearOutputs() {
        summaryResult.innerHTML = '<p>Summary will appear here...</p>';
        qnaResult.innerHTML = '<p>Answer will appear here...</p>';
    }

    // --- Firebase Auth & API Key Management ---
    async function saveApiKey() {
        const user = auth.currentUser;
        if (!user) {
            displayStatus("You must be logged in to save an API key.", true);
            return;
        }
        const apiKeyToSave = apiKeyInput.value.trim();
        if (!apiKeyToSave) {
            apiKeyStatus.textContent = "API Key field cannot be empty.";
            displayStatus("API Key field cannot be empty.", true);
            return;
        }
        apiKeyStatus.textContent = "Saving...";
        try {
            await db.collection('userApiKeys').doc(user.uid).set({ geminiApiKey: apiKeyToSave });
            apiKeyStatus.textContent = "API Key saved successfully!";
            apiKeyInput.disabled = true;
            saveApiKeyButton.style.display = 'none';
            editApiKeyButton.style.display = 'inline-block';
            window.currentUserApiKey = apiKeyToSave;
            displayStatus("API Key saved.", false, true);
        } catch (error) {
            console.error("Error saving API key:", error);
            apiKeyStatus.textContent = "Error saving API key.";
            displayStatus("Error saving API key: " + error.message, true);
        }
    }
    saveApiKeyButton.addEventListener('click', saveApiKey);

    editApiKeyButton.addEventListener('click', () => {
        apiKeyInput.disabled = false;
        apiKeyInput.focus();
        saveApiKeyButton.style.display = 'inline-block';
        editApiKeyButton.style.display = 'none';
        apiKeyStatus.textContent = "You can now edit your API key.";
    });

    async function fetchUserApiKey(userId) {
        apiKeyStatus.textContent = "Checking for saved API key...";
        apiKeyInput.disabled = true;
        saveApiKeyButton.style.display = 'none';
        editApiKeyButton.style.display = 'none';
        try {
            const docRef = db.collection('userApiKeys').doc(userId);
            const docSnap = await docRef.get();
            if (docSnap.exists()) {
                const data = docSnap.data();
                apiKeyInput.value = data.geminiApiKey;
                apiKeyStatus.textContent = "API Key loaded.";
                apiKeyInput.disabled = true;
                editApiKeyButton.style.display = 'inline-block';
                window.currentUserApiKey = data.geminiApiKey;
                return data.geminiApiKey;
            } else {
                apiKeyStatus.textContent = "No API Key saved. Please enter and save.";
                apiKeyInput.disabled = false;
                saveApiKeyButton.style.display = 'inline-block';
                window.currentUserApiKey = null;
                return null;
            }
        } catch (error) {
            console.error("Error fetching API key:", error);
            apiKeyStatus.textContent = "Error fetching API key.";
            displayStatus("Error fetching API key: " + error.message, true);
            apiKeyInput.disabled = false;
            saveApiKeyButton.style.display = 'inline-block';
            window.currentUserApiKey = null;
            return null;
        }
    }

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            userStatus.textContent = `Logged in as: ${user.email}`;
            authContainer.style.display = 'none';
            logoutButton.style.display = 'block';
            apiKeySection.style.display = 'block';
            summarizerSection.style.display = 'block';
            displayStatus("Logged in. Fetching API key...", false, false);
            await fetchUserApiKey(user.uid);
        } else {
            userStatus.textContent = "Not logged in. Please sign up or log in.";
            authContainer.style.display = 'block';
            logoutButton.style.display = 'none';
            apiKeySection.style.display = 'none';
            summarizerSection.style.display = 'none';
            apiKeyInput.value = '';
            apiKeyStatus.textContent = "";
            apiKeyInput.disabled = false;
            saveApiKeyButton.style.display = 'inline-block';
            editApiKeyButton.style.display = 'none';
            window.currentUserApiKey = null;
            threadUrlInput.value = '';
            questionInput.value = '';
            clearOutputs();
            window.scrapedMessages = null;
            displayStatus("Please log in to use the summarizer.", false, false);
        }
    });

    signupButton.addEventListener('click', () => { /* ... same as before ... */
        const email = signupEmailInput.value;
        const password = signupPasswordInput.value;
        if (!email || !password) {
            displayStatus("Please enter email and password to sign up.", true); return;
        }
        auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                displayStatus("Signed up successfully! You are now logged in.", false, true);
                signupEmailInput.value = ''; signupPasswordInput.value = '';
            })
            .catch(error => displayStatus("Signup error: " + error.message, true));
    });
    loginButton.addEventListener('click', () => { /* ... same as before ... */
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        if (!email || !password) {
            displayStatus("Please enter email and password to log in.", true); return;
        }
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                displayStatus("Logged in successfully!", false, true);
                loginEmailInput.value = ''; loginPasswordInput.value = '';
            })
            .catch(error => displayStatus("Login error: " + error.message, true));
    });
    logoutButton.addEventListener('click', () => { /* ... same as before ... */
        auth.signOut()
            .then(() => displayStatus("Logged out successfully.", false, true))
            .catch(error => displayStatus("Logout error: " + error.message, true));
    });

    // --- Scraping Function ---
    async function scrapeTechnofinoThread(threadUrl) { /* ... same as before ... */
        displayStatus("Scraping thread...");
        let allMessages = [];
        try {
            if (!threadUrl.includes('technofino.in/community/threads/')) {
                displayStatus("Invalid Technofino thread URL. Ensure it's a valid thread link.", true); return null;
            }
            const urlObject = new URL(threadUrl);
            const baseUrl = `${urlObject.protocol}//${urlObject.host}${urlObject.pathname}`;
            const response = await fetch(baseUrl);
            if (!response.ok) {
                displayStatus(`Error fetching thread (page 1): Server responded with ${response.status}. This might be a private thread or an invalid URL.`, true); return null;
            }
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            if (doc.querySelector('.p-body-inner .blockMessage--error') || doc.title.includes("Oops! We ran into some problems.") || doc.title.includes("Error")) {
                 displayStatus("Error: This thread may require login on Technofino, is invalid, or is private.", true); return null;
            }
            const messagesOnPage = extractMessagesFromDoc(doc);
            allMessages.push(...messagesOnPage);
            let totalPages = 1;
            const pageNav = doc.querySelector('.pageNav-main');
            if (pageNav) {
                const pageLinks = pageNav.querySelectorAll('li.pageNav-page a');
                if (pageLinks.length > 0) totalPages = parseInt(pageLinks[pageLinks.length - 1].textContent.trim(), 10);
            }
            if (totalPages > 1) {
                displayStatus(`Scraping page 1 of ${totalPages}...`);
                const pagePromises = [];
                for (let i = 2; i <= totalPages; i++) pagePromises.push(fetchAndParsePage(`${baseUrl}page-${i}`, i, totalPages));
                const results = await Promise.all(pagePromises);
                results.forEach(messages => { if (messages) allMessages.push(...messages); });
            }
            if (allMessages.length === 0) {
                displayStatus("No messages found. The thread might be empty or the page structure is different than expected.", true); return null;
            }
            displayStatus(`Scraping complete! Found ${allMessages.length} messages.`, false, true);
            return allMessages;
        } catch (error) {
            console.error("Error scraping Technofino thread:", error);
            displayStatus(`Scraping error: ${error.message}. Check browser console for CORS issues if fetching directly. Using a backend proxy is recommended.`, true); return null;
        }
    }
    function extractMessagesFromDoc(doc) { /* ... (same as before) ... */
        const messages = [];
        const messageArticles = doc.querySelectorAll('article.message');
        messageArticles.forEach(article => {
            const messageContentEl = article.querySelector('.message-content .bbWrapper');
            const timeEl = article.querySelector('time.u-dt');
            const userEl = article.querySelector('.message-user .username');
            if (messageContentEl && timeEl) {
                const date = timeEl.getAttribute('datetime') || timeEl.textContent.trim();
                let content = '';
                messageContentEl.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) content += node.textContent;
                    else if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'BR') content += '\n';
                        else content += node.textContent;
                    }
                });
                content = content.trim();
                const username = userEl ? userEl.textContent.trim() : 'Unknown User';
                if (content) messages.push({ user: username, date: date, content: content });
            }
        });
        return messages;
    }
    async function fetchAndParsePage(pageUrl, currentPage, totalPages) { /* ... (same as before) ... */
        try {
            displayStatus(`Scraping page ${currentPage} of ${totalPages}...`);
            const response = await fetch(pageUrl);
            if (!response.ok) { console.warn(`Failed to fetch page ${currentPage}: ${response.status}`); return []; }
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            return extractMessagesFromDoc(doc);
        } catch (error) { console.warn(`Error fetching/parsing page ${currentPage}: ${error.message}`); return []; }
     }

    // --- Gemini API Functions ---
    async function summarizeTextWithGemini(textToSummarize, apiKey) {
        if (!apiKey) {
            console.error("API Key for Gemini is missing.");
            displayStatus("Gemini API Key is missing. Please save it first.", true);
            return null;
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // or gemini-1.5-flash

        const currentDateStr = new Date().toISOString().split('T')[0];
        const prompt = `Please summarize the following forum discussion thread. Each message includes its posting date. The current date is ${currentDateStr}. Consider the dates of the messages to identify the most current information and highlight if some points are outdated. Extract the key points, main questions, and any conclusions or consensus reached by the users, noting the recency of information. The thread is from Technofino:

${textToSummarize}

Summary:`;

        try {
            displayStatus("Generating summary with Gemini...");
            const result = await model.generateContent(prompt);
            const response = result.response;
            const summaryText = await response.text();
            displayStatus("Summary generated successfully!", false, true);
            return summaryText;
        } catch (error) {
            console.error("Error summarizing with Gemini:", error);
            displayStatus("Error generating summary: " + error.message, true);
            return null;
        }
    }

    async function answerQuestionWithGemini(threadMessages, question, apiKey) {
        if (!apiKey) {
            console.error("API Key for Gemini is missing.");
            displayStatus("Gemini API Key is missing. Please save it first.", true);
            return null;
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // or gemini-1.5-flash

        const currentDateStr = new Date().toISOString().split('T')[0];
        const prompt = `Current date: ${currentDateStr}.

Consider the posting dates of the messages when answering. More recent information is generally more relevant. If the information might be outdated, please say so.

Context from the thread (includes message dates):
${threadMessages}

Based on the above, please answer the question: "${question}". If the answer is not found in the provided messages, say so. If the question is subjective or opinion-based, acknowledge that.`;

        try {
            displayStatus("Generating answer with Gemini...");
            const result = await model.generateContent(prompt);
            const response = result.response;
            const answerText = await response.text();
            displayStatus("Answer generated successfully!", false, true);
            return answerText;
        } catch (error) {
            console.error("Error answering question with Gemini:", error);
            displayStatus("Error generating answer: " + error.message, true);
            return null;
        }
    }

    // --- Summarizer/Q&A Event Listeners ---
    summarizeBtn.addEventListener('click', async () => {
        const threadUrl = threadUrlInput.value.trim();
        if (!auth.currentUser) { displayStatus('Please log in to use the summarizer.', true); return; }
        if (!window.currentUserApiKey) { displayStatus("API Key is missing. Please save your API key first in 'Manage API Key' section.", true); return; }
        if (!threadUrl) { displayStatus('Please enter the Technofino Thread URL.', true); return; }

        clearOutputs();
        displayStatus("Starting summarization process...");

        try {
            const messages = await scrapeTechnofinoThread(threadUrl);
            if (!messages || messages.length === 0) {
                if (!statusArea.textContent.includes("Error") && !statusArea.textContent.includes("No messages")) {
                    // The scraping function should have already set an appropriate error status.
                    // If not, set a generic one.
                    displayStatus('No messages were scraped, or scraping failed. Cannot summarize.', true);
                }
                return;
            }

            let formattedMessagesText = "";
            if (window.scrapedMessages && window.scrapedMessages.length > 0) { // Re-check window.scrapedMessages as it's populated by scrape function
                formattedMessagesText = window.scrapedMessages.map(msg => `Date: ${msg.date || 'Unknown date'}\nUser: ${msg.user || 'Unknown user'}\nMessage: ${msg.content}`).join('\n\n---\n\n');
            } else { // Fallback if window.scrapedMessages wasn't set correctly, though scrapeTechnofinoThread should return the messages.
                 formattedMessagesText = messages.map(msg => `Date: ${msg.date || 'Unknown date'}\nUser: ${msg.user || 'Unknown user'}\nMessage: ${msg.content}`).join('\n\n---\n\n');
            }

            if (!formattedMessagesText) {
                displayStatus("Failed to format messages for summarization.", true);
                return;
            }

            const summary = await summarizeTextWithGemini(formattedMessagesText, window.currentUserApiKey);
            if (summary) {
                displaySummary(summary);
            } else {
                // summarizeTextWithGemini handles its own error display, but we can add a fallback.
                if (!statusArea.textContent.includes("Error")) {
                    displayStatus("Failed to generate summary.", true);
                }
            }
        } catch (error) {
            console.error("Error in summarization process:", error);
            displayStatus(`An unexpected error occurred during summarization: ${error.message}`, true);
        }
    });

    askBtn.addEventListener('click', async () => {
        const userQuestion = questionInput.value.trim();
        if (!auth.currentUser) { displayStatus('Please log in to ask questions.', true); return; }
        if (!window.currentUserApiKey) { displayStatus("API Key is missing. Please save your API key first.", true); return; }
        if (!userQuestion) { displayStatus('Please enter a question.', true); return; }

        if (!window.scrapedMessages || window.scrapedMessages.length === 0) {
            displayStatus('Please summarize a thread first before asking questions (scraped content is needed for context).', true); return;
        }

        displayStatus("Preparing to answer question...");
        qnaResult.innerHTML = '<p>Answer will appear here...</p>';

        let formattedMessagesText = window.scrapedMessages.map(msg => `Date: ${msg.date || 'Unknown date'}\nUser: ${msg.user || 'Unknown user'}\nMessage: ${msg.content}`).join('\n\n---\n\n');

        const answer = await answerQuestionWithGemini(formattedMessagesText, userQuestion, window.currentUserApiKey);
        if (answer) {
            displayQnaResult(answer);
        } else {
             if (!statusArea.textContent.includes("Error")) {
                displayStatus("Failed to get an answer.", true);
            }
        }
    });
});
