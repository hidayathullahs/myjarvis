/**
 * aestheticScore.js
 * Evaluates geometric balance, symmetry, and order.
 * Higher Order = Higher Score (0-100).
 */

export function calculateAestheticScore(layout) {
    let score = 85;
    const factors = [];
    const warnings = [];

    // 1. Variance in Room Sizes (Chaos vs Hierarchy)
    // Good design has clear hierarchy (Large Living, Med Bed, Small Bath).
    // Bad design has random slight variations (e.g., Bed1=10m, Bed2=10.2m, Bed3=9.8m - looks accidental).

    const roomAreas = layout.rooms.map(r => r.area);
    const uniqueAreas = new Set(roomAreas.map(a => Math.round(a))); // Integer rounding to group

    if (uniqueAreas.size < roomAreas.length * 0.8) {
        factors.push("Consistent spatial hierarchy");
        score += 5;
    }

    // 2. Aspect Ratio Harmony
    // Do most rooms share similar proportions?
    // e.g., Golden mean approx 1.6
    let goldenRects = 0;
    let awkwardShapes = 0;

    layout.rooms.forEach(room => {
        if (!room.width || !room.length) return;
        const ratio = Math.max(room.width, room.length) / Math.min(room.width, room.length);

        if (ratio > 1.4 && ratio < 1.8) goldenRects++;
        if (ratio > 3.0) awkwardShapes++;
    });

    if (goldenRects > 0) {
        score += 5;
        factors.push("Proportions relate to Golden Ratio");
    }

    if (awkwardShapes > 0) {
        score -= 10 * awkwardShapes;
        warnings.push("Contains elongated/awkward spaces");
    }

    // 3. Symmetry (Heuristic without coords)
    // Do we have pairs of similar rooms? (e.g. 2 identical kids bedrooms)
    const typeCounts = {};
    layout.rooms.forEach(r => typeCounts[r.type] = (typeCounts[r.type] || 0) + 1);

    if (typeCounts['bedroom'] > 1) {
        // Check if they are same size
        const beds = layout.rooms.filter(r => r.type === 'bedroom');
        const firstArea = beds[0].area;
        const allSame = beds.every(b => Math.abs(b.area - firstArea) < 0.5);
        if (allSame) {
            factors.push("Symmetrical Bedroom Layout");
            score += 5;
        }
    }

    return {
        score: Math.max(0, Math.min(100, Math.round(score))),
        factors,
        warnings
    };
}
