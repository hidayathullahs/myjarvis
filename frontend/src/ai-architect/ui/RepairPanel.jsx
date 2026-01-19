// import React from 'react';
import { Wrench, Check } from 'lucide-react';

export function RepairPanel({ repairs, onApplyRepair }) {
    if (!repairs || repairs.length === 0) return null;

    return (
        <div className="bg-yellow-900/10 border border-yellow-500/30 p-4 rounded mb-4 animate-fadeIn">
            <h4 className="text-yellow-400 font-bold mb-3 uppercase text-sm flex items-center gap-2">
                <Wrench size={14} />
                Active Defense: {repairs.length} Fixes
            </h4>
            <div className="space-y-2">
                {repairs.map((item, i) => (
                    <div key={item.findingId || i} className="bg-black/30 p-2 rounded border border-yellow-500/10 text-xs">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-gray-300 font-medium">{item.finding.message}</span>
                            <span className="text-[10px] text-yellow-600 bg-yellow-900/30 px-1 rounded border border-yellow-900">
                                {item.finding.confidence ? item.finding.confidence.level : 'CHK'}
                            </span>
                        </div>
                        <div className="mt-2 space-y-1">
                            {item.actions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onApplyRepair(action)}
                                    className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-1 px-2 rounded transition-colors shadow-sm"
                                >
                                    <Check size={12} />
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
