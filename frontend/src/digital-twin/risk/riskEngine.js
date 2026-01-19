/**
 * Risk Engine (Intelligence Orchestrator)
 * Combines Risk and Confidence models to produce the "Global Trust Index".
 */

import { RiskModel } from './riskModel';
import { ConfidenceModel } from './confidenceModel';

export const RiskEngine = {
    /**
     * computeIntelligence
     * Runs the full intelligence suite.
     * @param {Object} twinState - Current rigid state
     * @param {Object} simulationResult - (Optional) outcomes of recent "what-if"
     */
    computeIntelligence: (twinState, simulationResult = null) => {
        const risk = RiskModel.evaluate(twinState, simulationResult);
        const confidence = ConfidenceModel.evaluate(twinState, simulationResult);

        // Zonal Risk Aggregation
        let zonalRiskLevel = 'stable';
        let roomsAtRisk = 0;
        let criticalRooms = [];

        // If we have simulation results with room data
        if (simulationResult && simulationResult.roomResults) {
            simulationResult.roomResults.forEach(r => {
                if (r.risk.level === 'critical') {
                    zonalRiskLevel = 'critical';
                    roomsAtRisk++;
                    criticalRooms.push(r.name);
                } else if (r.risk.level === 'warning' && zonalRiskLevel !== 'critical') {
                    zonalRiskLevel = 'warning';
                    roomsAtRisk++;
                }
            });
        }

        // Elevate Global Risk if Zonal Risk is Critical
        let finalRiskLevel = risk.level;
        const finalDrivers = [...risk.drivers];

        if (zonalRiskLevel === 'critical') {
            finalRiskLevel = 'critical'; // Room safety overrides global stability
            finalDrivers.push(`CRITICAL_ZONES: ${roomsAtRisk}`);
        } else if (zonalRiskLevel === 'warning' && finalRiskLevel === 'stable') {
            finalRiskLevel = 'warning';
            finalDrivers.push(`WARNING_ZONES: ${roomsAtRisk}`);
        }

        return {
            riskLevel: finalRiskLevel,
            riskDrivers: finalDrivers,
            confidenceValue: confidence.value,
            confidenceReasons: confidence.reasons,
            timestamp: Date.now(),
            zonal: {
                roomsAtRisk,
                criticalRooms
            }
        };
    }
};
