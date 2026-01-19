/**
 * Performance Monitor & Metrics Store
 * A lightweight, toggleable debug overlay for tracking system health in production.
 * 
 * Usage:
 * import { PerformanceMonitor, PerformanceMetrics } from './debug/PerformanceMonitor';
 * 
 * // Report metrics:
 * PerformanceMetrics.report('sim', 12); // ms
 * 
 * // Render:
 * <PerformanceMonitor />
 */

import React, { useState, useEffect, useRef } from 'react';

// --- METRICS STORE (Singleton) ---
const metricsStore = {
    sim: { current: 0, max: 0, avg: 0, samples: 0 },
    cv: { current: 0, max: 0, avg: 0, samples: 0 },
    explain: { current: 0, max: 0, avg: 0, samples: 0 },
    forecast: { current: 0, max: 0, avg: 0, samples: 0 },
    fps: 0
};

export const PerformanceMetrics = {
    report: (category, valueMs) => {
        if (!metricsStore[category]) return;

        const m = metricsStore[category];
        m.current = valueMs;
        m.max = Math.max(m.max, valueMs);
        m.samples++;
        m.avg = ((m.avg * (m.samples - 1)) + valueMs) / m.samples;
    },

    getSnapshot: () => ({ ...metricsStore })
};

// --- MONITOR COMPONENT ---
export function PerformanceMonitor() {
    const [visible, setVisible] = useState(false);
    const [snapshot, setSnapshot] = useState(metricsStore);
    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());

    // Toggle with 'Alt + D'
    useEffect(() => {
        const handleKeys = (e) => {
            if (e.altKey && e.key === 'd') {
                setVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    // FPS Loop
    useEffect(() => {
        if (!visible) return;

        let frameId;
        const loop = () => {
            frameCount.current++;
            const now = performance.now();
            const delta = now - lastTime.current;

            if (delta >= 1000) {
                metricsStore.fps = Math.round((frameCount.current * 1000) / delta);
                frameCount.current = 0;
                lastTime.current = now;

                // Force Update UI
                setSnapshot(JSON.parse(JSON.stringify(metricsStore)));
            }

            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [visible]);

    if (!visible) return null;

    // Helper for coloring
    const getColor = (val, thresholds) => {
        if (val > thresholds.critical) return 'text-red-500 font-bold';
        if (val > thresholds.warn) return 'text-yellow-400';
        return 'text-green-400';
    };

    return (
        <div className="fixed top-2 right-2 z-[9999] bg-black/80 border border-gray-700 p-2 rounded text-[10px] font-mono shadow-xl backdrop-blur-md pointer-events-none select-none">
            <div className="text-gray-400 font-bold mb-1 border-b border-gray-700 pb-1">PERF MONITOR (ALT+D)</div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {/* FPS */}
                <span className="text-gray-500">FPS</span>
                <span className={getColor(60 - snapshot.fps, { warn: 15, critical: 30 })}>
                    {snapshot.fps}
                </span>

                {/* MEMORY */}
                <span className="text-gray-500">MEMORY</span>
                <span className="text-cyan-400">
                    {window.performance?.memory ? Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB' : 'N/A'}
                </span>

                {/* SIMULATION */}
                <span className="text-gray-500">SIM LATENCY</span>
                <span className={getColor(snapshot.sim.current, { warn: 16, critical: 33 })}>
                    {snapshot.sim.current.toFixed(1)}ms
                </span>

                {/* EXPLAINABILITY */}
                <span className="text-gray-500">EXPLAIN CPU</span>
                <span className={getColor(snapshot.explain.current, { warn: 5, critical: 10 })}>
                    {snapshot.explain.current.toFixed(1)}ms
                </span>

                {/* CV WORKER */}
                <span className="text-gray-500">CV WORKER</span>
                <span className={getColor(snapshot.cv.current, { warn: 100, critical: 500 })}>
                    {snapshot.cv.current.toFixed(0)}ms
                </span>

                {/* FORECAST */}
                <span className="text-gray-500">FORECAST</span>
                <span className={getColor(snapshot.forecast.current, { warn: 5, critical: 10 })}>
                    {snapshot.forecast.current.toFixed(1)}ms
                </span>
            </div>

            <div className="mt-2 pt-1 border-t border-gray-700 text-gray-500 text-[9px]">
                MAX SIM: {snapshot.sim.max.toFixed(1)}ms
            </div>
        </div>
    );
}
