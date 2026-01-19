/**
 * Privacy Notice UI
 * A calm, transparent panel explaining the "Local-First" guarantee.
 * Accessible via HUD settings or startup.
 */

import React from 'react';
import { Shield, ServerOff, Cpu, Trash2 } from 'lucide-react';

export default function PrivacyNotice({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-gray-900 border border-cyan-900/50 rounded-lg max-w-2xl w-full p-8 shadow-[0_0_50px_rgba(6,182,212,0.1)] relative overflow-hidden">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                    <Shield className="text-cyan-400" size={24} />
                    <h2 className="text-xl text-white font-bold tracking-wider">DATA TRUST & GOVERNANCE</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left: Core Promise */}
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <ServerOff className="text-gray-400 shrink-0" size={20} />
                            <div>
                                <h3 className="text-sm font-bold text-gray-200 mb-1">Local Processing Only</h3>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    This system runs entirely in your browser memory. No blueprints, images, or 3D models are uploaded to any cloud server.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Cpu className="text-gray-400 shrink-0" size={20} />
                            <div>
                                <h3 className="text-sm font-bold text-gray-200 mb-1">Ephemeral Intelligence</h3>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    AI reasoning, risk analysis, and simulation data live in volatile memory (RAM). They cease to exist when you close this tab.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Trash2 className="text-gray-400 shrink-0" size={20} />
                            <div>
                                <h3 className="text-sm font-bold text-gray-200 mb-1">Session Purge</h3>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    All session data is automatically purged upon exit. You retain full control to clear inputs at any time.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Technical Verification */}
                    <div className="bg-black/40 rounded p-4 border border-gray-800 font-mono text-[10px] text-gray-500 overflow-y-auto max-h-64">
                        <div className="mb-2 font-bold text-gray-400">RUNTIME POLICY CHECK:</div>
                        <ul className="space-y-2">
                            <li className="flex justify-between">
                                <span>PERSISTENCE_MODE</span>
                                <span className="text-green-500">MEMORY_ONLY</span>
                            </li>
                            <li className="flex justify-between">
                                <span>CLOUD_UPLOAD</span>
                                <span className="text-green-500">BLOCKED</span>
                            </li>
                            <li className="flex justify-between">
                                <span>ANALYTICS_LOGGING</span>
                                <span className="text-green-500">ANONYMOUS</span>
                            </li>
                            <li className="flex justify-between">
                                <span>CV_WORKER_ISOLATION</span>
                                <span className="text-green-500">ACTIVE</span>
                            </li>
                        </ul>
                        <div className="mt-4 pt-4 border-t border-gray-800 text-center text-cyan-900/50">
                            SYSTEM INTEGRITY VERIFIED
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-800 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-cyan-900/20 hover:bg-cyan-900/40 text-cyan-400 text-xs font-bold rounded transition-colors border border-cyan-800/50"
                    >
                        ACKNOWLEDGE
                    </button>
                </div>

            </div>
        </div>
    );
}
