/**
 * energyScore.js
 * Evaluates passive design potential, orientation, and thermal efficiency.
 * Higher Efficiency = Higher Score (0-100).
 */

export function calculateEnergyScore(layout) {
    let score = 90; // Start high, subtract for flaws
    const factors = [];
    const warnings = [];

    // 1. Orientation Heuristic
    // We need to know where "North" is or assuming layout has orientation data.
    // Assuming layout.orientation (0-360) or room locations.
    // Fallback: If no data, assume neutral score or check basics.

    // Heuristic: Compactness (Surface Area / Volume)
    // A compact square is more efficient than a sprawling shape.
    // We reuse complexity from Cost, but for thermal reasons.
    // (Re-calculated simply here for independence)
    let totalArea = 0;
    let totalPerimeter = 0;

    layout.rooms.forEach(room => {
        totalArea += room.area;
        totalPerimeter += 2 * ((room.width || 0) + (room.length || 0));
    });

    const estimatedShell = totalPerimeter * 0.7; // Approx external wall
    const compactness = (4 * Math.sqrt(totalArea)) / estimatedShell;

    if (compactness > 0.8) {
        score += 5;
        factors.push("Compact form minimizes thermal loss");
    } else if (compactness < 0.6) {
        score -= 10;
        warnings.push("Sprawling form increases heating/cooling load");
    }

    // 2. Cross Ventilation Potential
    // Do rooms have opposite walls exposed?
    // Without coords, check if rooms are "corner" capable (not too many rooms packed).
    const roomCount = layout.rooms.length;
    if (roomCount < 5) {
        factors.push("High cross-ventilation potential (small footprint)");
    } else {
        // Harder to vent deep plans
        // score -= 0; // Neutral
    }

    // 3. Glazing / Window potential
    // If main rooms (Living, Bed) are large, they need good orientation.

    return {
        score: Math.max(0, Math.min(100, Math.round(score))),
        factors,
        warnings
    };
}
