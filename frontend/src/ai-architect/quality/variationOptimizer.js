/**
 * variationOptimizer.js
 * Sprint 12-B2: Variation Optimization Loop
 * 
 * Generates N variations, validates them via SecurityCopilot, scores them via BalancedScoreEngine,
 * and maintains a leaderboard of the best options.
 */

import { calculateBalancedScore } from './balancedScoreEngine.js';
import { evaluateLayout } from '../../security-copilot/securityCopilot.js'; // Check path distance
// ../../security-copilot is correct if we are in frontend/src/ai-architect/quality

import { mutateResizeRooms } from './mutators/resizeRooms.js';
import { mutateSwapRooms } from './mutators/swapRooms.js';
import { mutateOptimizeCorridor } from './mutators/optimizeCorridor.js';

const MUTATORS = [mutateResizeRooms, mutateSwapRooms, mutateOptimizeCorridor];

export function optimizeLayout({ baseLayout, maxVariants = 10, iterations = 1 }) {
    const leaderboard = [];

    // 1. Score Baseline
    const baseScore = calculateBalancedScore(baseLayout);

    leaderboard.push({
        id: 'baseline',
        type: 'BASELINE',
        layout: baseLayout,
        score: baseScore,
        valid: true,
        changes: ["Original Design"]
    });

    // 2. Generation Loop
    for (let i = 0; i < maxVariants; i++) {
        // Pick random mutator
        const mutator = MUTATORS[Math.floor(Math.random() * MUTATORS.length)];
        const { layout: mutatedLayout, mutationDescription } = mutator(baseLayout);

        // 3. Safety Check (Security Copilot)
        const safety = evaluateLayout(mutatedLayout);

        // If "STRONGLY_REVIEW" or invalid structure, we discard (or penalize heavily)
        // For this generic optimizer, let's discard "Structurally Invalid" but keep "Policy Warnings" 
        // so we can see if scores improve despite warnings (trade-offs).

        if (!safety.allowed && safety.riskScore > 80) {
            continue; // Discard dangerous layouts
        }

        // 4. Score
        const score = calculateBalancedScore(mutatedLayout);

        // 5. Add to candidates
        leaderboard.push({
            id: `variant_${i + 1}`,
            type: 'VARIANT',
            layout: mutatedLayout,
            score: score,
            valid: safety.allowed,
            safetyCheck: safety,
            changes: [mutationDescription]
        });
    }

    // 6. Sort by Balanced Score DESC
    leaderboard.sort((a, b) => b.score.totalScore - a.score.totalScore);

    // 7. Return Top N (e.g., Top 5)
    return leaderboard.slice(0, 5);
}
