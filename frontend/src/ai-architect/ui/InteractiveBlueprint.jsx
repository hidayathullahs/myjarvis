import React, { useState, useRef, useEffect } from 'react';
import { LayoutMutationEngine } from '../editor/layoutMutationEngine';

const GRID_SIZE = 0.5; // Meters
const SCALE = 20; // Pixels per Meter

export default function InteractiveBlueprint({ layout, onLayoutChange, readOnly = false }) {
    const [dragging, setDragging] = useState(null); // { id, startX, startY, initialRoomX, initialRoomY }
    const [hovered, setHovered] = useState(null);
    const svgRef = useRef(null);

    // Local state for smooth drag preview before commit
    const [previewLayout, setPreviewLayout] = useState(layout);

    useEffect(() => {
        setPreviewLayout(layout);
    }, [layout]);

    const handleMouseDown = (e, room) => {
        if (readOnly) return;
        e.preventDefault();
        const svgRect = svgRef.current.getBoundingClientRect();
        setDragging({
            id: room.id,
            startX: e.clientX,
            startY: e.clientY,
            initialRoomX: room.x,
            initialRoomY: room.y
        });
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;

        const deltaPixelsX = e.clientX - dragging.startX;
        const deltaPixelsY = e.clientY - dragging.startY;

        const deltaMetersX = deltaPixelsX / SCALE;
        const deltaMetersY = deltaPixelsY / SCALE;

        const newX = dragging.initialRoomX + deltaMetersX;
        const newY = dragging.initialRoomY + deltaMetersY;

        // Optimistic UI Update (Snap for display)
        const snappedX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        const snappedY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

        const updatedRooms = previewLayout.rooms.map(r => {
            if (r.id === dragging.id) {
                return { ...r, x: snappedX, y: snappedY };
            }
            return r;
        });

        setPreviewLayout({ ...previewLayout, rooms: updatedRooms });
    };

    const handleMouseUp = (e) => {
        if (!dragging) return;

        // Commit Change
        const room = previewLayout.rooms.find(r => r.id === dragging.id);

        // Call Mutation Engine to Validate & Commit
        const result = LayoutMutationEngine.moveRoom(layout, dragging.id, room.x, room.y, { width: layout.width, length: layout.length });

        if (result.success) {
            onLayoutChange(result.layout);
        } else {
            // Revert
            setPreviewLayout(layout);
            alert(`Move Invalid: ${result.reason}`);
        }

        setDragging(null);
    };

    // Calculate Dynamic Canvas Size
    const canvasWidth = layout.width * SCALE + 100;
    const canvasHeight = layout.length * SCALE + 100;
    const padding = 50;

    return (
        <div className="overflow-auto bg-gray-50 border border-gray-300 rounded relative select-none">
            <svg
                ref={svgRef}
                width={canvasWidth}
                height={canvasHeight}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="cursor-crosshair"
            >
                {/* Grid Lines */}
                <defs>
                    <pattern id="grid" width={GRID_SIZE * SCALE} height={GRID_SIZE * SCALE} patternUnits="userSpaceOnUse">
                        <path d={`M ${GRID_SIZE * SCALE} 0 L 0 0 0 ${GRID_SIZE * SCALE}`} fill="none" stroke="#e5e7eb" strokeWidth="1" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Plot Boundary */}
                <rect
                    x={padding}
                    y={padding}
                    width={layout.width * SCALE}
                    height={layout.length * SCALE}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                />

                {/* Rooms */}
                {previewLayout.rooms.map(room => (
                    <g
                        key={room.id}
                        transform={`translate(${padding + room.x * SCALE}, ${padding + room.y * SCALE})`}
                        onMouseDown={(e) => handleMouseDown(e, room)}
                        onMouseEnter={() => setHovered(room.id)}
                        onMouseLeave={() => setHovered(null)}
                        style={{ cursor: readOnly ? 'default' : 'move' }}
                    >
                        <rect
                            width={room.width * SCALE}
                            height={room.length * SCALE}
                            fill={room.color}
                            fillOpacity={dragging?.id === room.id ? 0.8 : 0.6}
                            stroke={hovered === room.id || dragging?.id === room.id ? '#000' : 'none'}
                            strokeWidth={2}
                            rx={4}
                        />
                        <text
                            x={5}
                            y={15}
                            fontSize="10"
                            fontWeight="bold"
                            fill="#000"
                            style={{ pointerEvents: 'none' }}
                        >
                            {room.type}
                        </text>
                        <text
                            x={5}
                            y={room.length * SCALE - 5}
                            fontSize="8"
                            fill="#4b5563"
                            style={{ pointerEvents: 'none' }}
                        >
                            {room.width.toFixed(1)}x{room.length.toFixed(1)}
                        </text>
                    </g>
                ))}
            </svg>

            {!readOnly && (
                <div className="absolute top-2 left-2 bg-white/90 p-2 rounded text-xs shadow text-gray-600">
                    Interact Mode: Drag to Move. (Snap: 0.5m)
                </div>
            )}
        </div>
    );
}
