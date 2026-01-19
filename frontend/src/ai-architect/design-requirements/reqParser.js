/**
 * @fileoverview Requirements Parser
 * Converts loose user requirements into strict Spatial Rules for the layout engine.
 */

export const ROOM_TYPES = {
    BEDROOM: 'BEDROOM',
    MASTER_BEDROOM: 'MASTER_BEDROOM',
    KITCHEN: 'KITCHEN',
    LIVING: 'LIVING',
    BATH: 'BATH',
    STAIRS: 'STAIRS',
    PARKING: 'PARKING',
    CORRIDOR: 'CORRIDOR'
};

// Standard Dimensions (Minimums in Meters)
const STANDARDS = {
    [ROOM_TYPES.MASTER_BEDROOM]: { minW: 3.0, minArea: 11.0 }, // ~120 sqft
    [ROOM_TYPES.BEDROOM]: { minW: 2.7, minArea: 9.0 },        // ~100 sqft
    [ROOM_TYPES.KITCHEN]: { minW: 2.1, minArea: 5.5 },        // ~60 sqft
    [ROOM_TYPES.LIVING]: { minW: 3.0, minArea: 14.0 },        // ~150 sqft
    [ROOM_TYPES.BATH]: { minW: 1.2, minArea: 2.8 },           // ~30 sqft
    [ROOM_TYPES.STAIRS]: { minW: 0.9, minArea: 6.0 },
    [ROOM_TYPES.PARKING]: { minW: 2.5, minArea: 12.5 }        // SUV size
};

export class ReqParser {

    static parse(inputs) {
        const specs = {
            floors: inputs.floors || 1,
            rooms: []
        };

        // 1. Mandatory Living Area
        specs.rooms.push(this._createRoomSpec(ROOM_TYPES.LIVING, 1));

        // 2. Kitchen
        if (inputs.kitchen !== false) {
            specs.rooms.push(this._createRoomSpec(ROOM_TYPES.KITCHEN, 1));
        }

        // 3. Bedrooms
        const bedroomCount = inputs.bedrooms || 1;
        // Assume 1 Master Bedroom if count >= 1
        if (bedroomCount > 0) {
            specs.rooms.push(this._createRoomSpec(ROOM_TYPES.MASTER_BEDROOM, 1));
            // Rest are standard
            for (let i = 1; i < bedroomCount; i++) {
                specs.rooms.push(this._createRoomSpec(ROOM_TYPES.BEDROOM, i + 1));
            }
        }

        // 4. Bathrooms
        // Default rule: 1 Bath per 2 bedrooms approx, or user specified
        const bathCount = inputs.bathrooms || Math.max(1, Math.ceil(bedroomCount / 2));
        for (let i = 0; i < bathCount; i++) {
            specs.rooms.push(this._createRoomSpec(ROOM_TYPES.BATH, i + 1));
        }

        // 5. Parking
        if (inputs.parking) {
            specs.rooms.push(this._createRoomSpec(ROOM_TYPES.PARKING, 1));
        }

        // 6. Stairs (if floors > 1)
        if (specs.floors > 1) {
            specs.rooms.push(this._createRoomSpec(ROOM_TYPES.STAIRS, 1));
        }

        return specs;
    }

    static _createRoomSpec(type, index) {
        const std = STANDARDS[type];
        return {
            id: `${type}_${index}`,
            type: type,
            minWidth: std.minW,
            minArea: std.minArea,
            priority: type === ROOM_TYPES.LIVING ? 1 : 2 // 1 is highest
        };
    }
}
