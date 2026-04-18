
import React, { useState } from 'react';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';

const App = () => {
  const [username, setUsername] = useState('');

  const handleLogin = (loggedInUsername) => {
    setUsername(loggedInUsername);
  };

  const handleLogout = () => {
    setUsername('');
  };

  return (
    <>
      {username ? (
        <MainScreen username={username} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </>
  );
};

export default App;
