/**
 * balancedScoreEngine.js
 * Aggregates Cost, Comfort, Energy, and Aesthetic scores into a final Weighted Balanced Score.
 * Phase 12-B Priority: Balanced (7)
 */

import { calculateCostScore } from './costScore.js';
import { calculateComfortScore } from './comfortScore.js';
import { calculateEnergyScore } from './energyScore.js';
import { calculateAestheticScore } from './aestheticScore.js';
import { generateBalancedSummary } from './balancedScoreExplain.js';

// Weights for "Balanced" Mode
const WEIGHTS = {
    COST: 0.25,
    COMFORT: 0.30,
    ENERGY: 0.25,
    AESTHETIC: 0.20
};

export function calculateBalancedScore(layout) {
    // 1. Compute Individual Scores
    const cost = calculateCostScore(layout);
    const comfort = calculateComfortScore(layout);
    const energy = calculateEnergyScore(layout);
    const aesthetic = calculateAestheticScore(layout);

    // 2. Weighted Aggregation
    const rawScore =
        (cost.score * WEIGHTS.COST) +
        (comfort.score * WEIGHTS.COMFORT) +
        (energy.score * WEIGHTS.ENERGY) +
        (aesthetic.score * WEIGHTS.AESTHETIC);

    const finalScore = Math.round(rawScore);

    // 3. Construct Explanation Object
    return {
        totalScore: finalScore,
        breakdown: {
            cost: cost.score,
            comfort: comfort.score,
            energy: energy.score,
            aesthetic: aesthetic.score
        },
        details: {
            cost: { factors: cost.factors, warnings: cost.warnings },
            comfort: { factors: comfort.factors, warnings: comfort.warnings },
            energy: { factors: energy.factors, warnings: energy.warnings },
            aesthetic: { factors: aesthetic.factors, warnings: aesthetic.warnings }
        },
        summary: generateBalancedSummary(finalScore, cost, comfort, energy, aesthetic)
    };
}
