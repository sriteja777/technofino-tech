import React, { useState, useEffect } from 'react'; // Added useEffect
import { useAuth } from './contexts/AuthContext';
import GoogleSignInButton from './components/auth/GoogleSignInButton';
import LogoutButton from './components/auth/LogoutButton';
import UserStatus from './components/auth/UserStatus';
import ApiKeyManager from './components/ApiKeyManager';

// Summarizer components
import StatusMessage from './components/summarizer/StatusMessage';
import SummarizerInput from './components/summarizer/SummarizerInput';
import SummaryDisplay from './components/summarizer/SummaryDisplay';
import QuestionInput from './components/summarizer/QuestionInput';
import AnswerDisplay from './components/summarizer/AnswerDisplay';

// Services
import { scrapeTechnofinoThread } from './services/scraperService';
import { generateGeminiSummary, getGeminiAnswer } from './services/geminiService';
import './App.css';

function App() {
  const { currentUser, userApiKey, authLoading, apiKeyLoading } = useAuth();

  const [status, setStatus] = useState({ message: '', type: 'info' }); // Default type info
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [qnaPairs, setQnaPairs] = useState([]);
  const [isSummarized, setIsSummarized] = useState(false);
  const [scrapedMessagesContent, setScrapedMessagesContent] = useState(null);

  // Effect to clear summarizer state if user or API key changes (e.g., logout, API key removed)
  useEffect(() => {
    if (!currentUser || !userApiKey) {
      setSummary('');
      setQnaPairs([]);
      setIsSummarized(false);
      setScrapedMessagesContent(null);
      // Optionally set a status message if relevant, e.g. after logout
      // if (!currentUser) setStatus({ message: 'Logged out. Summarizer data cleared.', type: 'info' });
      // else if (!userApiKey) setStatus({ message: 'API key removed/unavailable. Summarizer data cleared.', type: 'info' });
    }
  }, [currentUser, userApiKey]);


  const handleSummarize = async (url) => {
    if (!url || !url.trim()) { // Basic URL validation
        setStatus({ message: "Please enter a valid Technofino Thread URL.", type: 'error' });
        return;
    }
    if (!userApiKey) {
      setStatus({ message: "Please ensure your API key is saved and valid.", type: 'error' });
      return;
    }

    setIsLoading(true);
    // Clear previous results for a new summarization task
    setSummary('');
    setQnaPairs([]);
    setIsSummarized(false);
    setScrapedMessagesContent(null);
    setStatus({ message: 'Starting summarization process...', type: 'info' });

    const messages = await scrapeTechnofinoThread(url, setStatus);

    if (messages && messages.length > 0) {
      setScrapedMessagesContent(messages);
      const generatedSummary = await generateGeminiSummary(messages, userApiKey, setStatus);
      if (generatedSummary) {
        setSummary(generatedSummary);
        setIsSummarized(true);
      }
      // generateGeminiSummary handles its own success/error/warning status messages
    } else if (messages && messages.length === 0) {
      // scraperService sets status like "No messages found..."
      // No need to set it again here unless for a different message
    } else {
      // scraperService sets status for scraping failure
      // If status is not already error, set a generic one (should be rare)
      if(status.type !== 'error' && status.type !== 'warning') {
        setStatus({ message: "Failed to scrape thread or thread was empty.", type: 'error' });
      }
    }
    setIsLoading(false);
  };

  const handleAskQuestion = async (question) => {
    if (!question || !question.trim()) { // Basic question validation
        setStatus({ message: "Please enter a question to ask.", type: 'error' });
        return;
    }
    if (!userApiKey) {
      setStatus({ message: "API key is missing. Cannot ask question.", type: 'error' });
      return;
    }
    if (!scrapedMessagesContent || scrapedMessagesContent.length === 0) {
      setStatus({ message: "No thread content available to ask questions. Please summarize a thread first.", type: 'error'});
      return;
    }

    setIsLoading(true);
    // setStatus will be handled by getGeminiAnswer, which is good.
    // Optionally, set an initial "Asking..." message here if getGeminiAnswer's first status update is delayed.
    // setStatus({ message: `Asking: "${question}"...`, type: 'info' });

    const newAnswer = await getGeminiAnswer(scrapedMessagesContent, question, userApiKey, setStatus);
    if (newAnswer) {
      setQnaPairs(prevPairs => [...prevPairs, { question, answer: newAnswer }]);
    }
    // If newAnswer is null, getGeminiAnswer has already set an appropriate error/warning status.
    setIsLoading(false);
  };

  if (authLoading || (currentUser && apiKeyLoading)) {
    return <div style={{textAlign: 'center', padding: '50px', fontSize: '1.2em'}}>Loading application data...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Technofino Thread Summarizer (React)</h1>
        <div className="auth-controls"> {/* Added wrapper for better flex layout */}
            <UserStatus />
            {!currentUser && <GoogleSignInButton />}
            <LogoutButton />
        </div>
      </header>

      <StatusMessage message={status.message} type={status.type} />

      {currentUser ? (
        <div className="content-area">
          <ApiKeyManager />
          {userApiKey ? (
            <main>
              <div className="summarizer-input-container"> {/* Added wrapper class */}
                <SummarizerInput onSummarize={handleSummarize} isLoading={isLoading} />
              </div>
              {summary && <div className="summary-display-container"><SummaryDisplay summary={summary} /></div>}
              {isSummarized && ( /* Only show Q&A section if summarization happened */
                <>
                  <div className="question-input-container"><QuestionInput onAskQuestion={handleAskQuestion} isLoading={isLoading} isSummarized={isSummarized} /></div>
                  {qnaPairs.length > 0 && <div className="answer-display-container"><AnswerDisplay qnaPairs={qnaPairs} /></div>}
                </>
              )}
            </main>
          ) : (
            <p className="login-prompt" style={{marginTop: '20px', fontWeight: 'bold'}}>Please save your Gemini API Key above to use the summarizer features.</p>
          )}
        </div>
      ) : (
        <p className="login-prompt" style={{marginTop: '20px', textAlign: 'center'}}>Please sign in to use the application.</p>
      )}
    </div>
  );
}
export default App;
