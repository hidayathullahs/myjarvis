/**
 * Forecast Engine
 * Deterministic short-term projection of system state.
 * Uses trend analytics to answer: "Where are we going?"
 */

export const ForecastEngine = {
    /**
     * Predict future state based on current analytics.
     * @param {Object} analytics - Output from TimelineAnalytics
     * @param {Object} currentSnapshot - Latest state
     * @returns {Object} Forecast Result
     */
    predict: (analytics, currentSnapshot) => {
        const HORIZON_SECONDS = 5.0; // Short-term lookahead

        // Default: Inertia (stay same)
        let prediction = {
            horizon: HORIZON_SECONDS,
            likelyRiskLevel: currentSnapshot.risk.level,
            probability: 0.8, // Baseline confidence
            notes: ["Steady state assumed."]
        };

        // 1. Handle Volatility (Lowers confidence)
        if (analytics.volatility === 'HIGH') {
            prediction.probability = 0.4;
            prediction.notes.push("High volatility reduces forecast confidence.");
        }

        // 2. Handle Velocity (Trend Projection)
        if (analytics.trend === 'RISING') {
            // If rising fast, predict escalation
            if (currentSnapshot.risk.level === 'stable') prediction.likelyRiskLevel = 'advisory';
            if (currentSnapshot.risk.level === 'advisory') prediction.likelyRiskLevel = 'warning';
            if (currentSnapshot.risk.level === 'warning') prediction.likelyRiskLevel = 'critical';

            prediction.notes[0] = "Risk escalation projected based on rising trend.";

        } else if (analytics.trend === 'FALLING') {
            // De-escalation
            if (currentSnapshot.risk.level === 'critical') prediction.likelyRiskLevel = 'warning';
            if (currentSnapshot.risk.level === 'warning') prediction.likelyRiskLevel = 'advisory';

            prediction.notes[0] = "Stabilization projected based on falling trend.";
        }

        return prediction;
    }
};
