/**
 * @fileoverview Plot Model & Intelligence
 * Handles land boundary normalization, validation, and usable area calculation.
 */

import { v4 as uuidv4 } from 'uuid';

export const PLOT_SHAPES = {
    RECTANGLE: 'RECTANGLE',
    L_SHAPE: 'L_SHAPE',
    IRREGULAR: 'IRREGULAR'
};

export class PlotModel {
    constructor(data) {
        this.plotId = data.plotId || uuidv4();
        this.shape = data.shape || PLOT_SHAPES.RECTANGLE;

        // Normalize dimensions to meters
        this.dimensions = {
            width: Number(data.width),
            length: Number(data.length)
        };

        this.orientation = data.orientation || 'NORTH';
        this.roadFacingSide = data.roadFacingSide || 'FRONT'; // FRONT, BACK, LEFT, RIGHT

        // Validation
        this.validate();

        // Computed props
        this.totalArea = this.dimensions.width * this.dimensions.length;
        this.boundary = this._generateBoundaryParams();
    }

    validate() {
        if (!this.dimensions.width || !this.dimensions.length) {
            throw new Error("Invalid Plot Dimensions: Width and Length are required.");
        }
        if (this.dimensions.width < 3 || this.dimensions.length < 3) {
            throw new Error("Plot too small: Minimum dimension is 3 meters.");
        }
    }

    _generateBoundaryParams() {
        // For MVP, we assume a simple rectangle starting at 0,0
        return {
            x: 0,
            y: 0,
            width: this.dimensions.width,
            length: this.dimensions.length
        };
    }

    /**
     * Applies local building by-laws (Setbacks) to determine buildable envelope
     * @param {Object} rules - Setback rules
     */
    calculateBuildableArea(rules = { front: 1.5, back: 1.0, sides: 1.0 }) {
        const buildable = {
            x: rules.sides,
            y: rules.front, // Assuming Front is Y=0 for now, or determining based on orientation
            width: this.dimensions.width - (rules.sides * 2), // Side setbacks on both sides
            length: this.dimensions.length - (rules.front + rules.back)
        };

        if (buildable.width < 3 || buildable.length < 3) {
            throw new Error("Unbuildable Plot: Setbacks reduce area below minimum viable size.");
        }

        return buildable;
    }
}
