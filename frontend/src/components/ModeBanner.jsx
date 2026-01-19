import React from 'react';
import { Eye, Ruler, Scissors, Upload, Activity, AlertTriangle } from 'lucide-react';
import { RISK_LEVELS } from '../constants/ui/RISK_LEVELS';

export default function ModeBanner({ mode, riskLevel }) {

    // Config for each mode
    const MODES = {
        'view': { label: 'VIEW MODE', icon: Eye, color: 'text-cyan-400', border: 'border-cyan-500/30' },
        'measure': { label: 'MEASUREMENT PROTOCOL', icon: Ruler, color: 'text-yellow-400', border: 'border-yellow-500/50' },
        'slice': { label: 'SECTION SLICE', icon: Scissors, color: 'text-pink-400', border: 'border-pink-500/50' },
        'upload': { label: 'PLAN INGESTION', icon: Upload, color: 'text-green-400', border: 'border-green-500/50' },
        'simulation': { label: 'SIMULATION PREVIEW', icon: Activity, color: 'text-purple-400', border: 'border-purple-500/50' },
        'critical': { label: 'CRITICAL OVERRIDE', icon: AlertTriangle, color: 'text-red-500', border: 'border-red-500' }
    };

    const activeConfig = MODES[mode] || MODES['view'];
    const Icon = activeConfig.icon;
    const isCritical = riskLevel === RISK_LEVELS.CRITICAL;

    return (
        <div className={`
            absolute top-3 left-1/2 -translate-x-1/2 
            glass-panel px-6 py-2 rounded-b-lg border-t-0 border-l border-r border-b
            flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]
            transition-all duration-500 z-[60]
            ${activeConfig.border}
            ${isCritical ? 'bg-red-900/20 shadow-[0_0_30px_rgba(255,0,0,0.2)]' : 'bg-black/60'}
        `}>
            <Icon size={16} className={`${activeConfig.color} ${isCritical ? 'animate-pulse' : ''}`} />

            <div className="flex flex-col items-center">
                <span className={`text-[10px] tracking-[0.2em] font-bold ${activeConfig.color}`}>
                    SYSTEM MODE
                </span>
                <span className={`text-xs font-mono font-bold text-white tracking-widest`}>
                    {activeConfig.label}
                </span>
            </div>

            {/* Right side decoration */}
            <div className={`w-1 h-8 ${isCritical ? 'bg-red-500' : 'bg-gray-700/50'} rounded-full ml-2`} />
        </div>
    );
}
