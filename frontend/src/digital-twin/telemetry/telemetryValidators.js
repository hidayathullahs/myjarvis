/**
 * Telemetry Validators
 * Pure functions to validate inputs from reality before they touch the Twin State.
 * Returns { valid: boolean, sanitized: any, error: string? }
 */

import { RISK_LEVELS } from '../../constants/ui/RISK_LEVELS';

export const TelemetryValidators = {
    validateRiskLevel: (level) => {
        const validLevels = Object.values(RISK_LEVELS);
        if (validLevels.includes(level)) {
            return { valid: true, sanitized: level };
        }
        return { valid: false, error: `Invalid risk level: ${level}`, sanitized: RISK_LEVELS.STABLE }; // Default to stable
    },

    validateConfidence: (value) => {
        if (typeof value !== 'number') return { valid: false, error: 'Confidence must be a number', sanitized: 0.5 };
        const clamped = Math.max(0, Math.min(1, value));
        return { valid: true, sanitized: clamped };
    },

    validatePlaneOffset: (offset, maxBounds = 100) => {
        if (typeof offset !== 'number') return { valid: false, error: 'Offset must be a number', sanitized: 0 };
        // Clamp to reasonable scene bounds to prevent infinite values
        const clamped = Math.max(-maxBounds, Math.min(maxBounds, offset));
        return { valid: true, sanitized: clamped };
    },

    validateToolMode: (mode) => {
        const validModes = ['view', 'measure', 'slice', 'inspect'];
        if (validModes.includes(mode)) {
            return { valid: true, sanitized: mode };
        }
        return { valid: false, error: `Invalid tool mode: ${mode}`, sanitized: 'view' };
    }
};
