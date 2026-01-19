/**
 * fpHeuristics.js
 * Contains heuristics to detect potential false positives in policy violations.
 */

export const FP_HEURISTICS = {
    // 1. Slack Margin Detection
    // If violation is within a small margin of the threshold, confidence drops.
    checkSlackMargin: (actual, required, threshold = 0.05) => {
        if (typeof actual !== 'number' || typeof required !== 'number') return false;
        const diff = Math.abs(actual - required);
        const margin = required * threshold; // e.g. 5%
        return diff <= margin;
    },

    // 2. Ambiguity Detection (Placeholder for geometry checks)
    // If layout has weird geometry that might confuse the solver (e.g. non-closed loops, thin walls), confidence drops.
    checkAmbiguity: (layout) => {
        // Heuristic: Check for very small wall segments or overlapping rooms?
        // For now, simple check: do rooms overlap significantly?
        // Using a simplified heuristic: if room count > 15, complexity might induce error.
        if (layout.rooms && layout.rooms.length > 15) return true;
        return false;
    }
};
