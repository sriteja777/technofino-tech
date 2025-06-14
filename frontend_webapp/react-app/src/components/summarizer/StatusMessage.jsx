import React from 'react';

const StatusMessage = ({ message, type }) => {
  if (!message) return null;
  const style = {
    padding: '10px',
    margin: '10px 0',
    border: '1px solid',
    borderRadius: '4px',
    color: type === 'error' ? 'red' : (type === 'success' ? 'green' : 'black'),
    borderColor: type === 'error' ? 'red' : (type === 'success' ? 'green' : '#ccc'),
    backgroundColor: type === 'error' ? '#ffebeb' : (type === 'success' ? '#e6ffed' : '#f8f8f8'),
  };
  return <div style={style}>{message}</div>;
};
export default StatusMessage;
