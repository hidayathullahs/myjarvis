/**
 * Simulation Engine v1
 * The deterministic "Crystal Ball" of the Digital Twin.
 * Answers "what-if" questions without side-effects.
 */

import { SimulationModels } from './simulationModels';
import { SimulationValidators } from './simulationValidators';
import { RoomSimulation } from './roomSimulation';
import { PerformanceMetrics } from '../../debug/PerformanceMonitor';

export const SimulationEngine = {
    /**
     * Run a simulation based on current state and a PROPOSED change.
     * @param {Object} twinState - The Source of Truth
     * @param {Object} changeProposal - { axis: 'horizontal', offset: 5, inverted: false }
     * @returns {Object} Prediction Result
     */
    predictOutcome: (twinState, changeProposal) => {
        // 1. Validation
        const validation = SimulationValidators.validateRequest(twinState, changeProposal);
        if (!validation.valid) {
            return {
                uncertainty: 1.0,
                riskDelta: 'unknown',
                error: validation.error,
                outcomes: []
            };
        }

        const start = performance.now();

        // 2. clone & Apply Change (Virtual Mutation)
        // We act on a subset of state relevant to physics
        const currentPlanes = twinState.clipping.planes;
        const proposedPlanes = JSON.parse(JSON.stringify(currentPlanes));

        // Merge proposal into virtual planes
        if (changeProposal.axis === 'horizontal') {
            proposedPlanes.horizontal.active = true;
            proposedPlanes.horizontal.offset = changeProposal.offset;
            if (changeProposal.inverted !== undefined) proposedPlanes.horizontal.inverted = changeProposal.inverted;
        } else if (changeProposal.axis === 'vertical') {
            proposedPlanes.vertical.active = true;
            proposedPlanes.vertical.offset = changeProposal.offset;
            if (changeProposal.inverted !== undefined) proposedPlanes.vertical.inverted = changeProposal.inverted;
        }

        // 3. Run Models
        const visibility = SimulationModels.predictVisibility(
            twinState.model.boundingBox,
            proposedPlanes
        );

        const proposedRisk = SimulationModels.predictRisk(visibility, twinState.ui.mode);
        const contradiction = SimulationModels.detectContradiction(visibility);

        // 3.1 Run Room-Level Simulation (Zonal Analysis)
        let roomResults = [];
        if (twinState.model.buildingModel) {
            // Create a temporary twinState reflecting the PROPOSED change for the room sim
            const proposedState = {
                ...twinState,
                clipping: { ...twinState.clipping, planes: proposedPlanes }
            };
            roomResults = RoomSimulation.run(twinState.model.buildingModel, proposedState);
        }

        const duration = performance.now() - start;
        PerformanceMetrics.report('sim', duration);

        // 4. Construct Result
        return {
            predictionId: Date.now().toString(36),
            uncertainty: 0.1, // High confidence in simple math
            riskLevel: proposedRisk,
            riskDelta: proposedRisk === twinState.risk.level ? 'neutral' : 'changed',
            roomResults, // Zonal Insights
            outcomes: [
                {
                    label: 'Visibility Impact',
                    value: `${(visibility * 100).toFixed(0)}%`,
                    context: visibility < 0.2 ? 'SEVERE' : 'NORMAL'
                },
                {
                    label: 'Integrity Check',
                    value: contradiction ? 'CONTRADICTION DETECTED' : 'PASSED',
                    context: contradiction ? 'CRITICAL' : 'OK'
                }
            ],
            notes: contradiction ? "Proposed slice hides entire model." : "Simulation nominal."
        };
    }
};
