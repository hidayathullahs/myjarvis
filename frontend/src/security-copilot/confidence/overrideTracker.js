/**
 * overrideTracker.js
 * Tracks human overrides to adjust rule confidence over time.
 * (Mock implementation for purely frontend local state).
 */

// In a real system, this would fetch from backend/DB.
const MOCK_OVERRIDE_STATS = {
    "MIN_ROOM_AREA": { count: 3, total: 50 }, // 6% override rate
    "MIN_ROOM_WIDTH": { count: 12, total: 40 }, // 30% override rate -> Rule is "soft"
    "STAIR_WIDTH": { count: 0, total: 20 }      // 0% override -> Rule is strict
};

export function getOverrideFactor(ruleId) {
    const stats = MOCK_OVERRIDE_STATS[ruleId];
    if (!stats) return 1.0; // No data, assume strict

    const rate = stats.count / stats.total;

    // If > 20% override, lower confidence in strict enforcement
    if (rate > 0.2) return 0.7; // Lowers confidence
    if (rate > 0.1) return 0.9;

    return 1.0; // High confidence
}
