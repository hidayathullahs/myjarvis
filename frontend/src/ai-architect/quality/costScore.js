/**
 * costScore.js
 * Evaluates the estimated construction complexity and cost efficiency of a layout.
 * Lower complexity/cost = Higher Score (0-100).
 */

export function calculateCostScore(layout) {
    let score = 100;
    const factors = [];
    const warnings = [];

    // 1. Total Area Penalty (Larger = More expensive, though maybe efficient per sqm, absolute cost rises)
    // Heuristic: Penalize if total area exceeds a 'budget' baseline. 
    // For scoring efficiency, we might actually look at *surface area to floor area ratio* or just raw complexity.
    // Let's use a "Complexity Check".

    let totalArea = 0;
    let totalPerimeter = 0; // Approximate from rooms if not explicit
    let cornerCount = 0; // Approximate

    layout.rooms.forEach(room => {
        totalArea += room.area;
        // Estimate perimeter: 2 * (width + length)
        // In a real merged plan, internal walls are shared. 
        // Heuristic: Sum of perimeters is a proxy for wall length complexity.
        totalPerimeter += 2 * ((room.width || 0) + (room.length || 0));
        cornerCount += 4; // Basic box approximation
    });

    // Factor: Compactness (Perimeter / Area). Lower is cheaper (closer to square/circle).
    // Perfect square perimeter P for area A: P = 4 * sqrt(A)
    // Efficiency Ratio = (4 * sqrt(A)) / ActualP. 
    // If Ratio is 1.0, perfect. If lower, shape is complex.

    const idealPerimeter = 4 * Math.sqrt(totalArea);
    // Shared wall adjustment heuristic: reduce summed "room perimeters" by ~30% to approximate external shell + internal partitions
    const estimatedRealPerimeter = totalPerimeter * 0.7;

    const complexityRatio = idealPerimeter / estimatedRealPerimeter; // 0.0 to 1.0

    if (complexityRatio < 0.7) {
        score -= 15;
        factors.push("Complex building shape increases wall costs");
    } else {
        factors.push("Efficient building shape");
    }

    // 2. Stair/Vertical Penalty
    if (layout.stairs) {
        score -= 10; // Vertical construction is pricier
        factors.push("Multi-story complexity");
    }

    // 3. Wet Area Concentration (Plumbing)
    // Check if Kitchen and Toilet are "close" (in list or coords). 
    // Without coords, we check existence.
    const hasKitchen = layout.rooms.some(r => r.type === 'kitchen');
    const toilets = layout.rooms.filter(r => r.type === 'toilet');

    if (hasKitchen && toilets.length > 0) {
        // Optimistic assumption: They are stacked/grouped in high-quality designs. 
        // If we had coordinates, we'd check distance. 
        // For now, no penalty, assuming solver tries to group.
        factors.push("Plumbing points present");
    }

    if (toilets.length > 2) {
        score -= 5 * (toilets.length - 2);
        factors.push("High count of wet areas");
    }

    // 4. Hallway/Circulation Ratio (Wasted space cost)
    const corridors = layout.rooms.filter(r => r.type === 'corridor');
    const corridorArea = corridors.reduce((acc, r) => acc + r.area, 0);
    const circulationRatio = corridorArea / totalArea;

    if (circulationRatio > 0.20) {
        score -= 20;
        warnings.push("High circulation area (wasted cost)");
    } else {
        factors.push("Efficient circulation space");
    }

    return {
        score: Math.max(0, Math.round(score)),
        factors,
        warnings,
        details: { totalArea, complexityRatio: complexityRatio.toFixed(2) }
    };
}
