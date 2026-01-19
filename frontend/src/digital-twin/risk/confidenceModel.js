/**
 * Confidence Model
 * Logic to calculate the System Confidence Score (0.0 - 1.0).
 * Inputs: Data Volatility, Simulation Uncertainty, Missing Telemetry
 */

export const ConfidenceModel = {
    evaluate: (state, simulationResult) => {
        let score = 1.0;
        let reasons = [];

        // 1. Tool-Based Uncertainty
        if (state.ui.mode === 'slice') {
            score -= 0.15; // Manual slicing is inherently prone to user error
            reasons.push('MANUAL_INPUT_VARIANCE');
        }

        // 2. Simulation Uncertainty (The "Foresight" aspect)
        if (simulationResult) {
            if (simulationResult.uncertainty > 0.5) {
                score -= 0.3;
                reasons.push('SIMULATION_AMBIGUITY');
            } else if (simulationResult.uncertainty > 0.2) {
                score -= 0.1;
            }
        }

        // 3. Clipping Complexity
        // Determine if multiple planes are active
        const planes = state.clipping.planes;
        let activePlanes = 0;
        if (planes.horizontal?.active) activePlanes++;
        if (planes.vertical?.active) activePlanes++;

        if (activePlanes > 1) {
            score -= 0.1; // Multi-axis cuts are harder to visualize mentally
            reasons.push('COMPLEX_INTERSECTION');
        }

        // Clamp
        return {
            value: Math.max(0.0, Math.min(1.0, parseFloat(score.toFixed(2)))),
            reasons
        };
    }
};
