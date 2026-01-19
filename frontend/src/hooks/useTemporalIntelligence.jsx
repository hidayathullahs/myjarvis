/**
 * useTemporalIntelligence Hook
 * Orchestrates the temporal layer: Recording -> Analytics -> Forecasting.
 * Separates time-based reasoning from the rigid Twin State.
 */

import { useEffect, useState, useRef } from 'react';
import { TimelineStore } from '../digital-twin/timeline/timelineStore';
import { TimelineAnalytics } from '../digital-twin/timeline/timelineAnalytics';
import { SystemLog, LOG_TYPES } from '../runtime/systemLog';
import { ForecastEngine } from '../digital-twin/simulation/forecastEngine';
import { ReasonModel } from '../digital-twin/explainability/reasonModel';
import { NarrativeEngine } from '../digital-twin/explainability/narrativeEngine';
import { PerformanceMetrics } from '../debug/PerformanceMonitor';

export function useTemporalIntelligence(twinState) {
    const [temporalInsights, setTemporalInsights] = useState({
        trend: 'STABLE',
        velocity: 0,
        volatility: 'LOW',
        forecast: null
    });

    const lastSnapshotTime = useRef(0);

    useEffect(() => {
        if (!twinState) return;

        const now = Date.now();
        // Throttle recording to ~5Hz (200ms) to avoid spamming the timeline
        if (now - lastSnapshotTime.current > 200) {

            // 1. Record Snapshot
            TimelineStore.addSnapshot(twinState);
            lastSnapshotTime.current = now;

            // 2. Run Analytics (Async-like to not block, but simple math is fast enough here)
            const history = TimelineStore.getHistory(10); // Look at last 10 seconds
            const analytics = TimelineAnalytics.analyze(history);

            // 3. Run Forecast
            const forecast = ForecastEngine.predict(analytics, {
                timestamp: now,
                risk: twinState.risk
            });

            // 4. Update Result
            // 4. Run Reasoning (Explainability)
            const temporalData = {
                trend: analytics.trend,
                velocity: analytics.velocity,
                volatility: analytics.volatility,
                forecast
            };
            const findings = ReasonModel.analyze(twinState, temporalData);
            const explanationText = NarrativeEngine.generateBrief(findings);

            // 5. Update Result
            setTemporalInsights({
                ...temporalData,
                explanation: {
                    text: explanationText,
                    findings // pass raw findings for detailed breakdown if needed
                }
            });

            // Log significant temporal shifts
            if (analytics.volatility !== 'LOW' || analytics.trend !== 'STABLE') {
                SystemLog.info(LOG_TYPES.TIMELINE, `Trend: ${analytics.trend}, Volatility: ${analytics.volatility}`);
            }
        }
    }, [twinState]); // Dependency on twinState ensures we react to changes

    return temporalInsights;
}
