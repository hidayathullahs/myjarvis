import { optimizeLayout } from './variationOptimizer.js';

const mockBaseLayout = {
    rooms: [
        { type: 'masterBedroom', area: 13, width: 3.5, length: 3.71, name: "Master" },
        { type: 'bedroom', area: 10, width: 3.2, length: 3.12, name: "Bed 2" },
        { type: 'livingRoom', area: 20, width: 4.5, length: 4.44, name: "Living" },
        { type: 'corridor', area: 6, width: 1.2, length: 5.0, name: "Hall" }
    ],
    stairs: null
};

console.log("Starting Optimization Loop...");
const results = optimizeLayout({ baseLayout: mockBaseLayout, maxVariants: 20 });

console.log("\n--- Optimization Leaderboard ---");
results.forEach((res, index) => {
    console.log(`#${index + 1} [${res.type}] Score: ${res.score.totalScore} | Change: ${res.changes.join(", ")}`);
    console.log(`    Breakdown: Cost(${res.score.breakdown.cost}) Comfort(${res.score.breakdown.comfort}) Energy(${res.score.breakdown.energy})`);
});
