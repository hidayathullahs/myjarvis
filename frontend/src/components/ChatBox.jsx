import React, { useState } from 'react';
import { sendMessage } from '../services/api';

const ChatBox = () => {
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);

    const handleSend = async () => {
        if (!message) return;
        const res = await sendMessage(message);
        setChat([...chat, { user: message, jarvis: res.response }]);
        setMessage('');
    };

    return (
        <div>
            <div>
                {chat.map((c, i) => (
                    <div key={i}>
                        <b>You:</b> {c.user} <br />
                        <b>Jarvis:</b> {c.jarvis}
                    </div>
                ))}
            </div>
            <input value={message} onChange={e => setMessage(e.target.value)} />
            <button onClick={handleSend}>Send</button>
        </div>
    );
};

export default ChatBox;
