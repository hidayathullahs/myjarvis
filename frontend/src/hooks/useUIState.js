import { useState, useCallback } from 'react';
import { RISK_LEVELS } from '../constants/ui/RISK_LEVELS';
import { CONFIDENCE_THRESHOLDS } from '../constants/ui/CONFIDENCE_THRESHOLDS';

export function useUIState() {
    // Core State
    const [riskLevel, setRiskLevel] = useState(RISK_LEVELS.STABLE);
    const [confidence, setConfidence] = useState(1.0); // 0.0 - 1.0

    // Priority Spine Management (Future)
    // const [priorityItems, setPriorityItems] = useState([]);

    // Logic: Determine Pulse based on Confidence
    const getConfidencePulse = useCallback(() => {
        if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'animate-pulse-slow';
        if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'animate-pulse';
        if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'animate-pulse-fast';
        return 'opacity-50'; // Low confidence dim
    }, [confidence]);

    // Logic: Determine Theme based on Risk
    const updateRisk = useCallback((level) => {
        if (Object.values(RISK_LEVELS).includes(level)) {
            setRiskLevel(level);
        }
    }, []);

    return {
        riskLevel,
        confidence,
        setRiskLevel,
        setConfidence,
        getConfidencePulse
    };
}
