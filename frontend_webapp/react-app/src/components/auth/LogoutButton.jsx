import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LogoutButton = () => {
  const { appSignOut, currentUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await appSignOut();
      console.log("Signed out successfully!");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!currentUser) return null; // Don't show if not logged in

  return <button onClick={handleSignOut}>Logout</button>;
};
export default LogoutButton;
