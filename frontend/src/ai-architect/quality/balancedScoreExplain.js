/**
 * balancedScoreExplain.js
 * Generates human-readable explanations for the score profile.
 */

export function generateBalancedSummary(finalScore, cost, comfort, energy, aesthetic) {
    let summary = `Balanced Score: ${finalScore}/100. `;

    if (finalScore >= 80) {
        summary += "This design is highly optimized across all dimensions. ";
    } else if (finalScore >= 60) {
        summary += "Good balance, with some opportunities for refinement. ";
    } else {
        summary += "Needs optimization to better balance cost, comfort, and efficiency. ";
    }

    // Highlight strongest and weakest
    const scores = [
        { name: 'Cost Efficiency', val: cost.score },
        { name: 'Comfort', val: comfort.score },
        { name: 'Energy', val: energy.score },
        { name: 'Aesthetics', val: aesthetic.score }
    ];

    scores.sort((a, b) => b.val - a.val);

    summary += `Strongest in ${scores[0].name} (${scores[0].val}). `;
    if (scores[3].val < 60) {
        summary += `Consider improving ${scores[3].name} (${scores[3].val}).`;
    }

    return summary;
}
