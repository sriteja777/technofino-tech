import React, { useState } from 'react';

const SummarizerInput = ({ onSummarize, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    if (!url.trim()) {
      // Optionally, handle empty URL error display here or pass to parent
      alert("Please enter a Technofino Thread URL."); // Placeholder
      return;
    }
    onSummarize(url);
  };

  return (
    <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h3>Enter Technofino Thread URL</h3>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.technofino.in/community/threads/..."
        disabled={isLoading}
        style={{ width: '70%', marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
      />
      <button onClick={handleSubmit} disabled={isLoading} style={{ padding: '8px 12px'}}>
        {isLoading ? 'Summarizing...' : 'Summarize Thread'}
      </button>
    </div>
  );
};
export default SummarizerInput;
