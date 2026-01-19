/**
 * Fallback UI
 * A calm, neutral screen displayed when a critical error occurs.
 * Prevents white-screen of death.
 */

import React from 'react';

export default function FallbackUI({ error, resetErrorBoundary }) {
    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 z-[99999] text-center font-sans">
            <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-2xl relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-900 to-transparent"></div>

                <h2 className="text-xl text-gray-200 font-bold mb-2 tracking-wide">System Notice</h2>

                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                    Part of the system became temporarily unavailable.<br />
                    Your session data is safe.
                </p>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={resetErrorBoundary}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-cyan-400 text-xs font-bold rounded transition-colors border border-gray-700 uppercase tracking-wider"
                    >
                        Re-Initialize
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-transparent hover:bg-gray-800 text-gray-400 text-xs font-bold rounded transition-colors border border-gray-700 uppercase tracking-wider"
                    >
                        Reload App
                    </button>
                </div>

                {/* Only show technical details if NOT in production (or hidden check) */}
                {process.env.NODE_ENV !== 'production' && error && (
                    <div className="mt-8 text-left bg-black/50 p-2 rounded border border-red-900/30 overflow-auto max-h-32">
                        <p className="text-[10px] text-red-500 font-mono break-all">
                            {error.toString()}
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-8 text-[10px] text-gray-600 font-mono">
                SYSTEM ID: HAL-9000-SAFE-MODE
            </div>
        </div>
    );
}
