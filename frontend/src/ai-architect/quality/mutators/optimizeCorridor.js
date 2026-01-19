/**
 * optimizeCorridor.js
 * Mutator: Attempts to shrink corridor area if it exceeds ratio.
 */

export function mutateOptimizeCorridor(layout) {
    const nextLayout = JSON.parse(JSON.stringify(layout));

    const widthReductionBy = 0.95; // Shrink by 5%

    let changed = false;

    nextLayout.rooms.forEach(room => {
        if (room.type === 'corridor') {
            // Safe check: Don't go below 1.0m (Policy will catch, but we can be smart)
            if (room.width * widthReductionBy >= 0.95) {
                room.width = Number((room.width * widthReductionBy).toFixed(2));
                room.area = Number((room.width * room.length).toFixed(2));
                changed = true;
            }
        }
    });

    return {
        layout: nextLayout,
        mutationDescription: changed ? "Optimized Corridor Width (-5%)" : "Corridor already minimal"
    };
}
