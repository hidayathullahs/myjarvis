/**
 * @fileoverview Layout Mutation Engine (Sprint 3 - Spec 2.A)
 * Handles state transitions for interactive editing.
 */

import { ConstraintGuard } from './constraintGuard';

const SNAP_GRID = 0.5; // Meters

export class LayoutMutationEngine {

    /**
     * Moves a room to a new position.
     * @param {Object} layout - Current layout state
     * @param {string} roomId - ID of room to move
     * @param {number} newX - Unsnapped X
     * @param {number} newY - Unsnapped Y
     * @param {Object} bounds - Constraint bounds
     */
    static moveRoom(layout, roomId, newX, newY, bounds) {
        // 1. Deep clone to avoid direct mutation validation issues
        const nextLayout = JSON.parse(JSON.stringify(layout));
        const room = nextLayout.rooms.find(r => r.id === roomId);

        if (!room) return { success: false, error: 'Room not found' };

        // 2. Snap to Grid
        const snappedX = Math.round(newX / SNAP_GRID) * SNAP_GRID;
        const snappedY = Math.round(newY / SNAP_GRID) * SNAP_GRID;

        // 3. Apply Tentative Change
        room.x = snappedX;
        room.y = snappedY;

        // 4. Validate
        const validation = ConstraintGuard.validate(room, bounds, nextLayout.rooms);

        if (!validation.valid) {
            return {
                success: false,
                reason: validation.blockers[0],
                layout: layout // Return original
            };
        }

        // 5. Success
        // TODO: Re-calc corridors via FlowEngine (Part B)
        return {
            success: true,
            layout: nextLayout
        };
    }

    /**
     * Resizes a room.
     */
    static resizeRoom(layout, roomId, newWidth, newLength, bounds) {
        const nextLayout = JSON.parse(JSON.stringify(layout));
        const room = nextLayout.rooms.find(r => r.id === roomId);

        if (!room) return { success: false, error: 'Room not found' };

        const snappedW = Math.max(0.5, Math.round(newWidth / SNAP_GRID) * SNAP_GRID);
        const snappedL = Math.max(0.5, Math.round(newLength / SNAP_GRID) * SNAP_GRID);

        room.width = snappedW;
        room.length = snappedL;

        const validation = ConstraintGuard.validate(room, bounds, nextLayout.rooms);

        if (!validation.valid) {
            return {
                success: false,
                reason: validation.blockers[0],
                layout: layout
            };
        }

        return {
            success: true,
            layout: nextLayout
        };
    }
}
