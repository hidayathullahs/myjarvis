/**
 * Semantic Pipeline
 * Orchestrates the transformation from Raw Geometry -> Structured Architecture.
 * Input: ExtractionResult (Walls/Lines)
 * Output: SemanticModels.Building
 */

import { SemanticModels } from './semanticModel';
import { TopologyBuilder } from './topologyBuilder';
import { RoomDetector } from './roomDetector';
import { ScaleResolver } from './scaleResolver';

export const SemanticPipeline = {
    /**
     * Run the semantic reconstruction logic.
     * @param {Object} extractionResult - Output from GeometryPipeline
     * @param {Object} userConfig - { scaleOverride }
     * @returns {Object} SemanticModels.Building populated
     */
    run: (extractionResult, userConfig = {}) => {
        const building = { ...SemanticModels.Building, floors: [] };

        // 1. Resolve Scale
        // We do this early or late? 
        // Logic: if we do it early, all semantic units are meters.
        // If we do it late, semantic units are pixels and we store scale factor.
        // Recommendation: Convert to METERS in Semantic Model for purity.

        const scaleMeta = ScaleResolver.resolve(extractionResult.walls, userConfig.scaleOverride);
        const pxPerMeter = scaleMeta.ratio;

        // 2. Build Topology (Graph)
        const topology = TopologyBuilder.buildGraph(extractionResult.walls);

        // 3. Detect Rooms
        const rooms = RoomDetector.detectRooms(topology);

        // 4. Transform to Semantics (and apply scale)
        // Convert extracted walls to Semantic Walls (with meter units)
        const semanticWalls = extractionResult.walls.map(w => ({
            ...w,
            start: { x: w.start.x / pxPerMeter, y: w.start.y / pxPerMeter },
            end: { x: w.end.x / pxPerMeter, y: w.end.y / pxPerMeter },
            thickness: w.thickness // Already meters in default extraction model? 
            // Actually extractionAssembler mock used 0.15 'standard'. 
            // Let's assume Assembler outputs 'logical' meters or pixels? 
            // Assembler output: start:{x,y} were raw pixels from line detector. 
            // Thickness was hardcoded 0.15 (meters). This is a unit mismatch in M2.
            // Correction: Assembler should output pixels or normalized units. 
            // Let's assume Assembler outputs PIXELS for coords, and METERS for thickness (intent).
            // So we divide coords by pxPerMeter.
        }));

        const semanticRooms = rooms.map(r => ({
            ...r,
            polygon: r.polygon.map(p => ({ x: p.x / pxPerMeter, y: p.y / pxPerMeter })),
            area: r.area / (pxPerMeter * pxPerMeter),
            center: { x: r.center.x / pxPerMeter, y: r.center.y / pxPerMeter }
        }));

        // 5. Structure into Floor
        const floor0 = {
            ...SemanticModels.Floor,
            id: `floor_0`,
            level: 0,
            rooms: semanticRooms,
            walls: semanticWalls,
            scale: {
                pixelsPerMeter: pxPerMeter,
                confidence: scaleMeta.confidence
            }
        };

        building.floors.push(floor0);
        building.meta.created = Date.now();
        building.meta.totalArea = semanticRooms.reduce((acc, r) => acc + r.area, 0);

        return building;
    }
};
