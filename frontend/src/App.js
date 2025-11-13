import React, { useEffect, useState } from 'react';
import { fetchData } from './services/api';

const App = () => {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    async function loadMessage() {
      try {
        const data = await fetchData('/');
        setMessage(data.message || 'Connected to backend successfully!');
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage('⚠️ Failed to connect to backend');
      }
    }

    loadMessage();
  }, []);

  return (
    <div style={{
      fontFamily: 'Poppins, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0a0a0a',
      color: '#00ffcc',
      textAlign: 'center'
    }}>
      <h1>🤖 MyJarvis Frontend</h1>
      <p style={{ fontSize: '1.2rem', marginTop: '10px' }}>
        Backend says: <strong>{message}</strong>
      </p>
    </div>
  );
};

export default App;
