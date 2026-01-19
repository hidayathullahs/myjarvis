/**
 * Room Risk Model
 * Evaluates risk for a specific room based on analytics.
 */

import { RISK_LEVELS } from '../../constants/ui/RISK_LEVELS';

export const RoomRiskModel = {
    evaluate: (room, metrics) => {
        // Metrics: { visibility: 0-1, connectivity: 0-1, confidence: 0-1 }

        let riskLevel = RISK_LEVELS.STABLE;
        let factors = [];
        let score = 0; // 0 (safe) - 100 (critical)

        // 1. Low Visibility Risk
        if (metrics.visibility < 0.3) {
            riskLevel = RISK_LEVELS.CRITICAL;
            factors.push('SEVERE_OCCLUSION');
            score += 60;
        } else if (metrics.visibility < 0.6) {
            riskLevel = RISK_LEVELS.CAUTION;
            factors.push('PARTIAL_VISIBILITY');
            score += 30;
        }

        // 2. Low Confidence Risk (Geometry)
        if (metrics.confidence < 0.5) {
            if (riskLevel !== RISK_LEVELS.CRITICAL) riskLevel = RISK_LEVELS.WARNING;
            factors.push('GEOMETRY_AMBIGUOUS');
            score += 20;
        }

        // 3. Connectivity Risk
        if (metrics.connectivity < 0.5) {
            factors.push('ISOLATED_ZONE');
            score += 10;
        }

        return {
            roomId: room.id,
            level: riskLevel,
            score: Math.min(score, 100),
            factors
        };
    }
};
