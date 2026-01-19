/**
 * secondPassValidator.js
 * "The Intelligence Layer"
 * 
 * Purpose: 
 * Re-evaluates Low/Medium confidence findings by applying distinct "Smoothing" strategies.
 * If a finding passes after smoothing/tolerance adjustment, it is marked as 'noise' or 'resolved'.
 */

import { ROOM_POLICY } from "../policy/roomPolicy.js";

function smoothGeometry(val) {
    // "Virtual Grid Snap": If value is 2.98, treat as 3.0
    // Heuristic: Round to nearest 0.1 if within 0.05 deviation
    const rounded = Math.round(val * 10) / 10;
    if (Math.abs(val - rounded) < 0.04) {
        return rounded;
    }
    return val;
}

export function runSecondPass(finding, layout) {
    // Only attempt to resolve Low/Medium confidence items
    // High confidence items are usually structurally definitive.
    if (!finding.confidence || finding.confidence.score > 0.85) {
        return { resolved: false };
    }

    const { rule, data } = finding;

    // Strategy 1: Geometric Smoothing for Area/Width
    if (rule === "MIN_ROOM_AREA" && data && data.actual) {
        const smoothedArea = smoothGeometry(data.actual);
        const required = data.required;

        // Check if smoothed passes
        if (smoothedArea >= required) {
            return {
                resolved: true,
                method: "GEOMETRIC_SMOOTHING",
                message: `Auto-resolved: ${data.actual}m² acts as ${smoothedArea}m² (Grid Snap)`
            };
        }
    }

    if (rule === "MIN_ROOM_WIDTH" && data && data.actual) {
        const smoothedWidth = smoothGeometry(data.actual);
        const required = data.required;

        if (smoothedWidth >= required) {
            return {
                resolved: true,
                method: "GEOMETRIC_SMOOTHING",
                message: `Auto-resolved: ${data.actual}m acts as ${smoothedWidth}m (Grid Snap)`
            };
        }
    }

    // Strategy 2: Contextual waiver (e.g. Study used as Bedroom)
    // Complexity: Requires semantic understanding of intent. 
    // For now, if confidence is very low (<0.4), we can auto-suppress as noise.
    if (finding.confidence.score < 0.45) {
        return {
            resolved: true,
            method: "NOISE_FILTER",
            message: "Suppressed due to low confidence and high ambiguity."
        };
    }

    return { resolved: false };
}
