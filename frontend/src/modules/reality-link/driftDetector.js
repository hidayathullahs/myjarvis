/**
 * @fileoverview Reality-Link Drift Detector
 * Comparison Engine: Real-World Sensors <---> Digital Twin Model
 */

import { RISK_LEVELS } from '../../constants/ui/RISK_LEVELS';

// Simulated Drift Events for Simulation Mode (since we lack real sensors)
const MOCK_DRIFT_SCENARIOS = [
    { type: 'OBSTRUCTION', severity: 'MEDIUM', location: 'Hallway_North', description: 'Unmapped Obstacle Detected' },
    { type: 'GEOMETRY_MISMATCH', severity: 'HIGH', location: 'Server_Room', description: 'Wall Alignment Deviation > 10cm' },
    { type: 'SENSOR_LOSS', severity: 'LOW', location: 'Sector_4', description: 'Camera Feed Interrupted' },
    { type: 'THERMAL_ANOMALY', severity: 'MEDIUM', location: 'Power_Unit', description: 'Temperature drift correlated with risk' }
];

class DriftDetector {
    constructor() {
        this.activeDrifts = [];
        this.monitoring = false;
        this.onDriftDetected = null; // Callback
    }

    startMonitoring(callback) {
        this.onDriftDetected = callback;
        this.monitoring = true;
        console.log('[RealityLink] Drift Detection Active. Monitoring sensor streams...');

        // Start Simulation Loop
        this.simulationInterval = setInterval(() => {
            this.runCycle();
        }, 15000); // Check every 15s in background
    }

    stopMonitoring() {
        this.monitoring = false;
        clearInterval(this.simulationInterval);
        console.log('[RealityLink] Drift Detection Paused.');
    }

    runCycle() {
        if (!this.monitoring) return;

        // 1. Simulate Probability of Drift (Low in stable state)
        // In real app, this would be: `const drift = correlate(lidarScan, twinMesh)`
        const randomChance = Math.random();

        if (randomChance > 0.85) { // 15% chance of event per cycle
            const scenario = MOCK_DRIFT_SCENARIOS[Math.floor(Math.random() * MOCK_DRIFT_SCENARIOS.length)];
            this.triggerDrift(scenario);
        }
    }

    triggerDrift(scenario) {
        const timestamp = Date.now();
        const event = {
            id: `DRIFT-${timestamp}`,
            ...scenario,
            timestamp,
            confidence: Math.random() * 0.5 + 0.4 // 0.4 - 0.9
        };

        this.activeDrifts.push(event);
        console.warn(`[RealityLink] DRIFT DETECTED: ${event.description}`);

        if (this.onDriftDetected) {
            this.onDriftDetected(event);
        }
    }

    // Resolve a drift event (Operator confirms/fixes)
    resolveDrift(id) {
        this.activeDrifts = this.activeDrifts.filter(d => d.id !== id);
        return true;
    }

    getStatus() {
        return {
            active: this.monitoring,
            driftCount: this.activeDrifts.length,
            drifts: this.activeDrifts
        };
    }
}

export const driftDetector = new DriftDetector();
