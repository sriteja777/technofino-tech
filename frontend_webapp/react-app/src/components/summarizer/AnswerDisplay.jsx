import React from 'react';

const AnswerDisplay = ({ qnaPairs }) => { // qnaPairs = [{question: '', answer: ''}]
  if (!qnaPairs || qnaPairs.length === 0) return null;
  return (
    <div style={{ margin: '20px 0', textAlign: 'left' }}>
      <h3>Questions & Answers</h3>
      {qnaPairs.map((item, index) => (
        <div key={index} style={{ marginBottom: '15px', border: '1px solid #eee', padding: '10px', borderRadius: '5px' }}>
          <p style={{fontWeight: 'bold'}}>Q: {item.question}</p>
          <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px', marginTop: '5px' }}>
            {item.answer}
          </pre>
        </div>
      ))}
    </div>
  );
};
export default AnswerDisplay;
