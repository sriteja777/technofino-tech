import React from 'react';

const SummaryDisplay = ({ summary }) => {
  if (!summary) return null;
  return (
    <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #eee', borderRadius: '5px', textAlign: 'left' }}>
      <h3>Summary</h3>
      <pre style={{ whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
        {summary}
      </pre>
    </div>
  );
};
export default SummaryDisplay;
