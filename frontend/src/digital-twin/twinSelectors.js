/**
 * Digital Twin Selectors
 * Read-only derived data views.
 * Pure functions: State -> Value.
 */

export const TwinSelectors = {
    // Basic Reads
    getModelName: (state) => state.model.name,
    isModelLoaded: (state) => state.model.loaded,

    // Derived Logic
    activeRiskDrivers: (state) => state.risk.drivers,

    // Geometry logic
    getModelVolume: (state) => {
        if (!state.model.loaded || !state.model.dimensions) return 0;
        const { x, y, z } = state.model.dimensions;
        return x * y * z;
    },

    // Traceability
    getLastAction: (state) => state.history.length > 0 ? state.history[state.history.length - 1] : null,

    // UI Helpers
    shouldShowWarning: (state) => state.risk.level === 'warning' || state.risk.level === 'critical',

    // Clipping Status
    isSlicingActive: (state) => state.clipping.enabled && (state.clipping.planes.horizontal.active || state.clipping.planes.vertical.active)
};
