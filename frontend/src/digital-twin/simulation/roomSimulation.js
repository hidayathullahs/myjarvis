/**
 * Room Simulation Engine
 * Orchestrates zonal analysis across the building model.
 */

import { RoomAnalytics } from './roomAnalytics';
import { RoomRiskModel } from '../risk/roomRiskModel';

export const RoomSimulation = {
    /**
     * Run simulation for all rooms in the building.
     * @param {Object} buildingModel - Semantic Building
     * @param {Object} twinState - Current Twin State (clipping, etc.)
     * @returns {Array} List of room simulation results
     */
    run: (buildingModel, twinState) => {
        if (!buildingModel || !buildingModel.floors) return [];

        const results = [];
        const simContext = {
            clipPlane: twinState.clipping || { active: false }
        };

        buildingModel.floors.forEach(floor => {
            floor.rooms.forEach(room => {
                // 1. Analytics
                const visibility = RoomAnalytics.computeVisibility(room, simContext);
                const connectivity = RoomAnalytics.computeConnectivity(room, null); // Graph needed later

                const metrics = {
                    visibility,
                    connectivity,
                    confidence: room.confidence || 0.8
                };

                // 2. Risk Evaluation
                const riskProfile = RoomRiskModel.evaluate(room, metrics);

                results.push({
                    roomId: room.id,
                    name: room.name,
                    metrics,
                    risk: riskProfile
                });
            });
        });

        return results;
    }
};
