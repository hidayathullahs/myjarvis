/**
 * Reason Model
 * The "Detective" of the Digital Twin.
 * Analyzes FACTS (State, Trends, Forecasts) to deduce CAUSES.
 * Logic Only. No Text Generation.
 */

export const ReasonModel = {
    analyze: (twinState, temporalData) => {
        const findings = {
            primaryCause: null,
            affectedRooms: [],
            signals: [],
            confidence: twinState.confidence.value
        };

        // 1. Analyze Zonal Risks (The "Where")
        if (twinState.risk.zonal && twinState.risk.zonal.roomsAtRisk > 0) {
            findings.affectedRooms = twinState.risk.zonal.criticalRooms || [];
            if (findings.affectedRooms.length > 0) {
                findings.primaryCause = 'ZONAL_CRITICALITY';
                findings.signals.push(`${findings.affectedRooms.length} rooms exceeded risk threshold`);
            }
        }

        // 2. Analyze Trends (The "Movement")
        if (temporalData.trend === 'RISING') {
            findings.signals.push(`Risk trending UP (Velocity: ${temporalData.velocity.toFixed(2)})`);
            if (!findings.primaryCause) findings.primaryCause = 'SYSTEM_INSTABILITY';
        }

        // 3. Analyze Forecast (The "Future")
        if (temporalData.forecast && temporalData.forecast.likelyRiskLevel === 'critical') {
            findings.signals.push(`Projected CRITICAL state in ${temporalData.forecast.horizon}s`);
        }

        // 4. Analyze Volatility (The "Chaos")
        if (temporalData.volatility === 'HIGH') {
            findings.signals.push('High system volatility detected');
        }

        return findings;
    }
};
