import { calculateBalancedScore } from './balancedScoreEngine.js';

// Mock Layout 1: Small, Efficient, but maybe tight
const mockLayout1 = {
    rooms: [
        { type: 'masterBedroom', area: 14, width: 3.5, length: 4.0 },
        { type: 'bedroom', area: 10, width: 3.2, length: 3.2 },
        { type: 'livingRoom', area: 22, width: 4.5, length: 5.0 },
        { type: 'kitchen', area: 8, width: 2.5, length: 3.2 },
        { type: 'toilet', area: 4, width: 2.0, length: 2.0 },
        { type: 'corridor', area: 4, width: 1.2, length: 3.5 }
    ],
    stairs: null
};

// Mock Layout 2: Sprawling, Big, Expensive
const mockLayout2 = {
    rooms: [
        { type: 'masterBedroom', area: 20, width: 4.0, length: 5.0 }, // Generous
        { type: 'bedroom', area: 15, width: 3.0, length: 5.0 }, // Aspect ratio warning (5/3 = 1.66 ok)
        { type: 'bedroom', area: 15, width: 2.0, length: 7.5 }, // Aspect ratio warning (7.5/2 = 3.75 bad)
        { type: 'livingRoom', area: 40, width: 5.0, length: 8.0 },
        { type: 'kitchen', area: 15, width: 3.0, length: 5.0 },
        { type: 'toilet', area: 6, width: 2.0, length: 3.0 },
        { type: 'toilet', area: 6, width: 2.0, length: 3.0 },
        { type: 'toilet', area: 6, width: 2.0, length: 3.0 }, // Many wet areas
        { type: 'corridor', area: 20, width: 1.5, length: 13.0 } // High circulation
    ],
    stairs: { width: 1.2 }
};

console.log("\n--- Layout 1 (Efficient) ---");
console.log(JSON.stringify(calculateBalancedScore(mockLayout1), null, 2));

console.log("\n--- Layout 2 (Sprawling/Complex) ---");
console.log(JSON.stringify(calculateBalancedScore(mockLayout2), null, 2));
