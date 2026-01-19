export const ROOM_POLICY = {
    bedroom: {
        minArea: 9,
        minWidth: 2.7
    },
    masterBedroom: {
        minArea: 12,
        minWidth: 3.0
    },
    kitchen: {
        minArea: 5,
        ventilationRequired: true
    },
    toilet: {
        minArea: 2.0,
        notFacingDining: true
    },
    livingRoom: {
        minArea: 10
    },
    corridor: {
        minWidth: 1.0
    }
};
