/**
 * @fileoverview Cost Estimator Engine (Feature #7)
 * Provides concept-level construction cost estimation based on built-up area and quality.
 * DISCLAIMER: Advisory only. Not a final contract value.
 */

// Rates per Sq. Ft (Conceptual Average)
const CONSTRUCTION_RATES = {
    'BASIC': 1600,    // Economy finish
    'STANDARD': 2200, // Good finish, standard tiles/fittings
    'PREMIUM': 3000,  // Luxury finish, marble, high-end fittings
    'LUXURY': 4500    // Top-tier custom materials
};

export class CostEstimator {

    /**
     * Calculates estimated construction cost
     * @param {number} areaSqM - Total Built-up Area in Square Meters
     * @param {number} floors - Number of floors
     * @param {string} quality - 'BASIC' | 'STANDARD' | 'PREMIUM' | 'LUXURY'
     */
    static calculate(areaSqM, floors, quality = 'STANDARD') {
        // Convert to Sq. Ft for rate calculation
        const areaSqFt = areaSqM * 10.764;
        const rate = CONSTRUCTION_RATES[quality] || CONSTRUCTION_RATES['STANDARD'];

        // Base Cost
        const baseCost = areaSqFt * rate;

        // Multipliers
        // Multi-floor adds structural complexity (approx 5% per floor above G+1)
        const floorMultiplier = 1 + (Math.max(0, floors - 2) * 0.05);

        const totalEstimated = baseCost * floorMultiplier;

        // Breakdown (Heuristic Industry Standard)
        const breakdown = {
            structure: totalEstimated * 0.40, // Concrete, Steel, Masonry
            finishes: totalEstimated * 0.35,  // Flooring, Paint, Windows
            services: totalEstimated * 0.15,  // Electrical, Plumbing
            misc: totalEstimated * 0.10       // Overhead, Contingency
        };

        return {
            total: Math.round(totalEstimated),
            ratePerSqFt: Math.round(totalEstimated / areaSqFt),
            areaSqFt: Math.round(areaSqFt),
            currency: 'INR', // Default for now, could be dynamic
            breakdown: breakdown,
            disclaimer: "Rough Order of Magnitude (ROM) Estimate. +/- 15% Accuracy."
        };
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(amount);
    }
}
