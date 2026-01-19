import React, { useState } from "react";
import { optimizeLayout } from "../quality/variationOptimizer";
import { ScorecardPanel } from "./ScorecardPanel";
import { Copy, ArrowRight, Check, X } from "lucide-react";

/**
 * OptimizationDashboard
 * Allows the user to generate, review, and apply AI-optimized layout variations.
 */
export default function OptimizationDashboard({ layout, onApply }) {
    const [loading, setLoading] = useState(false);
    const [variants, setVariants] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);

    async function runOptimization() {
        setLoading(true);
        // Reset selection
        setSelectedVariant(null);
        try {
            // Run the deterministic optimizer
            const results = await optimizeLayout({ baseLayout: layout, maxVariants: 10 });
            // Filter out only valid variants distinct from baseline if needed
            // results[0] is baseline.
            setVariants(results);
        } catch (e) {
            console.error("Optimization failed", e);
        } finally {
            setLoading(false);
        }
    }

    const handleApply = (variant) => {
        if (onApply) {
            onApply(variant.layout);
            // Optional: Clear variants or give feedback?
            // For now, keep them so user can switch back if they want (by re-applying baseline)
        }
    };

    return (
        <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-purple-400 font-bold tracking-wider text-sm uppercase flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                        AI Optimization Loop
                    </h3>
                    <p className="text-[10px] text-gray-400">Deterministic Variation Engine v12.B2</p>
                </div>
                {!loading && variants.length === 0 && (
                    <button
                        onClick={runOptimization}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-xs font-bold transition-all shadow-lg hover:shadow-purple-500/25 flex items-center gap-2"
                    >
                        <Copy size={14} />
                        GENERATE VARIATIONS
                    </button>
                )}
            </div>

            {loading && (
                <div className="py-8 text-center text-purple-300 text-xs animate-pulse">
                    Generating optimized architectural variations...
                </div>
            )}

            {!loading && variants.length > 0 && (
                <div className="space-y-4">

                    {/* Leaderboard Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-300">
                            <thead className="text-gray-500 border-b border-gray-700 uppercase bg-gray-900/50">
                                <tr>
                                    <th className="p-2">Rank</th>
                                    <th className="p-2">Variant</th>
                                    <th className="p-2 text-right">Score</th>
                                    <th className="p-2">Change Focus</th>
                                    <th className="p-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {variants.map((v, i) => {
                                    const isBase = v.type === 'BASELINE';
                                    const isSelected = selectedVariant?.id === v.id;
                                    return (
                                        <tr key={v.id} className={`hover:bg-purple-900/10 transition-colors ${isSelected ? 'bg-purple-900/20' : ''}`}>
                                            <td className="p-2 font-mono text-gray-500">#{i + 1}</td>
                                            <td className="p-2 font-medium text-white">{isBase ? 'Original' : `Option ${String.fromCharCode(65 + i - 1)}`}</td>
                                            <td className="p-2 text-right">
                                                <span className={`font-bold ${v.score.totalScore >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {v.score.totalScore}
                                                </span>
                                            </td>
                                            <td className="p-2 text-gray-400 max-w-[150px] truncate">
                                                {v.changes[0]}
                                            </td>
                                            <td className="p-2 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedVariant(v)}
                                                    className="text-purple-400 hover:text-purple-300 border border-purple-900 px-2 py-1 rounded bg-black/20"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleApply(v)}
                                                    className="text-white bg-green-600 hover:bg-green-500 px-2 py-1 rounded flex items-center gap-1"
                                                    title="Apply Layout"
                                                >
                                                    <Check size={12} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Selected Variant Detail */}
                    {selectedVariant && (
                        <div className="bg-black/40 p-3 rounded border border-gray-700 animate-fadeIn relative">
                            <button onClick={() => setSelectedVariant(null)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X size={14} /></button>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Left: Scorecard */}
                                <div>
                                    <ScorecardPanel audit={selectedVariant.score} />
                                </div>
                                {/* Right: Details */}
                                <div className="text-xs space-y-2">
                                    <h4 className="font-bold text-white uppercase border-b border-gray-700 pb-1">Optimization Logic</h4>
                                    <p className="text-gray-300">{selectedVariant.changes.join(". ")}</p>

                                    <h4 className="font-bold text-white uppercase border-b border-gray-700 pb-1 mt-3">Trade-Off Analysis</h4>
                                    {/* Heuristic trade-off logic demo */}
                                    <ul className="space-y-1">
                                        {selectedVariant.score.breakdown.cost < 60 && <li className="text-red-400">⚠ Higher Construction Cost</li>}
                                        {selectedVariant.score.breakdown.comfort > 80 && <li className="text-green-400">✓ Comfort significantly improved</li>}
                                        {selectedVariant.type === 'BASELINE' && <li className="text-gray-500">Reference Baseline</li>}
                                    </ul>

                                    <div className="pt-4">
                                        <button
                                            onClick={() => handleApply(selectedVariant)}
                                            className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold shadow-lg"
                                        >
                                            APPLY THIS LAYOUT
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                        <button onClick={runOptimization} className="text-[10px] text-gray-500 hover:text-purple-400 underline">
                            Regenerate Variations
                        </button>
                        <span className="text-[10px] text-gray-600">Deterministic | No Hallucinations</span>
                    </div>

                </div>
            )}
        </div>
    );
}
