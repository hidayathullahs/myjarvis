/**
 * resizeRooms.js
 * Mutator: Slightly adjusts room dimensions to optimize area/aspect ratio.
 * Safe limits: +/- 10%
 */

export function mutateResizeRooms(layout, intensity = 0.05) {
    // Deep clone to avoid mutating original
    const nextLayout = JSON.parse(JSON.stringify(layout));

    // Pick a random room to resize
    const targetIndex = Math.floor(Math.random() * nextLayout.rooms.length);
    const room = nextLayout.rooms[targetIndex];

    if (!room.width || !room.length) return nextLayout; // Skip irregular shapes for now

    // Randomly decide width or length or both
    const dimension = Math.random() > 0.5 ? 'width' : 'length';
    const change = (Math.random() * 2 - 1) * intensity; // -0.05 to +0.05

    if (dimension === 'width') {
        room.width = Number((room.width * (1 + change)).toFixed(2));
    } else {
        room.length = Number((room.length * (1 + change)).toFixed(2));
    }

    // Recalculate area
    room.area = Number((room.width * room.length).toFixed(2));

    return {
        layout: nextLayout,
        mutationDescription: `Resized ${room.type} (${dimension} ${change > 0 ? '+' : ''}${(change * 100).toFixed(1)}%)`
    };
}
