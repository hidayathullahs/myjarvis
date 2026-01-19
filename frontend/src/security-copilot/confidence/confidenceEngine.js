/**
 * confidenceEngine.js
 * Calculates confidence (0-1.0) for a given policy finding.
 */

import { FP_HEURISTICS } from './fpHeuristics.js';
import { calculateStabilityIndex } from './stabilityIndex.js';
import { getOverrideFactor } from './overrideTracker.js';
import { explainConfidence } from './explainConfidence.js';

export function calculateConfidence(finding, layout) {
    let score = 1.0;
    const reasons = [];

    // 1. Check Slack Margin (Borderline Failures)
    // Need raw values. finding object usually has message but ideally should have raw data.
    // We'll assume finding object *now* includes data context if upgraded, or parse message.
    // For Sprint 12-H1, we assume finding.data = { actual, required }.

    if (finding.data) {
        if (FP_HEURISTICS.checkSlackMargin(finding.data.actual, finding.data.required)) {
            score *= 0.6; // Heavy penalty for borderline cases -> likely "Soft" violation
            reasons.push("Value is near threshold (margin of error)");
        }
    }

    // 2. Stability Index
    const stability = calculateStabilityIndex(layout);
    if (stability.index < 0.8) {
        score *= 0.9;
        reasons.push(`Layout stability low (${(stability.index * 100).toFixed(0)}%)`);
    }

    // 3. Override History
    const overrideFactor = getOverrideFactor(finding.rule);
    if (overrideFactor < 0.8) {
        score *= overrideFactor;
        reasons.push("Rule frequently overridden by humans");
    }

    // 4. Severity Context (High severity rules are rarely FP or we treat them as HC regardless)
    if (finding.riskLevel === 'HIGH') {
        // Boost confidence back up slightly because we warn high risk aggressively?
        // Or keep strict. Actually, for SAFETY, we want to warn even if low confidence?
        // No, "Confidence" means "Are we sure it violated?".
        // If it's High Risk but Low Confidence, we say "Possible Critical Issue".
    }

    const finalScore = Number(score.toFixed(2));

    return {
        score: finalScore,
        level: finalScore >= 0.8 ? 'HIGH' : (finalScore >= 0.5 ? 'MEDIUM' : 'LOW'),
        explanation: explainConfidence(finalScore, reasons),
        reasons
    };
}
