import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ApiKeyManager = () => {
  const { currentUser, userApiKey, saveUserApiKey, apiKeyLoading } = useAuth();
  const [inputApiKey, setInputApiKey] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' }); // Message object

  useEffect(() => {
    if (apiKeyLoading) {
      setMessage({ text: 'Loading API key information...', type: 'info' });
    } else if (userApiKey) {
      setInputApiKey(userApiKey);
      // Avoid "API Key loaded" message if it was just saved and input is already disabled
      if (document.activeElement !== document.getElementById('apiKeyInput')) { // Check if not focused
         setMessage({ text: 'API Key loaded.', type: 'success' });
      }
    } else if (currentUser) {
      setInputApiKey('');
      setMessage({ text: 'No API Key saved. Please enter and save.', type: 'info' });
    } else {
        setInputApiKey('');
        setMessage({ text: '', type: '' }); // Clear message if no user
    }
  }, [userApiKey, currentUser, apiKeyLoading]);

  const handleSave = async () => {
    if (!inputApiKey.trim()) {
      setMessage({ text: 'API Key cannot be empty.', type: 'error' });
      return;
    }
    setMessage({ text: 'Saving API key...', type: 'info' });
    try {
      await saveUserApiKey(inputApiKey.trim());
      setMessage({ text: 'API Key saved successfully!', type: 'success' });
      // isEditing state is implicitly handled by userApiKey presence now
    } catch (error) {
      setMessage({ text: 'Error saving API key: ' + error.message, type: 'error' });
    }
  };

  const handleEdit = () => {
    // Allow editing by clearing the input field's disabled status implicitly
    // (though it's more controlled by userApiKey presence)
    // For a better UX, we might need a dedicated isEditing state if disabling is strict
    // but current logic: input is disabled if !isEditing && !!userApiKey
    // The prompt asks for `isEditing` state which was removed in a previous step when simplifying.
    // Let's re-introduce a simple local `isEditing` toggle for clarity of UI mode.
    setInputApiKey(userApiKey || ''); // Keep current key in input or clear if none
    setIsLocalEditing(true);
    setMessage({ text: 'You can now edit your API key.', type: 'info' });
  };

  // Local editing state to control input field enabled/disabled status more directly.
  const [isLocalEditing, setIsLocalEditing] = useState(false);

  useEffect(() => {
    // If an API key is loaded from context, exit local editing mode.
    // If no API key, enter local editing mode.
    if (userApiKey) {
      setIsLocalEditing(false);
    } else if (currentUser) { // Only set to editing if logged in but no key
      setIsLocalEditing(true);
    } else { // Not logged in, not editing
      setIsLocalEditing(false);
    }
  }, [userApiKey, currentUser]);


  if (!currentUser) return null;

  return (
    <div className="api-key-manager" style={{ margin: '20px 0', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
      <h4>Manage Gemini API Key</h4>
      {message.text && (
        <p style={{
          fontSize: '0.9em',
          color: message.type === 'error' ? 'red' : (message.type === 'success' ? 'green' : 'inherit'),
          padding: '5px',
          borderRadius: '3px',
          backgroundColor: message.type === 'error' ? '#ffebee' : (message.type === 'success' ? '#e8f5e9' : 'transparent')
        }}>
          {message.text}
        </p>
      )}
      <input
        id="apiKeyInput" // Added ID for potential focus check
        type="password"
        value={inputApiKey}
        onChange={(e) => setInputApiKey(e.target.value)}
        placeholder="Enter your Gemini API Key"
        disabled={apiKeyLoading || (!isLocalEditing && !!userApiKey)}
        style={{ marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: 'calc(100% - 230px)' }}
      />
      {apiKeyLoading ? <button disabled>Loading...</button> : (
        isLocalEditing || !userApiKey ? (
          <button onClick={handleSave} style={{ padding: '8px 12px'}}>Save API Key</button>
        ) : (
          <button onClick={handleEdit} style={{ padding: '8px 12px'}}>Edit API Key</button>
        )
      )}
    </div>
  );
};
export default ApiKeyManager;
