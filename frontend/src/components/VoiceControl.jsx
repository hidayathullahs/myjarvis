import React from 'react';

const VoiceControl = () => {
    const startVoice = () => {
        alert('Voice recognition started');
    };

    return (
        <div>
            <h3>Voice Control</h3>
            <button onClick={startVoice}>Start Listening</button>
        </div>
    );
};

export default VoiceControl;
