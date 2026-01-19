/**
 * @fileoverview Defines the governance rules for the Digital Twin.
 * These rules are checked before any critical destructive or mutative action.
 */

export const SAFETY_LEVELS = {
    UNRESTRICTED: 0,
    STANDARD: 1,
    STRICT: 2,
    LOCKED: 3
};

// The rules engine
export const SafetyPolicy = {
    // 1. Confidence Thresholds
    MIN_CONFIDENCE_FOR_MEASURE: 0.40, // 40% confidence needed to measure
    MIN_CONFIDENCE_FOR_SLICE: 0.70,   // 70% confidence needed to slice (destructive view)
    MIN_CONFIDENCE_FOR_SAVE: 0.50,

    // 2. Action Rules
    rules: {
        'MEASURE': (context) => {
            if (context.confidence < SafetyPolicy.MIN_CONFIDENCE_FOR_MEASURE) {
                return {
                    allowed: false,
                    reason: `Confidence too low (${(context.confidence * 100).toFixed(0)}%). Metric data would be unreliable.`
                };
            }
            return { allowed: true };
        },

        'SLICE': (context) => {
            if (context.confidence < SafetyPolicy.MIN_CONFIDENCE_FOR_SLICE) {
                return {
                    allowed: false,
                    reason: `Structure uncertainty high. Slicing may misrepresent hidden geometry.`
                };
            }
            if (context.riskLevel === 'CRITICAL') {
                return {
                    allowed: false,
                    reason: "Cannot modify view during CRITICAL risk state."
                };
            }
            return { allowed: true };
        },

        'DELETE_OBJECT': (context) => {
            // Very strict
            if (context.role !== 'SUPERVISOR') {
                return {
                    allowed: false,
                    reason: "Insufficient privileges. Supervisor role required."
                };
            }
            return { allowed: true };
        }
    }
};
