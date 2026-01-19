/**
 * @fileoverview Environmental Intelligence Engine (Feature #9)
 * Analyzes layout orientation to score solar efficiency and thermal comfort.
 */

const ORIENTATION_MULTIPLIERS = {
    'NORTH': { 'KITCHEN': 0.8, 'BEDROOM': 1.0, 'LIVING': 1.0 }, // North light good for living/bed
    'EAST': { 'KITCHEN': 1.2, 'BEDROOM': 1.0, 'LIVING': 1.1 }, // Morning light distinct benefit
    'SOUTH': { 'KITCHEN': 0.5, 'BEDROOM': 0.8, 'LIVING': 0.9 }, // Harsh heat in tropics
    'WEST': { 'KITCHEN': 0.4, 'BEDROOM': 0.6, 'LIVING': 0.7 }, // Evening heat gain (bad)
};

export class SunPathEngine {

    /**
     * Scores the layout based on room placement relative to plot orientation.
     * @param {Object} layout - Generated layout
     * @param {string} plotOrientation - Direction of road/front ('NORTH', 'EAST', etc)
     */
    static analyze(layout, plotOrientation = 'NORTH') {
        let totalScore = 0;
        let checks = 0;
        const insights = [];

        layout.rooms.forEach(room => {
            // Determine room's cardinal zone based on normalized center
            // For MVP, we use the simple logic: Where is it relative to plot center?
            // Real implementation would intersect with compass.
            // Here we assume plotOrientation defines "UP" vector.

            // Simplification: Check critical rooms
            if (['KITCHEN', 'BEDROOM', 'LIVING'].includes(room.type)) {

                // Get multipliers for this orientation
                const multipliers = ORIENTATION_MULTIPLIERS[plotOrientation] || ORIENTATION_MULTIPLIERS['NORTH'];
                const score = multipliers[room.type] || 1.0;

                totalScore += score;
                checks++;

                if (score < 0.7) {
                    insights.push(`${room.type} faces ${plotOrientation} logic (High Heat Gain risk). Consider shading.`);
                } else if (score > 1.1) {
                    insights.push(`${room.type} correctly oriented for Morning Light.`);
                }
            }
        });

        const normalizedScore = checks > 0 ? (totalScore / checks) : 1.0;

        let rating = "NEUTRAL";
        if (normalizedScore > 1.05) rating = "EXCELLENT";
        if (normalizedScore < 0.85) rating = "POOR (High Heat)";

        return {
            score: (normalizedScore * 100).toFixed(0),
            rating,
            insights
        };
    }
}
