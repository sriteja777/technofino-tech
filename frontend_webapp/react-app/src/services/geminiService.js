// src/services/geminiService.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

/**
 * Formats an array of message objects into a single string for prompts.
 * @param {Array} messages - Array of message objects ({ user, date, content }).
 * @returns {string} A single string with all messages formatted.
 */
const formatMessagesForPrompt = (messages) => {
  if (!messages || messages.length === 0) {
    return "No messages available to format."; // More descriptive for debugging
  }
  return messages.map(msg =>
    `Date: ${msg.date || 'Unknown date'}
User: ${msg.user || 'Unknown user'}
Message: ${msg.content}`
  ).join('\n\n---\n\n');
};

// Configuration for safety settings (adjust as needed)
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * Generates a summary using the Gemini API.
 * @param {Array} messages - Array of scraped message objects.
 * @param {string} apiKey - The user's Gemini API key.
 * @param {Function} setStatus - Callback to update UI status.
 * @returns {Promise<string|null>} The summary text or null on error.
 */
export const generateGeminiSummary = async (messages, apiKey, setStatus) => {
  if (!apiKey) {
    setStatus({ message: "API Key is missing. Please save your API key.", type: 'error' });
    return null;
  }
  if (!messages || messages.length === 0) {
    setStatus({ message: "No messages provided for summarization.", type: 'error' });
    return null;
  }

  setStatus({ message: "Initializing Gemini for summarization...", type: 'info' });
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", safetySettings });

    const formattedText = formatMessagesForPrompt(messages);
    if (formattedText === "No messages available to format.") {
        setStatus({ message: "Internal error: Formatted messages are empty.", type: 'error' });
        return null;
    }
    const currentDateStr = new Date().toISOString().split('T')[0];

    const prompt = `Current date is ${currentDateStr}. You are a helpful assistant tasked with summarizing a discussion thread from the Technofino forums. The thread content is provided below, with each post including its original posting date and user.
    Your summary should be comprehensive, well-organized, and highlight the key topics, main questions asked, significant opinions or experiences shared, and any conclusions or consensus reached by the users.
    Pay close attention to the dates of the messages to identify the most current and relevant information. If there are conflicting viewpoints or if information appears outdated due to later posts, please note this.
    The summary should be easy to read and provide a clear understanding of what the thread was about. Avoid direct copying of messages; instead, synthesize the information.

    Thread Content:
    ${formattedText}

    Please provide your summary:`;

    setStatus({ message: "Generating summary with Gemini... This may take a moment.", type: 'info' });
    const result = await model.generateContent(prompt);
    const response = result.response;

    if (response.promptFeedback && response.promptFeedback.blockReason) {
        setStatus({ message: `Summary generation blocked. Reason: ${response.promptFeedback.blockReason}. This might be due to safety settings or the nature of the content.`, type: 'error' });
        return null;
    }

    if (response && typeof response.text === 'function') {
        const summaryText = await response.text();
        if (summaryText && summaryText.trim() !== "") {
            setStatus({ message: "Summary generated successfully!", type: 'success' });
            return summaryText;
        } else {
            setStatus({ message: "Gemini returned an empty summary. The content might not be suitable for summarization or may have been filtered.", type: 'warning' });
            return "Gemini returned an empty response for the summary.";
        }
    } else {
        setStatus({ message: "Invalid response structure from Gemini API.", type: 'error' });
        return null;
    }
  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    let errorMessage = "An error occurred while generating the summary.";
    if (error.message) {
        errorMessage += ` Details: ${error.message}`;
    }
    if (error.toString().includes("API_KEY_INVALID") || error.message.toLowerCase().includes("api key not valid")) {
        errorMessage = "The provided Gemini API Key is invalid or has insufficient permissions. Please check your API key and ensure it's correctly entered.";
    } else if (error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("rate limit")) {
        errorMessage = "API quota exceeded or rate limit reached. Please try again later or check your API usage limits.";
    } else if (error.message.toLowerCase().includes("model not found")) {
        errorMessage = "The specified Gemini model could not be found. Please contact support.";
    }
    setStatus({ message: errorMessage, type: 'error' });
    return null;
  }
};

export const getGeminiAnswer = async (messages, question, apiKey, setStatus) => {
  if (!apiKey) {
    setStatus({ message: "API Key is missing. Please save your API key.", type: 'error' });
    return null;
  }
  if (!messages || messages.length === 0) {
    setStatus({ message: "No thread messages available to answer the question.", type: 'error' });
    return null;
  }
  if (!question || !question.trim()) {
    setStatus({ message: "Question cannot be empty.", type: 'error' });
    return null;
  }

  setStatus({ message: "Initializing Gemini for Q&A...", type: 'info' });
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", safetySettings });

    const formattedText = formatMessagesForPrompt(messages);
    if (formattedText === "No messages available to format.") {
        setStatus({ message: "Internal error: Formatted messages are empty for Q&A.", type: 'error' });
        return null;
    }
    const currentDateStr = new Date().toISOString().split('T')[0];

    const prompt = `Current date is ${currentDateStr}. You are a helpful assistant. Based on the following Technofino forum thread content (which includes message dates and users), please answer the user's question.
    When answering, consider the posting dates of the messages; more recent information is generally more relevant. If the information to answer the question might be outdated due to newer posts, please say so. If the answer is not found in the provided messages, explicitly state that.

    Thread Content:
    ${formattedText}

    User's Question: "${question}"

    Please provide your answer:`;

    setStatus({ message: `Asking Gemini: "${question}"... This may take a moment.`, type: 'info' });
    const result = await model.generateContent(prompt);
    const response = result.response;

    if (response.promptFeedback && response.promptFeedback.blockReason) {
        setStatus({ message: `Q&A generation blocked. Reason: ${response.promptFeedback.blockReason}. This might be due to safety settings or the nature of the content/question.`, type: 'error' });
        return null;
    }

     if (response && typeof response.text === 'function') {
        const answerText = await response.text();
        if (answerText && answerText.trim() !== "") {
            setStatus({ message: "Answer received from Gemini.", type: 'success' });
            return answerText;
        } else {
            setStatus({ message: "Gemini returned an empty answer. The question might not be answerable from the context or may have been filtered.", type: 'warning' });
            return "Gemini returned an empty response for the question.";
        }
    } else {
        setStatus({ message: "Invalid response structure from Gemini for Q&A.", type: 'error' });
        return null;
    }
  } catch (error) {
    console.error("Error getting answer from Gemini:", error);
    let errorMessage = "An error occurred while generating the answer.";
    if (error.message) {
        errorMessage += ` Details: ${error.message}`;
    }
    if (error.toString().includes("API_KEY_INVALID") || error.message.toLowerCase().includes("api key not valid")) {
        errorMessage = "The provided Gemini API Key is invalid or has insufficient permissions. Please check your API key and ensure it's correctly entered.";
    } else if (error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("rate limit")) {
        errorMessage = "API quota exceeded or rate limit reached. Please try again later or check your API usage limits.";
    } else if (error.message.toLowerCase().includes("model not found")) {
        errorMessage = "The specified Gemini model could not be found. Please contact support.";
    }
    setStatus({ message: errorMessage, type: 'error' });
    return null;
  }
};
