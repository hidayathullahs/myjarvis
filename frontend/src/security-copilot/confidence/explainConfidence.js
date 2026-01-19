/**
 * explainConfidence.js
 * Generates text explaining why a confidence score is High/Medium/Low.
 */

export function explainConfidence(confidenceScore, reasons) {
    let level = "LOW";
    if (confidenceScore >= 0.8) level = "HIGH";
    else if (confidenceScore >= 0.5) level = "MEDIUM";

    const mainReason = reasons.length > 0 ? reasons[0] : "Standard policy check.";

    switch (level) {
        case "HIGH":
            return `High Confidence (${(confidenceScore * 100).toFixed(0)}%). ${mainReason}`;
        case "MEDIUM":
            return `Medium Confidence. ${mainReason} Verify manually.`;
        case "LOW":
            return `Low Confidence. ${mainReason} Likely false positive or minor deviation.`;
        default:
            return "Confidence check failed.";
    }
}
