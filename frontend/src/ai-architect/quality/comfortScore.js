/**
 * comfortScore.js
 * Evaluates livability, privacy, and spatial quality.
 * Higher Livability = Higher Score (0-100).
 */

export function calculateComfortScore(layout) {
    let score = 100;
    const factors = [];
    const warnings = [];

    layout.rooms.forEach(room => {
        // 1. Room Sizing Comfort (Above minimums)
        // We assume 'policy' checks minimums. Here we reward *generosity*.
        if (room.type === 'masterBedroom') {
            if (room.area > 16) {
                // score is capped, but good sizing helps maintain high base
                factors.push("Generous Master Bedroom size");
            } else if (room.area < 12) {
                score -= 5;
                warnings.push("Master Bedroom is tight");
            }
        }

        if (room.type === 'livingRoom' && room.area > 20) {
            factors.push("Spacious Living Area");
        }

        // 2. Aspect Ratio (Shape usability)
        if (room.width && room.length) {
            const ratio = Math.max(room.width, room.length) / Math.min(room.width, room.length);
            if (ratio > 2.5 && room.type !== 'corridor') {
                score -= 5;
                warnings.push(`${room.type} is too narrow (bowling alley effect)`);
            }
        }
    });

    // 3. Privacy Zoning (Heuristic)
    // Ideally, bedrooms should not directly open to Living Room without transition.
    // Without a graph, we generalize:
    // If "corridor" exists, it suggests separation.
    const hasCorridor = layout.rooms.some(r => r.type === 'corridor');
    if (hasCorridor) {
        factors.push("Circulation buffer exists (good for privacy)");
    } else if (layout.rooms.length > 3) {
        // Many rooms but no corridor -> likely direct access
        score -= 10;
        warnings.push("Lack of dedicated circulation may impact privacy");
    }

    // 4. Natural Light / Ventilation Potential
    const windowCount = layout.rooms.reduce((acc, r) => acc + (r.windows || 0), 0);
    // Simple check: heuristic if windows not modeled explicitly
    // Assume generic layout allows windows on perimeter rooms.

    return {
        score: Math.max(0, Math.round(score)),
        factors,
        warnings
    };
}
