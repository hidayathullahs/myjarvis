/**
 * @fileoverview Constraint Guard (Sprint 3 - Spec 2.D)
 * Real-time safety layer for Interactive Editor.
 * Checks individual room mutations against hard and soft constraints.
 */

const MIN_DIMS = {
    'BEDROOM': { minArea: 9.0, minWidth: 2.7 },
    'MASTER_BEDROOM': { minArea: 11.0, minWidth: 3.0 },
    'KITCHEN': { minArea: 4.5, minWidth: 1.8 },
    'LIVING': { minArea: 12.0, minWidth: 3.0 },
    'BATH': { minArea: 2.5, minWidth: 1.2 },
    'PARKING': { minArea: 12.5, minWidth: 2.5 },
    'STAIRS': { minArea: 6.0, minWidth: 1.2 }
};

export class ConstraintGuard {

    /**
     * Validates a proposed room change.
     * @param {Object} room - The modified room object {x, y, width, length, type}
     * @param {Object} plot - Plot bounds {width, length}
     * @param {Array} otherRooms - List of other rooms (for collision check)
     */
    static validate(room, plot, otherRooms = []) {
        const result = {
            valid: true,
            blockers: [],
            warnings: []
        };

        // 1. BOUNDARY CHECK (Hard Block)
        // Check fit within Build Area (assuming plot passed is buildable area)
        if (room.x < 0 || room.y < 0 ||
            (room.x + room.width) > plot.width + 0.01 ||
            (room.y + room.length) > plot.length + 0.01) {

            result.valid = false;
            result.blockers.push("Room extends outside buildable area.");
            return result; // Early exit
        }

        // 2. COLLISION CHECK (Hard Block)
        // Skip corridors for now (they are fluid)
        if (room.type !== 'CORRIDOR') {
            for (const other of otherRooms) {
                if (other.id === room.id) continue; // Skip self
                if (other.type === 'CORRIDOR') continue;

                if (this._detectOverlap(room, other)) {
                    result.valid = false;
                    result.blockers.push(`Overlaps with ${other.type}`);
                    return result;
                }
            }
        }

        // 3. DIMENSION CHECK (Hard Block)
        const rules = MIN_DIMS[room.type] || { minArea: 2.0, minWidth: 1.0 };
        const area = room.width * room.length;

        if (room.width < rules.minWidth - 0.01 || room.length < rules.minWidth - 0.01) {
            // Allow length/width swap but ensure at least one dim meets width req? 
            // Strictly: minWidth usually applies to the narrower dimension.
            const minSide = Math.min(room.width, room.length);
            if (minSide < rules.minWidth - 0.01) {
                result.valid = false;
                result.blockers.push(`Example too narrow (Min ${rules.minWidth}m)`);
            }
        }

        if (area < rules.minArea - 0.01) {
            result.valid = false;
            result.blockers.push(`Area too small (${area.toFixed(1)}m² < ${rules.minArea}m²)`);
        }

        // 4. SOFT WARNINGS
        // Orientation check could go here if we had bearing.

        return result;
    }

    static _detectOverlap(r1, r2) {
        // Simple AABB
        // Shrink slightly to allow touching walls
        const tolerance = 0.01;
        return !(r2.x >= r1.x + r1.width - tolerance ||
            r2.x + r2.width <= r1.x + tolerance ||
            r2.y >= r1.y + r1.length - tolerance ||
            r2.y + r2.length <= r1.y + tolerance);
    }
}
