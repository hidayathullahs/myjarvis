/**
 * Room Analytics
 * Computes spatial metrics for individual rooms.
 * Pure logic, side-effect free.
 */

export const RoomAnalytics = {
    /**
     * computeVisibility
     * Calculates how much of the room is visible/accessible based on state.
     * @param {Object} room - Semantic Room
     * @param {Object} context - { clipPlane, obstacles }
     * @returns {number} 0.0 - 1.0 visibility score
     */
    computeVisibility: (room, context) => {
        // Mock Implementation of logical intersection for MVP
        // In real system: Polygon intersection with frustum/clip plane.

        let visibility = 1.0;

        // 1. Clipping Impact
        // If a clip plane cuts through the room, visibility drops.
        if (context.clipPlane) {
            const center = room.center;
            // Distance from plane
            // Plane equation: Ax + By + Cz + D = 0
            // Normal (A,B,C), Constant D.
            // Distance = n.dot(p) + d

            // Simplification: If global clip is active and covers this room's center
            // We reduce visibility.
            if (context.clipPlane.active) {
                // Mock: random reduction based on room index for demo variety
                // Real: Signed distance check
                visibility *= 0.8;
            }
        }

        return visibility;
    },

    /**
     * computeConnectivity
     * Checks if this room is connected effectively to the main graph.
     */
    computeConnectivity: (room, graph) => {
        // If room has < 1 opening, it's a cell.
        if (!room.openings || room.openings.length === 0) return 0.1;
        return 1.0;
    }
};
