/**
 * @fileoverview Constraint Validator (F-04)
 * Pre-validation layer to reject impossible design requests before the solver runs.
 */

export class ConstraintValidator {

    /**
     * Validates if the requirements can physically fit on the plot.
     * @param {Object} plotModel - The PlotModel instance
     * @param {Object} reqSpecs - The parsed requirements object
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    static validate(plotModel, reqSpecs) {
        const errors = [];
        const buildable = plotModel.calculateBuildableArea();

        // 1. Area Check
        const buildableArea = buildable.width * buildable.length;
        // Sum of all room minAreas
        const totalMinReq = reqSpecs.rooms.reduce((sum, r) => sum + r.minArea, 0);

        // Heuristic: Add 20% for circulation/walls
        const estimatedUsage = totalMinReq * 1.25;

        // Check Coverage (Floor Area Ratio check stub)
        // If single floor, usage must be < buildable
        const coveragePerFloor = estimatedUsage / reqSpecs.floors;

        if (coveragePerFloor > buildableArea) {
            errors.push(`Area Violation: Req needs ~${coveragePerFloor.toFixed(1)}m²/floor, but plot allows only ${buildableArea.toFixed(1)}m². Try adding floors or removing rooms.`);
        }

        // 2. Dimension Check (Min Width)
        // Check if the plot is narrower than the widest room required
        const widestRoom = Math.max(...reqSpecs.rooms.map(r => r.minWidth));
        if (buildable.width < widestRoom) {
            errors.push(`Width Violation: Plot width (${buildable.width}m) is too narrow for standard room sizes (${widestRoom}m).`);
        }

        return {
            valid: errors.length === 0,
            errors,
            metrics: {
                buildableArea,
                requiredArea: estimatedUsage,
                utilization: (coveragePerFloor / buildableArea).toFixed(2)
            }
        };
    }
}
