import React from 'react';
import { ACTIVITY_OPACITY } from '../../constants/ui/SEMANTIC_COLORS'; // Assuming access to core tokens or use generic

/**
 * ScorecardPanel
 * Displays the Balanced Architecture Score and its breakdown.
 * 
 * Props:
 *  - audit: Object returned by calculateBalancedScore()
 *    { totalScore, breakdown: { cost, comfort, energy, aesthetic }, summary, details }
 */
export function ScorecardPanel({ audit }) {
    if (!audit) return null;

    const { totalScore, breakdown, summary } = audit;

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getBarColor = (score) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="p-4 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 shadow-xl max-w-sm">
            {/* Header */}
            <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
                <div>
                    <h3 className="text-white text-lg font-bold tracking-tight">Balanced Score</h3>
                    <p className="text-xs text-white/50">Phase 12-B Metric</p>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(totalScore)}`}>
                    {totalScore}
                </div>
            </div>

            {/* Summary Narrative */}
            <p className="text-sm text-white/80 mb-4 italic leading-relaxed">
                "{summary}"
            </p>

            {/* Dimension Bars */}
            <div className="space-y-3">
                <ScoreRow label="Cost Efficiency" score={breakdown.cost} color={getBarColor(breakdown.cost)} />
                <ScoreRow label="Comfort & Livability" score={breakdown.comfort} color={getBarColor(breakdown.comfort)} />
                <ScoreRow label="Energy Behavior" score={breakdown.energy} color={getBarColor(breakdown.energy)} />
                <ScoreRow label="Aesthetic Balance" score={breakdown.aesthetic} color={getBarColor(breakdown.aesthetic)} />
            </div>

            {/* Footer / Meta */}
            <div className="mt-4 pt-2 border-t border-white/5 flex justify-between text-[10px] text-white/30 uppercase tracking-widest">
                <span>Deterministic</span>
                <span>v1.0.0</span>
            </div>
        </div>
    );
}

function ScoreRow({ label, score, color }) {
    return (
        <div>
            <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>{label}</span>
                <span>{score}</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-1000 ease-out`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}
