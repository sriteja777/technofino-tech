import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const GoogleSignInButton = () => {
  const { googleSignIn } = useAuth();

  const handleSignIn = async () => {
    try {
      await googleSignIn();
      // Optionally display a success message or handle redirect
      console.log("Signed in with Google successfully!");
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Optionally display an error message
    }
  };

  return <button onClick={handleSignIn}>Sign in with Google</button>;
};
export default GoogleSignInButton;
