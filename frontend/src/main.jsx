import React from 'react'
console.log("DEBUG: main.jsx is executing...");
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { CollaborationProvider } from './context/CollaborationContext.jsx'
import { GlobalErrorBoundary } from './runtime/GlobalErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GlobalErrorBoundary>
            <CollaborationProvider>
                <App />
            </CollaborationProvider>
        </GlobalErrorBoundary>
    </React.StrictMode>,
)
