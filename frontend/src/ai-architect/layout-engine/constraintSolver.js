/**
 * @fileoverview Deterministic Constraint Solver (Room Packing Engine)
 * Implements a Greedy Zone Partitioning + Backtracking approach to place rooms.
 * 
 * ALGORITHM:
 * 1. Define Virtual Grid (0.5m resolution).
 * 2. Partition Grid into ZONES (Public, Private, Service).
 * 3. Sort Rooms by Priority (Fixed Order: Parking -> Stairs -> Living -> ...).
 * 4. Iteratively place rooms into optimal zones.
 * 5. Validate Constraints (Dimensions, Overlap, Bounds).
 */

const GRID_SIZE = 0.5; // Meters per cell

// Priority Maps to Zones
const PRIORITY_ORDER = [
    'PARKING', 'STAIRS', 'LIVING', 'KITCHEN', 'MASTER_BEDROOM', 'BEDROOM', 'BATH', 'TOILET'
];

const STRATEGIES = {
    'STANDARD': {
        'PARKING': ['FRONT_ACCESS'],
        'STAIRS': ['CENTRAL', 'SIDE'],
        'LIVING': ['FRONT', 'CENTRAL_OPEN'],
        'KITCHEN': ['REAR_CORNER', 'SIDE'],
        'MASTER_BEDROOM': ['REAR_QUIET'],
        'BEDROOM': ['REAR', 'SIDE_QUIET'],
        'BATH': ['INTERNAL_SHAFT', 'SIDE'],
        'TOILET': ['INTERNAL_SHAFT']
    },
    'PRIVACY': {
        'PARKING': ['FRONT_ACCESS'],
        'STAIRS': ['SIDE_ENTRY'], // External access preferred? Or Side
        'LIVING': ['CENTRAL'], // Buffer from road
        'KITCHEN': ['REAR'],
        'MASTER_BEDROOM': ['REAR_FAR'], // Deeper privacy
        'BEDROOM': ['REAR_SIDE'],
        'BATH': ['INTERNAL'],
        'TOILET': ['INTERNAL']
    },
    'SOCIAL_OPEN': {
        'PARKING': ['FRONT_ACCESS'],
        'STAIRS': ['SIDE'],
        'LIVING': ['FRONT_WIDE'], // Large front area
        'KITCHEN': ['CENTRAL_OPEN'], // Integrated
        'MASTER_BEDROOM': ['REAR'],
        'BEDROOM': ['REAR'],
        'BATH': ['SIDE'],
        'TOILET': ['SIDE']
    }
};

import { StairModel, STAIR_TYPES } from '../vertical-engine/stairModel';
import { StackValidator } from '../vertical-engine/stackValidator';

export class ConstraintSolver {

    /**
     * Solves the layout for ALL floors based on requirements.
     * @param {Object} plot 
     * @param {Object} requirements 
     * @param {Object} config 
     */
    solve(plot, requirements, config = {}) {
        const floors = requirements.floors || 1;
        console.log(`[AI Architect] Solving Multi-Floor Layout (${floors} Levels)...`);

        const multiLevelResult = {
            success: true,
            floors: [],
            logs: [],
            unplacedTotal: 0
        };

        // Vertical Anchors (Stairs, Lifts) that must persist across floors
        let fixedZones = {};

        // 1. Pre-Calculate Stair Footprint (if floors > 1)
        if (floors > 1) {
            // For MVP, assume U-Shape is standard
            const stairSpec = StairModel.calculateFootprint(STAIR_TYPES.U_SHAPE, 3.0);
            // This spec is used during placement
            config.stairSpec = stairSpec;
        }

        for (let level = 0; level < floors; level++) {
            // 2. Solve Individual Floor
            console.log(`--- Solving Floor ${level} ---`);
            const floorResult = this._solveFloor(plot, requirements, config, level, fixedZones);

            if (!floorResult.success) {
                multiLevelResult.success = false;
            }

            multiLevelResult.floors.push({
                level: level,
                name: level === 0 ? 'GROUND_FLOOR' : `FLOOR_${level}`,
                ...floorResult
            });

            multiLevelResult.unplacedTotal += floorResult.unplaced.length;
            multiLevelResult.logs.push(...floorResult.logs);

            // 3. Extract Anchors for Next Floor
            const stairs = floorResult.rooms.find(r => r.type === 'STAIRS');
            if (stairs) {
                fixedZones['STAIRS'] = stairs;
                console.log(`[Vertical] Stacked Stairs at [${stairs.x}, ${stairs.y}]`);
            }
        }

        return multiLevelResult;
    }

    _solveFloor(plot, requirements, config, level, fixedZones) {
        // ... (Existing Logic, slightly adapted) ...
        // 1. Initialize Constraints with Setbacks (F-02)
        const setbacks = config.setbacks || { front: 1.5, back: 1.0, sides: 1.0 };
        const buildable = plot.calculateBuildableArea(setbacks);

        // 2. Initialize Virtual Grid
        const grid = this._createGrid(buildable);

        // 3. Define Zones
        const zones = this._partitionZones(buildable, plot.roadFacingSide);

        // 4. Sort Rooms (Filter for this floor)
        const roomsForLevel = this._getRoomsForLevel(requirements.rooms, level);
        const sortedRooms = this._sortRooms(roomsForLevel);

        const placedRooms = [];
        const unplacedRooms = [];
        const logs = [];

        // Select Strategy (F-06)
        const strategyName = config.strategy || 'STANDARD';
        // const zonePreferences = STRATEGIES[strategyName] || STRATEGIES['STANDARD']; 
        // (Accessing global STRATEGIES - need to ensure it's in scope or move to class property)
        // For now, assuming STRATEGIES is available in file scope as before.
        const zonePreferences = (typeof STRATEGIES !== 'undefined' ? STRATEGIES : this._strategies())[strategyName];


        // 5. Placement Loop
        try {
            for (const room of sortedRooms) {
                // Inject Stair Spec dimensions if it's a stair
                if (room.type === 'STAIRS' && config.stairSpec) {
                    room.minWidth = config.stairSpec.width;
                    room.minArea = config.stairSpec.width * config.stairSpec.length;
                }

                const result = this._placeRoom(room, grid, zones, placedRooms, buildable, zonePreferences, fixedZones);

                if (result.success) {
                    placedRooms.push(result.room);
                    this._markGrid(grid, result.room);
                    logs.push(`Placed ${room.type} at [${result.room.x}, ${result.room.y}]`);
                } else {
                    unplacedRooms.push({ ...room, reason: result.reason });
                    logs.push(`FAILED: ${room.type} - ${result.reason}`);
                }
            }
        } catch (err) {
            console.error("Constraint Solver Loop Failure:", err);
            logs.push(`CRITICAL SOLVER ERROR: ${err.message}`);
        }

        return {
            success: unplacedRooms.length === 0,
            strategy: strategyName,
            width: buildable.width,
            length: buildable.length,
            rooms: placedRooms,
            unplaced: unplacedRooms,
            efficiency: this._calculateEfficiency(placedRooms, buildable),
            logs: logs
        };
    }

    /* Helper to define strategies if not global */
    _strategies() {
        return {
            'STANDARD': { 'PARKING': ['FRONT_ACCESS'], 'STAIRS': ['CENTRAL', 'SIDE'], 'LIVING': ['FRONT'], 'KITCHEN': ['REAR_CORNER'], 'MASTER_BEDROOM': ['REAR'], 'BEDROOM': ['SIDE_QUIET'], 'BATH': ['INTERNAL_SHAFT'], 'TOILET': ['INTERNAL_SHAFT'] },
            'PRIVACY': { 'PARKING': ['FRONT_ACCESS'], 'STAIRS': ['SIDE_ENTRY'], 'LIVING': ['CENTRAL'], 'KITCHEN': ['REAR'], 'MASTER_BEDROOM': ['REAR_FAR'], 'BEDROOM': ['REAR_SIDE'], 'BATH': ['INTERNAL'], 'TOILET': ['INTERNAL'] },
            'SOCIAL_OPEN': { 'PARKING': ['FRONT_ACCESS'], 'STAIRS': ['SIDE'], 'LIVING': ['FRONT_WIDE'], 'KITCHEN': ['CENTRAL_OPEN'], 'MASTER_BEDROOM': ['REAR'], 'BEDROOM': ['REAR'], 'BATH': ['SIDE'], 'TOILET': ['SIDE'] }
        };
    }

    _getRoomsForLevel(allRooms, level) {
        // Filter logic:
        // Ground (0): Living, Kitchen, Parking, Stairs. 
        // Upper (1+): Bedrooms, Stairs.
        // For MVP, we'll implement a simple split if not explicitly defined.

        return allRooms.filter(r => {
            // Stairs and Lift exist on ALL floors if total floors > 1
            if (r.type === 'STAIRS') return true;

            // Parking only on Ground
            if (r.type === 'PARKING') return level === 0;

            // Living/Kitchen usually Ground (unless inverted)
            if (['LIVING', 'KITCHEN'].includes(r.type)) return level === 0;

            // Bedrooms: Distribute? 
            // Logic: Master Bed on Lvl 1 if G+1? Or Master on Ground?
            // Simplification: Master on Ground for accessibility, others up.
            if (r.type === 'MASTER_BEDROOM') return level === 0; // Or configurable

            if (r.type === 'BEDROOM') {
                // Distribute remaining beds
                // Hack: Assign based on ID index?
                // Better: If level > 0, take beds that "don't fit" on ground?
                // For now: All beds on Ground for Single Floor. 
                // If Multilevel: Move standard beds to Lvl 1.
                return level > 0;
            }

            // Baths attached to beds - assume same level
            if (r.type === 'BATH') return true; // Need smarter logic

            return true;
        });
    }

    _createGrid(bounds) {
        const rows = Math.ceil(bounds.length / GRID_SIZE);
        const cols = Math.ceil(bounds.width / GRID_SIZE);
        // 2D Array: 0 = Empty, 1 = Occupied
        return Array(rows).fill().map(() => Array(cols).fill(0));
    }

    _partitionZones(bounds, roadSide) {
        // Simple 3-Tier Split for MVP
        // Front (30%), Central (30%), Rear (40%)
        const length = bounds.length;

        return {
            FRONT: { yStart: 0, yEnd: length * 0.3 },
            CENTRAL: { yStart: length * 0.3, yEnd: length * 0.6 },
            REAR: { yStart: length * 0.6, yEnd: length }
        };
    }

    _sortRooms(rooms) {
        return [...rooms].sort((a, b) => {
            const idxA = PRIORITY_ORDER.indexOf(a.type);
            const idxB = PRIORITY_ORDER.indexOf(b.type);
            // If type priority is same, larger area first
            if (idxA === idxB) return b.minArea - a.minArea;
            // Otherwise low index (high priority) first
            return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        });
    }

    _placeRoom(room, grid, zones, placedRooms, bounds, zonePreferences, fixedZones = {}) {
        // Internal Helper to attempt placement with specific bounds
        const tryPlacement = (restrictToZone) => {
            const preferences = zonePreferences[room.type] || ['CENTRAL'];
            let startY = 0;
            let endY = bounds.length;

            if (restrictToZone) {
                // Bias search based on room type
                if (preferences.includes('REAR') || preferences.includes('REAR_QUIET') || preferences.includes('REAR_CORNER')) {
                    startY = zones.REAR.yStart;
                } else if (preferences.includes('CENTRAL') || preferences.includes('CENTRAL_OPEN')) {
                    startY = zones.CENTRAL.yStart;
                    endY = zones.REAR.yStart;
                } else if (preferences.includes('FRONT') || preferences.includes('FRONT_ACCESS') || preferences.includes('FRONT_WIDE')) {
                    endY = zones.CENTRAL.yStart;
                }
            }

            // Search Grid for a valid rectangle
            const widthCells = Math.ceil(room.minWidth / GRID_SIZE);
            const heightCells = Math.ceil((room.minArea / room.minWidth) / GRID_SIZE);

            // Bounds Safety
            if (widthCells > grid[0].length || heightCells > grid.length) {
                return { success: false, reason: 'Room exceeds plot bounds' };
            }

            // Iterate rows
            const rStart = Math.max(0, Math.floor(startY / GRID_SIZE));
            const rEnd = Math.min(grid.length - heightCells, Math.floor(endY / GRID_SIZE));

            for (let r = rStart; r <= rEnd; r++) {
                for (let c = 0; c <= (bounds.width / GRID_SIZE) - widthCells; c++) {

                    // 1. Check Grid Fit
                    if (this._canFit(grid, r, c, widthCells, heightCells)) {

                        const candidateRoom = {
                            id: room.id,
                            type: room.type,
                            x: c * GRID_SIZE, // Relative to buildable origin
                            y: r * GRID_SIZE,
                            width: widthCells * GRID_SIZE,
                            length: heightCells * GRID_SIZE,
                            color: this._getRoomColor(room.type)
                        };

                        // 2. Check Vertical Stack (F-21)
                        const stackCheck = StackValidator.validate(candidateRoom, fixedZones);
                        if (!stackCheck.valid) {
                            continue; // Skip this pos
                        }

                        return {
                            success: true,
                            room: candidateRoom
                        };
                    }
                }
            }
            return { success: false, reason: restrictToZone ? 'Zone constraint' : 'No valid space' };
        };

        // 1. Attempt Preferred Zone Strategy
        const zoneAttempt = tryPlacement(true);
        if (zoneAttempt.success) return zoneAttempt;

        // 2. Fallback: Search Entire Buildable Area
        // console.log(`[Solver] Relaxing constraints for ${room.type}`);
        return tryPlacement(false);
    }

    _canFit(grid, row, col, w, h) {
        if (row + h >= grid.length || col + w >= grid[0].length) return false;

        for (let r = row; r < row + h; r++) {
            for (let c = col; c < col + w; c++) {
                if (grid[r][c] !== 0) return false; // Collision
            }
        }
        return true;
    }

    _markGrid(grid, room) {
        const rStart = Math.floor(room.y / GRID_SIZE);
        const cStart = Math.floor(room.x / GRID_SIZE);
        const h = Math.ceil(room.length / GRID_SIZE);
        const w = Math.ceil(room.width / GRID_SIZE);

        for (let r = rStart; r < rStart + h; r++) {
            for (let c = cStart; c < cStart + w; c++) {
                grid[r][c] = 1;
            }
        }
    }

    _calculateEfficiency(rooms, bounds) {
        const totalRoomArea = rooms.reduce((sum, r) => sum + (r.width * r.length), 0);
        const buildableArea = bounds.width * bounds.length;
        return (totalRoomArea / buildableArea).toFixed(2);
    }

    _getRoomColor(type) {
        const colors = {
            'LIVING': '#4ade80', // Green
            'BEDROOM': '#60a5fa', // Blue
            'KITCHEN': '#facc15', // Yellow
            'BATH': '#38bdf8',
            'PARKING': '#94a3b8'
        };
        return colors[type] || '#ffffff';
    }
}
