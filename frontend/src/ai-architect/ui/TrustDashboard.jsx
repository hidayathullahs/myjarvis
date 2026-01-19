import React from 'react';
import { Shield, Activity, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';

/**
 * TrustDashboard
 * Visualizes AI confidence, risk levels, and operational transparency.
 */
export function TrustDashboard({ confidence, risk, repairs, onUndoRepair }) {
    const riskColor = risk === 'HIGH' ? 'text-red-500' : risk === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500';
    const riskBg = risk === 'HIGH' ? 'bg-red-500/20' : risk === 'MEDIUM' ? 'bg-yellow-500/20' : 'bg-green-500/20';

    return (
        <div className="bg-black/80 border border-gray-700 rounded-lg p-4 mt-4 backdrop-blur-md">
            <h3 className="text-blue-400 font-bold text-sm uppercase flex items-center gap-2 mb-4">
                <Shield size={16} />
                Trust & Safety
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Confidence Metric */}
                <div className="bg-gray-900/50 p-2 rounded border border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">Confidence</div>
                    <div className="text-xl font-mono text-cyan-400">{confidence || '0.00'}</div>
                </div>

                {/* Risk Metric */}
                <div className={`p-2 rounded border border-gray-700 ${riskBg}`}>
                    <div className="text-xs text-gray-400 mb-1">Risk Profile</div>
                    <div className={`text-xl font-bold ${riskColor}`}>{risk || 'UNKNOWN'}</div>
                </div>
            </div>

            {/* Repair Log */}
            {repairs && repairs.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs text-gray-500 uppercase font-semibold">Action Log</div>
                    {repairs.map((r, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-900 p-2 rounded text-xs border border-gray-800">
                            <span className="text-gray-300 truncate max-w-[150px]">{r.label}</span>
                            <div className="flex gap-2">
                                <button className="text-gray-500 hover:text-green-400 transition-colors"><ThumbsUp size={12} /></button>
                                <button className="text-gray-500 hover:text-red-400 transition-colors"><ThumbsDown size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(!repairs || repairs.length === 0) && (
                <div className="text-xs text-gray-600 italic text-center py-2">
                    System operating nominally.
                </div>
            )}
        </div>
    );
}
