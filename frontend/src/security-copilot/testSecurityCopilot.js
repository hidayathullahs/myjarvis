import { evaluateLayout } from "./securityCopilot.js";

const layout = {
    rooms: [
        { id: "r1", type: "bedroom", area: 8, width: 2.4, length: 3.2, name: "Bed 1" },
        { id: "r2", type: "livingRoom", area: 16, width: 3.8, length: 4.2, name: "Living" }
    ],
    stairs: { width: 0.9 }
};

console.log("Evaluation Result:", JSON.stringify(evaluateLayout(layout), null, 2));
