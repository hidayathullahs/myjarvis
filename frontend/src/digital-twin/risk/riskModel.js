/**
 * Risk Model
 * Logic to determine the Operational Risk Level based on system state.
 * Inputs: Tool Mode, Clipping Status, Simulation Alerts, System Health
 */

import { RISK_LEVELS } from '../../constants/ui/RISK_LEVELS';

export const RiskModel = {
    evaluate: (state, simulationResult) => {
        let level = RISK_LEVELS.STABLE;
        let drivers = [];

        // 1. Tool Mode Risk
        if (state.ui.mode === 'slice') {
            level = RISK_LEVELS.WARNING;
            drivers.push('MANUAL_DESTRUCTION');
        } else if (state.ui.mode === 'measure') {
            level = RISK_LEVELS.ADVISORY;
            drivers.push('PRECISION_REQUIRED');
        }

        // 2. Geometry Inspection Risk (Simulation)
        if (simulationResult) {
            if (simulationResult.riskLevel === RISK_LEVELS.CRITICAL) {
                level = RISK_LEVELS.CRITICAL;
                drivers.push('MODEL_INTEGRITY_LOSS');
            } else if (simulationResult.riskLevel === RISK_LEVELS.WARNING && level !== RISK_LEVELS.CRITICAL) {
                level = RISK_LEVELS.WARNING;
                drivers.push('SIGNIFICANT_VISIBILITY_DROP');
            }
        }

        // 3. System Constraints (Example)
        if (!state.model.loaded) {
            // No model is a safe idle state, unless we are trying to act
            if (state.ui.mode !== 'view') {
                level = RISK_LEVELS.ADVISORY;
                drivers.push('NO_MODEL_TARGET');
            }
        }

        return { level, drivers };
    }
};
