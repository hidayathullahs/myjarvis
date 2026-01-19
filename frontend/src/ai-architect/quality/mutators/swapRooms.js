/**
 * swapRooms.js
 * Mutator: Swaps two rooms of similar size/type to test adjacency improvements.
 */

export function mutateSwapRooms(layout) {
    const nextLayout = JSON.parse(JSON.stringify(layout));

    // Heuristic: Swap two bedrooms, or Bedroom <-> Study. 
    // Don't swap Toilet <-> Living Room (plumbing/logic constraint - though SecurityCopilot would catch it).

    const swapCandidates = nextLayout.rooms.filter(r => ['bedroom', 'guestRoom', 'study'].includes(r.type));

    if (swapCandidates.length < 2) return { layout: nextLayout, mutationDescription: "No swap candidates" };

    // Pick two distinct
    const idx1 = Math.floor(Math.random() * swapCandidates.length);
    let idx2 = Math.floor(Math.random() * swapCandidates.length);
    while (idx1 === idx2) idx2 = Math.floor(Math.random() * swapCandidates.length);

    const roomA = swapCandidates[idx1];
    const roomB = swapCandidates[idx2];

    // Swap generic properties (dimensions might stay with "Location" or move with "Type")
    // In a pure data layout without coords, "swapping" might mean changing the order in the array 
    // OR swapping dimensions if we assume array index = location.
    // Assuming Array Index = Location Slot for this abstract optimizer.

    // Swap definitions
    const temp = { ...roomA };

    // We keep 'type' and 'name' but swap dimensions to simulate moving functionality to the other space?
    // OR we swap the types/names into the existing slots (dimensions).
    // Let's swap Types/Names into the Dimensions (simulate moving the function to the new space).

    const typeA = roomA.type;
    const nameA = roomA.name;

    roomA.type = roomB.type;
    roomA.name = roomB.name;

    roomB.type = typeA;
    roomB.name = nameA;

    return {
        layout: nextLayout,
        mutationDescription: `Swapped ${typeA} with ${roomB.type}` // Note: roomB.type is now the old A type? No wait.
    };
}
