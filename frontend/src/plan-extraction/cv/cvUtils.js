/**
 * CV Utils
 * Helper functions for post-processing raw CV lines.
 */

export const CVUtils = {
    /**
     * Remove lines that are too short or low confidence (if we had it).
     */
    filterNoise: (lines, minLength = 10) => {
        return lines.filter(line => {
            const dx = line.x2 - line.x1;
            const dy = line.y2 - line.y1;
            return Math.hypot(dx, dy) >= minLength;
        });
    },

    /**
     * Merge collinear segments.
     * Naive implementation: Check angle and distance.
     * (Full implementation requires spatial checking)
     */
    processSegments: (lines) => {
        // Placeholder for the robust merge logic
        // For M1, we pass through normalized lines.
        return lines.map((l, i) => ({
            id: `cv_line_${i}`,
            start: { x: l.x1, y: l.y1 },
            end: { x: l.x2, y: l.y2 },
            type: 'wall', // Inference
            thickness: 0.2, // Default meter thickness (needs scale)
            confidence: 0.8
        }));
    }
};
