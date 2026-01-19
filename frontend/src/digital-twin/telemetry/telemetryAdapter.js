/**
 * Telemetry Adapter
 * The "Switchboard" that normalizes Reality Events into Twin Mutations.
 * Enforces validation and logs rejections.
 */

import { TwinMutations } from '../twinMutations';
import { TelemetryValidators } from './telemetryValidators';
import { RiskEngine } from '../risk/riskEngine';

export const TelemetryAdapter = {
    /**
     * Process a raw event and return simple result object
     * @param {Object} currentState - The current Twin State
     * @param {string} eventType - The type of event (e.g., 'TOOL_CHANGED')
     * @param {any} payload - Raw data
     * @returns {Object} { nextState, success, error? }
     */
    processEvent: (currentState, eventType, payload) => {
        let nextState = currentState;
        let success = true;
        let error = null;

        try {
            switch (eventType) {
                case 'TOOL_MODE_CHANGED': {
                    const { valid, sanitized, error: valErr } = TelemetryValidators.validateToolMode(payload);
                    if (valid) {
                        nextState = TwinMutations.setToolMode(nextState, sanitized);
                        // Re-evaluate Intelligence
                        const intelligence = RiskEngine.computeIntelligence(nextState);
                        nextState = TwinMutations.setRiskLevel(nextState, intelligence.riskLevel, intelligence.riskDrivers);
                        nextState = TwinMutations.setConfidence(nextState, intelligence.confidenceValue);
                    } else {
                        console.warn(`[TwinAdapter] Invalid Tool Mode: ${valErr}`);
                        success = false;
                        error = valErr;
                    }
                    break;
                }

                case 'RISK_UPDATE': {
                    // LEGACY/MANUAL OVERRIDE ONLY
                    // Should mostly be computed now, but UI might force it
                    const { level, drivers } = payload;
                    const { valid, sanitized } = TelemetryValidators.validateRiskLevel(level);
                    if (valid) {
                        nextState = TwinMutations.setRiskLevel(nextState, sanitized, drivers || []);
                    }
                    break;
                }

                case 'CONFIDENCE_UPDATE': {
                    // LEGACY/MANUAL OVERRIDE ONLY
                    const { valid, sanitized } = TelemetryValidators.validateConfidence(payload);
                    if (valid) {
                        nextState = TwinMutations.setConfidence(nextState, sanitized);
                    }
                    break;
                }

                case 'CLIPPING_PARAM_UPDATE': {
                    const { axis, offset } = payload;
                    const { valid, sanitized } = TelemetryValidators.validatePlaneOffset(offset);
                    if (valid) {
                        nextState = TwinMutations.updatePlaneOffset(nextState, axis, sanitized);
                        // Re-evaluate Intelligence on Geometrical Change
                        const intelligence = RiskEngine.computeIntelligence(nextState);
                        nextState = TwinMutations.setRiskLevel(nextState, intelligence.riskLevel, intelligence.riskDrivers);
                        nextState = TwinMutations.setConfidence(nextState, intelligence.confidenceValue);
                    }
                    break;
                }

                case 'MODEL_METRICS_LOADED': {
                    // Payload expected: { id, name, boundingBox, dimensions, scale }
                    nextState = TwinMutations.setModelData(nextState, payload);
                    // Model loaded -> Re-evaluate (might clear NO_MODEL_TARGET risk)
                    const intelligence = RiskEngine.computeIntelligence(nextState);
                    nextState = TwinMutations.setRiskLevel(nextState, intelligence.riskLevel, intelligence.riskDrivers);
                    break;
                }

                default:
                    console.warn(`[TwinAdapter] Unknown Event: ${eventType}`);
                    success = false;
                    error = 'UNKNOWN_EVENT_TYPE';
            }
        } catch (err) {
            console.error('[TwinAdapter] Processing Error:', err);
            success = false;
            error = err.message;
        }

        return { nextState, success, error };
    }
};
