/**
 * Scale Resolver
 * Determines the pixels-to-meters ratio.
 */

export const ScaleResolver = {
    /**
     * Resolve scale.
     * @param {Object} extractionMeta - Metadata from extraction
     * @param {Array} walls - Extracted walls
     * @param {number} userOverride - Optional user-defined scale
     */
    resolve: (walls, userOverride = null) => {
        if (userOverride) {
            return { ratio: userOverride, confidence: 1.0, source: 'user' };
        }

        // Heuristics:
        // 1. Door Width: Standard door is ~0.9m.
        // If we find openings, we can guess the scale.

        // 2. Wall Thickness: Standard internal ~0.15m, external ~0.3m.

        // Default Fallback (Rough guess base on image size? No, dangerous)
        // Return 1.0 but mark as UNCERTAIN

        return {
            ratio: 50, // e.g., 50 pixels = 1 meter (Placeholder)
            confidence: 0.1,
            source: 'default'
        };
    }
};
