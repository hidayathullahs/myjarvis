/**
 * @fileoverview Staircase Model (Cluster B - Spec 1.A)
 * Deterministic calculation of staircase dimensions based on type and floor height.
 */

export const STAIR_TYPES = {
    STRAIGHT: 'STRAIGHT',
    U_SHAPE: 'U_SHAPE', // Dog-legged
    L_SHAPE: 'L_SHAPE',
    SPIRAL: 'SPIRAL'
};

const DEFAULTS = {
    RISER: 0.175, // 175mm
    TREAD: 0.250, // 250mm
    WIDTH: 1.2,   // 1.2m clear width (Grid aligned)
    LANDING: 1.2  // 1.2m landing depth
};

export class StairModel {

    /**
     * Calculates the required footprint (Width x Length) for a staircase.
     * @param {string} type - STAIR_TYPES enum
     * @param {number} floorHeight - Height in meters (default 3.0m)
     */
    static calculateFootprint(type, floorHeight = 3.0) {
        const stepsRequired = Math.ceil(floorHeight / DEFAULTS.RISER);

        let width = 0;
        let length = 0;
        let flights = 1;

        switch (type) {
            case STAIR_TYPES.U_SHAPE:
                // 2 Flights + 1 Mid-Landing
                // Width = Flight Width * 2 + Gap (approx 0.1)
                width = (DEFAULTS.WIDTH * 2) + 0.2;
                // Length = (Steps/2 * Tread) + Landing
                const stepsPerFlight = Math.ceil(stepsRequired / 2);
                length = (stepsPerFlight * DEFAULTS.TREAD) + DEFAULTS.LANDING;
                flights = 2;
                break;

            case STAIR_TYPES.L_SHAPE:
                // Corner placement
                // Approx 2.0m x 2.0m for compact residential
                width = 2.0;
                length = 2.0;
                flights = 2;
                break;

            case STAIR_TYPES.STRAIGHT:
            default:
                // 1 Long Flight
                width = DEFAULTS.WIDTH;
                length = (stepsRequired * DEFAULTS.TREAD) + DEFAULTS.LANDING;
                break;
        }

        // Snap to Grid (0.5m chunks) for cleaner solver
        return {
            type,
            width: Math.ceil(width * 2) / 2,
            length: Math.ceil(length * 2) / 2,
            details: {
                steps: stepsRequired,
                flights,
                tread: DEFAULTS.TREAD,
                riser: (floorHeight / stepsRequired).toFixed(3)
            }
        };
    }
}
