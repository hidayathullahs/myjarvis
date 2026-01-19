/**
 * stabilityIndex.js
 * Calculates the geometric stability of a layout.
 * Unstable layouts (jagged, weird shapes) lower confidence in strict rule enforcement.
 */

export function calculateStabilityIndex(layout) {
    let stability = 1.0;
    const reasons = [];

    if (!layout || !layout.rooms) return { index: 0, reasons: ["Invalid Layout"] };

    // 1. Orthogonality Check
    // Assume we want rects. Non-rects reduce stability.
    // Since we don't have full vertex data in this lightweight model, rely on aspect ratios.
    let weirdShapes = 0;
    layout.rooms.forEach(r => {
        if (r.width && r.length) {
            const ratio = Math.max(r.width, r.length) / Math.min(r.width, r.length);
            if (ratio > 4.0) weirdShapes++;
        }
    });

    if (weirdShapes > 0) {
        stability -= (0.1 * weirdShapes);
        reasons.push("Contains elongated/unstable room shapes");
    }

    // 2. Stair/Vertical Complexity
    if (layout.stairs) {
        if (!layout.stairs.width || layout.stairs.width < 0.8) {
            stability -= 0.1;
            reasons.push("Stair definition incomplete or narrow");
        }
    }

    return {
        index: Math.max(0, stability),
        reasons
    };
}
