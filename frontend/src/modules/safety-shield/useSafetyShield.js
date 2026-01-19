import { useCallback } from 'react';
import { SafetyPolicy } from './SafetyPolicy';

/**
 * useSafetyShield Hook
 * 
 * Intercepts actions and validates them against the current context (Twin confidence, User role).
 * Returns validity status and rejection reasons.
 * 
 * @param {Object} twinState - The centralized Digital Twin state (confidence, risk)
 * @param {Object} userSession - The current user's role and identity
 */
export const useSafetyShield = (twinState, userSession = { role: 'VIEWER' }) => {

    /**
     * validateAction
     * @param {string} actionType - 'MEASURE', 'SLICE', 'DELETE_OBJECT'
     * @returns {Object} { allowed: boolean, reason: string | null }
     */
    const validateAction = useCallback((actionType) => {
        // 1. Create Context Snapshot
        const context = {
            confidence: twinState?.confidence?.value || 0,
            riskLevel: twinState?.risk?.level || 'UNKNOWN',
            role: userSession.role
        };

        // 2. Lookup Rule
        const rule = SafetyPolicy.rules[actionType];

        // 3. If no rule exists, default to ALLOW (or DENY if we want allowlist-only)
        // For Phase 8, we default to ALLOW for non-critical actions.
        if (!rule) {
            return { allowed: true };
        }

        // 4. Execute Rule
        return rule(context);

    }, [twinState, userSession]);

    return {
        validateAction,
        config: SafetyPolicy
    };
};
