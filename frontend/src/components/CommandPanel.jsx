import React, { useState } from 'react';

const CommandPanel = () => {
    const [command, setCommand] = useState('');

    const executeCommand = () => {
        alert(`Executed: ${command}`);
        setCommand('');
    };

    return (
        <div>
            <h3>Command Panel</h3>
            <input value={command} onChange={e => setCommand(e.target.value)} />
            <button onClick={executeCommand}>Execute</button>
        </div>
    );
};

export default CommandPanel;
