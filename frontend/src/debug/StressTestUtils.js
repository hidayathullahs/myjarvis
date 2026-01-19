/**
 * Stress Test Utilities
 * Methods to artificially load the system to verify stability.
 * 
 * Usage:
 * import { StressTestUtils } from './debug/StressTestUtils';
 * StressTestUtils.spamRiskEvents(100);
 */

import { TimelineStore } from '../digital-twin/timeline/timelineStore';
import { PerformanceMetrics } from './PerformanceMonitor';

export const StressTestUtils = {
    /**
     * FLOOD TIMELINE: Injects N snapshots instantly.
     * Verifies buffer capping and analytics resilience.
     */
    floodTimeline: (count = 100) => {
        console.log(`[STRESS] Flooding timeline with ${count} snapshots...`);
        const start = performance.now();

        for (let i = 0; i < count; i++) {
            const mockState = {
                risk: { level: Math.random() > 0.5 ? 'critical' : 'stable', score: Math.random() },
                confidence: { value: Math.random() },
                clipping: { enabled: Math.random() > 0.5 },
                ui: { mode: 'view' }
            };
            TimelineStore.addSnapshot(mockState);
        }

        const duration = performance.now() - start;
        console.log(`[STRESS] Flood complete. Took ${duration.toFixed(2)}ms`);
    },

    /**
     * TOGGLE SPAM: Rapidly flips risk state to test volatility detector and HUD.
     */
    spamRiskEvents: () => {
        console.log(`[STRESS] Starting Risk Spam (5s)...`);
        let i = 0;
        const interval = setInterval(() => {
            // This would need to hook into the actual twin state setter 
            // or simulation engine if available globally.
            // For now, we simulate the effect by reporting fake high-cost explanation cycles.
            PerformanceMetrics.report('explain', Math.random() * 20);

            if (i++ > 50) clearInterval(interval);
        }, 100);
    },

    /**
     * HEAVY MATH LOAD: Blocks main thread to test FPS drop detection.
     */
    induceLag: (ms = 50) => {
        const start = performance.now();
        while (performance.now() - start < ms) {
            // burn CPU
            Math.sqrt(Math.random());
        }
    }
};
