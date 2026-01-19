/**
 * Timeline Analytics
 * Computes trends, velocity, and volatility from the Timeline Store.
 * Pure math. Deterministic.
 */

export const TimelineAnalytics = {
    analyze: (snapshots) => {
        if (!snapshots || snapshots.length < 2) {
            return {
                trend: 'STABLE',
                velocity: 0,
                volatility: 'LOW',
                persistence: 0
            };
        }

        const latest = snapshots[snapshots.length - 1];
        const oldest = snapshots[0];
        const durationSec = (latest.timestamp - oldest.timestamp) / 1000;

        if (durationSec === 0) return { trend: 'STABLE', velocity: 0, volatility: 'LOW', persistence: 0 };

        // 1. Velocity (Rate of expected risk change - Conceptual)
        // Since risk levels are categorical, we map them conceptually: Stable=0, Caution=25, Warning=50, Critical=100
        const mapScore = (level) => {
            if (level === 'critical') return 100;
            if (level === 'warning') return 50;
            if (level === 'advisory') return 25;
            return 0;
        };

        const scoreRecent = mapScore(latest.risk.level);
        const scoreOld = mapScore(oldest.risk.level);

        const velocity = (scoreRecent - scoreOld) / durationSec; // Score points per second

        let trend = 'FLAT';
        if (velocity > 5) trend = 'RISING';
        else if (velocity < -5) trend = 'FALLING';

        // 2. Volatility (Frequency of state changes)
        let reversals = 0;
        let lastLevel = snapshots[0].risk.level;

        for (let i = 1; i < snapshots.length; i++) {
            if (snapshots[i].risk.level !== lastLevel) {
                reversals++;
                lastLevel = snapshots[i].risk.level;
            }
        }

        // reversal rate per second
        const reversalRate = reversals / durationSec;
        let volatility = 'LOW';
        if (reversalRate > 0.5) volatility = 'MEDIUM';
        if (reversalRate > 1.0) volatility = 'HIGH';

        // 3. Persistence (Duration of current state)
        // Backtrack from end
        let persistenceMs = 0;
        const currentLevel = latest.risk.level;
        for (let i = snapshots.length - 2; i >= 0; i--) {
            if (snapshots[i].risk.level === currentLevel) {
                persistenceMs += (snapshots[i + 1].timestamp - snapshots[i].timestamp);
            } else {
                break;
            }
        }

        return {
            trend,
            velocity, // + or - score/sec
            volatility,
            persistence: persistenceMs / 1000 // seconds
        };
    }
};
