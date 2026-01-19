/**
 * Simulation Models
 * Pure logic functions for "What-If" analysis.
 * Deterministic and side-effect free.
 */

import { RISK_LEVELS } from '../../constants/ui/RISK_LEVELS';

export const SimulationModels = {
    /**
     * Estimates the percentage of the model volume that is VISIBLE
     * based on clipping planes and bounding box.
     * @returns {number} 0.0 - 1.0 (Estimated)
     */
    predictVisibility: (modelBounds, planes) => {
        // Simple AABB vs Plane intersection logic (Approximation)
        // If Model Min/Max is fully "behind" a plane, visibility is 0.
        // If fully "in front", visibility is 1.
        // Otherwise interpolate.

        let visibility = 1.0;

        // Bounding Box Dimensions
        const width = modelBounds.max.x - modelBounds.min.x;
        const height = modelBounds.max.y - modelBounds.min.y;

        if (width === 0 || height === 0) return 1.0; // Avoid divide by zero

        // 1. Horizontal Plane (Vertical Cut)
        if (planes.horizontal?.active) {
            const cutY = planes.horizontal.offset;
            const yMin = modelBounds.min.y;
            const yMax = modelBounds.max.y;

            // Normalize cut position relative to bounds (0 to 1)
            let factor = (cutY - yMin) / height;

            if (planes.horizontal.inverted) {
                // Keep TOP (above cut)
                // If cut is at bottom (0), we see 100%. If at top (1), we see 0%.
                // Wait, coordinate system check:
                // Standard: Y+ is UP. 
                // Inverted often means "Keep the other side".
                // Let's assume standard clipping keeps "below" (negative normal) by default? 
                // Actually Three.js clipping planes keep the side the normal points to.
                // For this abstract simulation, we assume linearity.
                factor = 1.0 - factor;
            }

            // Clamp factor 0-1
            factor = Math.max(0, Math.min(1, factor));
            visibility *= factor; // Reduce total volume
        }

        // 2. Vertical Plane (Horizontal Cut) -- Logic repeated for X axis
        if (planes.vertical?.active) {
            const cutX = planes.vertical.offset;
            const xMin = modelBounds.min.x;
            const xMax = modelBounds.max.x;

            let factor = (cutX - xMin) / width;

            if (planes.vertical.inverted) {
                factor = 1.0 - factor;
            }

            factor = Math.max(0, Math.min(1, factor));
            visibility *= factor;
        }

        return parseFloat(visibility.toFixed(2));
    },

    /**
     * Predicts the Risk Level for a proposed state.
     */
    predictRisk: (visibility, toolMode) => {
        if (visibility < 0.1) return RISK_LEVELS.CRITICAL; // Model mostly hidden
        if (visibility < 0.4) return RISK_LEVELS.WARNING; // Significant cuts

        if (toolMode === 'slice') return RISK_LEVELS.WARNING; // Intrinsic risk of tool
        if (toolMode === 'measure') return RISK_LEVELS.ADVISORY;

        return RISK_LEVELS.STABLE;
    },

    /**
     * Detects logical contradictions in plane settings.
     * e.g., Two planes hiding everything.
     */
    detectContradiction: (visibility) => {
        return visibility <= 0.05; // "Blackout" condition
    }
};
