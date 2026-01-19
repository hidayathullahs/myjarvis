/**
 * @fileoverview RC-1 Validation Suite
 * Automated verification of the AI Architect Logic Engine.
 * 
 * SCOPE:
 * - GEN-01: Determinism (Same Input = Same Output)
 * - GEN-02: Constraint Handling (Small Plot = Failure)
 * - GEN-04: Governance (Disclaimers present)
 */

import { ConstraintSolver } from '../layout-engine/constraintSolver.js';
import { ReqParser } from '../design-requirements/reqParser.js';
import { LEGAL_DISCLAIMERS } from '../governance/legalNotices.js';

// Mock PlotModel to avoid uuid dependency issues in test environment
class MockPlotModel {
    constructor(w, l) {
        this.dimensions = { width: w, length: l };
        this.roadFacingSide = 'FRONT';
        this.plotId = 'TEST-PLOT';
    }
    calculateBuildableArea() {
        // Simple setback simulation
        return {
            x: 1, y: 1.5,
            width: this.dimensions.width - 2,
            length: this.dimensions.length - 2.5
        };
    }
}

const runTests = () => {
    console.log("🟦 STARTING RC-1 VALIDATION SWEEP...\n");
    let passed = 0;
    let failed = 0;
    const errors = [];

    // --- TEST 1: GEN-01 DETERMINISM ---
    console.log("🔹 TEST GEN-01: Determinism Verification");
    try {
        const plot = new MockPlotModel(12, 18);
        const reqs = ReqParser.parse({ bedrooms: 2, kitchen: true, parking: true });
        const solver = new ConstraintSolver();

        const runs = [];
        for (let i = 0; i < 5; i++) {
            runs.push(solver.solve(plot, reqs));
        }

        // Compare Run 0 with Runs 1-4
        const ref = JSON.stringify(runs[0].rooms);
        let allMatch = true;
        for (let i = 1; i < 5; i++) {
            if (JSON.stringify(runs[i].rooms) !== ref) {
                allMatch = false;
                break;
            }
        }

        if (allMatch) {
            console.log("   ✅ PASS: 5/5 Runs produced identical output.");
            passed++;
        } else {
            throw new Error("Determinism Failed: Outputs differed between runs.");
        }
    } catch (e) {
        console.log(`   ❌ FAIL: ${e.message}`);
        errors.push("GEN-01");
        failed++;
    }

    // --- TEST 2: GEN-02 CONSTRAINT HANDLING ---
    console.log("\n🔹 TEST GEN-02: Small Plot Rejection");
    try {
        const tinyPlot = new MockPlotModel(5, 5); // Too small for standard requirements
        const reqs = ReqParser.parse({ bedrooms: 3, kitchen: true, parking: true });
        const solver = new ConstraintSolver();

        const result = solver.solve(tinyPlot, reqs);

        // We expect some rooms to be 'unplaced' or efficiency to be low/fail
        if (result.unplaced && result.unplaced.length > 0) {
            console.log(`   ✅ PASS: System correctly rejected placement. Unplaced: ${result.unplaced.length}`);
            passed++;
        } else {
            // It might pass if the logic is very flexible, but 3BHK on 5x5m is impossible with setbacks
            // Let's check result success
            if (!result.success) {
                console.log("   ✅ PASS: Result marked as failure (success=false).");
                passed++;
            } else {
                throw new Error("Safety Failure: Logic allowed 3BHK on 5x5m plot!");
            }
        }
    } catch (e) {
        console.log(`   ❌ FAIL: ${e.message}`);
        errors.push("GEN-02");
        failed++;
    }

    // --- TEST 3: GEN-04 GOVERNANCE CHECKS ---
    console.log("\n🔹 TEST GEN-04: Disclaimer Verification");
    try {
        if (!LEGAL_DISCLAIMERS.CONCEPT_ONLY) throw new Error("Missing CONCEPT_ONLY disclaimer");
        if (!LEGAL_DISCLAIMERS.NO_LIABILITY) throw new Error("Missing NO_LIABILITY disclaimer");

        const text = LEGAL_DISCLAIMERS.CONCEPT_ONLY.short;
        if (text.includes("NOT FOR CONSTRUCTION")) {
            console.log("   ✅ PASS: Legal text includes 'NOT FOR CONSTRUCTION'.");
            passed++;
        } else {
            throw new Error("Legal text weak/incorrect.");
        }
    } catch (e) {
        console.log(`   ❌ FAIL: ${e.message}`);
        errors.push("GEN-04");
        failed++;
    }

    // --- SUMMARY ---
    console.log("\n========================================");
    console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
    if (failed === 0) {
        console.log("🟢 SYSTEM STATUS: STABLE & VALIDATED");
        process.exit(0);
    } else {
        console.log("🔴 SYSTEM STATUS: VALIDATION FAILED");
        process.exit(1);
    }
};

runTests();
