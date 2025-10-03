import React, { useState } from 'react';

const QuestionInput = ({ onAskQuestion, isLoading, isSummarized }) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = () => {
    if (!question.trim()) {
      alert("Please enter a question."); // Placeholder
      return;
    }
    onAskQuestion(question);
    setQuestion(''); // Clear input after asking
  };

  if (!isSummarized) return null; // Only show if a summary has been generated

  return (
    <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h3>Ask a Question about the Thread</h3>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Enter your question"
        disabled={isLoading}
        style={{ width: '70%', marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
      />
      <button onClick={handleSubmit} disabled={isLoading} style={{ padding: '8px 12px'}}>
        {isLoading ? 'Asking...' : 'Ask Question'}
      </button>
    </div>
  );
};
export default QuestionInput;
