/**
 * Narrative Engine
 * Assembles human-readable explanations from structured findings.
 * Deterministic. Calm. Factual.
 */

import { ExplanationTemplates } from './explanationBuilders';

export const NarrativeEngine = {
    generateBrief: (findings) => {
        if (!findings || !findings.primaryCause) {
            return "System nominal. Trends stable.";
        }

        let narrative = "";

        // 1. Primary Cause
        if (findings.primaryCause === 'ZONAL_CRITICALITY') {
            const room = findings.affectedRooms[0] || "Unknown Zone";
            narrative += `Risk elevated. ${room} reports critical status.`;
        } else if (findings.primaryCause === 'SYSTEM_INSTABILITY') {
            narrative += "Risk trending upward aggressively.";
        }

        // 2. Supporting Signals (Pick top 1 relevant)
        if (findings.signals.length > 0) {
            // Find a volatility or forecast signal
            const secondary = findings.signals.find(s => s.includes('Projected') || s.includes('volatility'));
            if (secondary) narrative += ` ${secondary}.`;
        }

        return narrative;
    },

    generateDetailed: (findings) => {
        // Future: Returns bullet points for the "WHY" panel
        return findings.signals;
    }
};
