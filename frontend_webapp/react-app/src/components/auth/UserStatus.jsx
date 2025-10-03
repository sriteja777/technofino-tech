import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const UserStatus = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <p>Not logged in. Please sign in.</p>;
  }

  return (
    <div>
      <p>Logged in as: {currentUser.displayName || currentUser.email}</p>
      {currentUser.photoURL && <img src={currentUser.photoURL} alt="User avatar" style={{width: "50px", height: "50px", borderRadius: "50%"}} />}
    </div>
  );
};
export default UserStatus;
