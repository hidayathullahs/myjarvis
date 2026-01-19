/**
 * Global Error Boundary
 * The final safety net for the application.
 * Catches render errors and displays the FallbackUI.
 */

import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import FallbackUI from './FallbackUI';
import { RuntimeConfig } from './runtimeConfig';

const logErrorToService = (error, info) => {
    // In a real app, send to Sentry/LogRocket here
    if (RuntimeConfig.shouldLog('error')) {
        console.error("CRITICAL SYSTEM FAILURE:", error, info);
    }
};

export const GlobalErrorBoundary = ({ children }) => {
    return (
        <ErrorBoundary
            FallbackComponent={FallbackUI}
            onError={logErrorToService}
            onReset={() => {
                // Optional: Reset app state here if needed
                console.log("System re-initializing...");
            }}
        >
            {children}
        </ErrorBoundary>
    );
};
