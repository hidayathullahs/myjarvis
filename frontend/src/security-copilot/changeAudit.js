export function diffLayouts(prev, next) {

    const changes = [];

    next.rooms.forEach((room, i) => {
        const prevRoom = prev.rooms[i];
        if (!prevRoom) return;

        if (room.area !== prevRoom.area)
            changes.push(`${room.type} area changed from ${prevRoom.area} → ${room.area}`);

        if (room.width !== prevRoom.width)
            changes.push(`${room.type} width changed from ${prevRoom.width}m → ${room.width}m`);
    });

    return changes;
}
