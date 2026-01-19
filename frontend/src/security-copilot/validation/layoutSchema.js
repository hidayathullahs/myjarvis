export function validateLayout(layout) {
    if (!layout || !Array.isArray(layout.rooms)) return false;

    return layout.rooms.every(r =>
        typeof r.name === "string" &&
        typeof r.area === "number" &&
        typeof r.width === "number" &&
        typeof r.length === "number"
    );
}
