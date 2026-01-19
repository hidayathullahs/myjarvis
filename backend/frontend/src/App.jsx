import React from 'react';
import ChatBox from './components/ChatBox';
import CommandPanel from './components/CommandPanel';
import VoiceControl from './components/VoiceControl';

const App = () => {
    return (
        <div>
            <h1>My Jarvis AI</h1>
            <VoiceControl />
            <ChatBox />
            <CommandPanel />
        </div>
    );
};

export default App;
