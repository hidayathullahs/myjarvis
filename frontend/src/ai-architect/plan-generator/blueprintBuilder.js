/**
 * @fileoverview Blueprint Renderer (2D)
 * Converts Semantic Layout Data into an SVG string for visualization.
 */

export class BlueprintBuilder {

    /**
     * Renders a layout to an SVG string
     * @param {Object} layout - The solver output
     * @returns {string} SVG string
     */
    render(layout) {
        const { width, length, rooms, plot } = layout;
        const padding = 2; // meters
        const scale = 50; // pixels per meter for SVG viewbox

        const svgWidth = (width + padding * 2) * scale;
        const svgHeight = (length + padding * 2) * scale;

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" style="background:white; font-family:sans-serif;">`;

        // 1. Draw Plot Boundary
        svg += this._drawRect(
            padding * scale,
            padding * scale,
            width * scale,
            length * scale,
            'none',
            '#000',
            2
        );

        // 2. Draw Rooms
        if (rooms && Array.isArray(rooms)) {
            rooms.forEach((room) => {
                const x = (room.x + padding) * scale;
                const y = (room.y + padding) * scale;
                const w = room.width * scale;
                const h = room.length * scale;

                // Room Fill
                svg += this._drawRect(x, y, w, h, room.color || '#eee', '#333', 1);

                // Room Label
                svg += this._drawText(
                    x + w / 2,
                    y + h / 2,
                    room.type.replace('_', ' '),
                    12,
                    '#000'
                );

                // Dimensions
                svg += this._drawText(
                    x + w / 2,
                    y + h / 2 + 15,
                    `${room.width.toFixed(1)}m x ${room.length.toFixed(1)}m`,
                    10,
                    '#555'
                );
            });
        }

        // 3. Compass / North Arrow
        svg += this._drawCompass(svgWidth - 50, 50);

        // 4. Disclaimer
        svg += this._drawText(svgWidth / 2, svgHeight - 20, "CONCEPT LAYOUT ONLY - NOT FOR CONSTRUCTION", 14, "red");

        svg += `</svg>`;
        return svg;
    }

    _drawRect(x, y, w, h, fill, stroke, strokeWidth) {
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
    }

    _drawText(x, y, text, size, color) {
        return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="middle" alignment-baseline="middle">${text}</text>`;
    }

    _drawCompass(x, y) {
        // Simple N symbol
        return `<g transform="translate(${x},${y})">
            <text x="0" y="0" font-size="20" font-weight="bold">N</text>
            <path d="M0,5 L5,20 L-5,20 Z" fill="black" />
        </g>`;
    }
}
