/**
 * @fileoverview Stack Validator (Cluster B - Spec 2.A)
 * Ensures 'Vertical Anchors' (Stairs, Lifts) occupy the same XY coordinates across floors.
 */

export class StackValidator {

    /**
     * Checks if a proposed room placement aligns with the vertical stack.
     * @param {Object} room - The room attempting to be placed
     * @param {Object} fixedZones - Map of fixed zones from lower floors
     */
    static validate(room, fixedZones) {
        // If this room IS a vertical anchor (Stairs/Lift), it MUST match the fixed zone
        if (room.type === 'STAIRS' || room.type === 'LIFT') {
            const anchor = fixedZones[room.type];

            // If no anchor exists yet (Ground Floor), it's valid (and will become the anchor)
            if (!anchor) return { valid: true };

            // Check tolerance (floating point/grid)
            const xMatch = Math.abs(room.x - anchor.x) < 0.1;
            const yMatch = Math.abs(room.y - anchor.y) < 0.1;

            if (xMatch && yMatch) {
                return { valid: true };
            } else {
                return {
                    valid: false,
                    reason: `Vertical Misalignment: Must stack on top of Ground Floor ${room.type} at [${anchor.x}, ${anchor.y}]`
                };
            }
        }

        // If normal room, check it doesn't collide with existing anchors from below
        // (Only relevant if we are placing 'around' a void, but grid occupancy usually handles this.
        // This is a double-check).
        for (const [type, anchor] of Object.entries(fixedZones)) {
            // Simple AABB collision check
            if (this._detectCollision(room, anchor)) {
                return {
                    valid: false,
                    reason: `Collision with Vertical Shaft: ${type}`
                };
            }
        }

        return { valid: true };
    }

    static _detectCollision(r1, r2) {
        return !(r2.x >= r1.x + r1.width ||
            r2.x + r2.width <= r1.x ||
            r2.y >= r1.y + r1.length ||
            r2.y + r2.length <= r1.y);
    }
}
