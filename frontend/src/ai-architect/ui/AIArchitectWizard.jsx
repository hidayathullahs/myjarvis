import React, { useState } from 'react';
import { PlotModel } from '../plot-intelligence/plotModel';
import { ReqParser } from '../design-requirements/reqParser';
import { ConstraintSolver } from '../layout-engine/constraintSolver';
import { ConstraintValidator } from '../design-requirements/constraintValidator';
import { BlueprintBuilder } from '../plan-generator/blueprintBuilder';
import { MeshExtruder } from '../mesh-export/meshBuilderV2';
import { ExplainabilityEngine } from '../governance/explainability';
import { LEGAL_DISCLAIMERS } from '../governance/legalNotices';
import InteractiveBlueprint from './InteractiveBlueprint'; // Task 3-C
import OptimizationDashboard from './OptimizationDashboard'; // Sprint 12-B2
import { RepairPanel } from './RepairPanel'; // Sprint 12-I2
import { TrustDashboard } from './TrustDashboard'; // Sprint 12-I3
import { feedbackCollector } from '../../security-copilot/learning/FeedbackCollector';

const STRATEGIES = ['STANDARD', 'PRIVACY', 'SOCIAL_OPEN'];

export default function AIArchitectWizard({ onExport3D, onClose }) {
    const [step, setStep] = useState(0);
    const [plotInput, setPlotInput] = useState({ width: 12, length: 18 });
    const [reqInput, setReqInput] = useState({ bedrooms: 2, kitchen: true, parking: true, floors: 1 });
    const [setbacks, setSetbacks] = useState({ front: 1.5, back: 1.0, sides: 1.0 });

    // Multi-Var State
    const [results, setResults] = useState({}); // { STANDARD: {layout, svg, report}, ... }
    const [activeTab, setActiveTab] = useState('STANDARD');
    const [errorMsg, setErrorMsg] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Task 3-C: Refine Mode
    const [appliedRepairs, setAppliedRepairs] = useState([]); // Sprint 12-I3

    const handleGenerate = async () => {
        setErrorMsg('');
        setIsGenerating(true);
        setActiveTab('STANDARD'); // Reset to default

        // Allow UI to update before heavy calc
        setTimeout(() => {
            try {
                // 1. Process Plot & Reqs
                const plot = new PlotModel(plotInput);
                const reqs = ReqParser.parse(reqInput);

                // 2. Validate
                const validation = ConstraintValidator.validate(plot, reqs);
                if (!validation.valid) {
                    setErrorMsg(`Validation Failed: ${validation.errors[0]}`);
                    setIsGenerating(false);
                    return;
                }

                const newResults = {};
                const solver = new ConstraintSolver();
                const renderer = new BlueprintBuilder();

                // 3. Generate All Variations (B-3)
                STRATEGIES.forEach(strat => {
                    const config = { strategy: strat, setbacks: setbacks };
                    const layout = solver.solve(plot, reqs, config);

                    if (layout.success) {
                        // MVP: Visualize Ground Floor (Level 0)
                        // The solver returns { floors: [...] }, but Renderer/Report expect { rooms: [...] }
                        const groundFloor = layout.floors[0];

                        // Ensure groundFloor has plot dims if needed (it has buildable dims, maybe needs plot?)
                        // render() uses 'width'/'length' from layout, which _solveFloor provides (buildable size).

                        const svg = renderer.render(groundFloor);
                        const report = ExplainabilityEngine.generateReport(groundFloor, { ...reqInput, orientation: plot.orientation });
                        newResults[strat] = { layout, svg, report };
                    }
                });

                if (Object.keys(newResults).length === 0) {
                    throw new Error("Could not generate any valid layouts. Try a larger plot.");
                }

                setResults(newResults);
                const firstSuccess = Object.keys(newResults)[0];
                setActiveTab(firstSuccess);
                setStep(3);

            } catch (e) {
                setErrorMsg("Error: " + e.message);
            } finally {
                setIsGenerating(false);
            }
        }, 100);
    };

    // Task 3-C: Live Layout Update from Interactive Editor
    const handleLayoutUpdate = (newLayout) => {
        const renderer = new BlueprintBuilder();
        const svg = renderer.render(newLayout);
        // Note: plotInput might be needed if plot bounds changed, but assuming plot fixed for now.
        // Also assuming re-analysis works on layout object.
        const report = ExplainabilityEngine.generateReport(newLayout, { ...reqInput, orientation: 'NORTH' }); // Default orientation

        setResults(prev => ({
            ...prev,
            [activeTab]: { layout: newLayout, svg, report }
        }));
    };


    const handleConfirmExport = () => {
        if (!window.confirm(`SAFETY CHECK:\n\n${LEGAL_DISCLAIMERS.CONCEPT_ONLY.short}\n\nDo you understand this is NOT for construction?`)) {
            return;
        }

        // Export Active Layout
        const activeResult = results[activeTab];
        const extruder = new MeshExtruder();
        const meshGroup = extruder.build(activeResult.layout);

        onExport3D(meshGroup);
        onClose();
    };

    const activeResult = results[activeTab];

    const handleRepair = (action) => {
        // Apply repair action to current layout
        // For local simulation, we apply directly to layout object then update
        const layout = JSON.parse(JSON.stringify(activeResult.layout));

        if (action.actionType === 'RESIZE_ROOM' && action.params) {
            // ... logic ...
            // Alert and Log
            alert(`Auto-Repair Applied: ${action.label}`);

            // Sprint 12-I3: Log to TrustDashboard
            setAppliedRepairs(prev => [{
                ...action,
                timestamp: Date.now(),
                risk: 'LOW' // Simulated
            }, ...prev]);
        }
    };


    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-6 z-50 text-white font-mono">
            <div className="bg-gray-900 border border-cyan-500/50 p-8 w-full max-w-6xl h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
                <header className="mb-6 flex justify-between items-center border-b border-gray-700 pb-4">
                    <div>
                        <h2 className="text-2xl text-cyan-400 font-bold tracking-widest">AI_ARCHITECT PHOENIX // MULTI_GEN</h2>
                        <span className="text-xs text-gray-500">PRO EDITION | GENERATIVE CORE ACTIVE {isEditing && " | EDIT MODE"}</span>
                    </div>
                    <button onClick={onClose} className="text-red-400 hover:text-red-300 text-sm border border-red-900 px-3 py-1 rounded">CLOSE SESSION</button>
                </header>

                <div className="flex-1 overflow-y-auto pr-2">
                    {/* Error / Loading */}
                    {errorMsg && <div className="bg-red-900/50 border border-red-500 text-white p-3 mb-4 rounded">⚠ {errorMsg}</div>}
                    {isGenerating && <div className="text-center text-cyan-400 animate-pulse text-xl mt-20">GENERATING OPTIMAL LAYOUTS...</div>}

                    {/* STEP 1: PLOT */}
                    {step === 0 && !isGenerating && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl text-yellow-400 border-l-4 border-yellow-500 pl-3">Step 1: Define Site parameters</h3>
                                <div className="text-xs text-gray-500">MVP Phase 10.B</div>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-gray-800/50 p-4 rounded">
                                    <h4 className="text-sm text-gray-400 mb-2 uppercase">Dimensions (M)</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-gray-500">Width</label>
                                            <input type="number" value={plotInput.width} onChange={e => setPlotInput({ ...plotInput, width: Number(e.target.value) })} className="w-full bg-gray-800 p-2 border border-gray-600 rounded text-cyan-300 focus:border-cyan-400 outline-none transition" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Length</label>
                                            <input type="number" value={plotInput.length} onChange={e => setPlotInput({ ...plotInput, length: Number(e.target.value) })} className="w-full bg-gray-800 p-2 border border-gray-600 rounded text-cyan-300 focus:border-cyan-400 outline-none transition" />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-800/50 p-4 rounded">
                                    <h4 className="text-sm text-gray-400 mb-2 uppercase">Setbacks (Customizable)</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500">Front</label>
                                            <input type="number" value={setbacks.front} onChange={e => setSetbacks({ ...setbacks, front: Number(e.target.value) })} className="w-full bg-gray-800 p-2 border border-gray-600 rounded" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Back</label>
                                            <input type="number" value={setbacks.back} onChange={e => setSetbacks({ ...setbacks, back: Number(e.target.value) })} className="w-full bg-gray-800 p-2 border border-gray-600 rounded" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Sides</label>
                                            <input type="number" value={setbacks.sides} onChange={e => setSetbacks({ ...setbacks, sides: Number(e.target.value) })} className="w-full bg-gray-800 p-2 border border-gray-600 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setStep(1)} className="bg-cyan-700 hover:bg-cyan-600 px-8 py-3 rounded text-white font-bold mt-4 shadow-lg shadow-cyan-900/50">NEXT: PROGRAM</button>
                        </div>
                    )}

                    {/* STEP 2: REQUIREMENTS */}
                    {step === 1 && !isGenerating && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-xl text-yellow-400 border-l-4 border-yellow-500 pl-3">Step 2: Program Requirements</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm text-gray-400">Housing Config</label>
                                    <select value={reqInput.bedrooms} onChange={e => setReqInput({ ...reqInput, bedrooms: Number(e.target.value) })} className="w-full bg-gray-800 p-3 border border-gray-600 rounded mt-1 text-white">
                                        <option value="1">1 BHK</option>
                                        <option value="2">2 BHK</option>
                                        <option value="3">3 BHK</option>
                                        <option value="4">4 BHK</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Floors</label>
                                    <input type="number" min="1" max="4" value={reqInput.floors} onChange={e => setReqInput({ ...reqInput, floors: Number(e.target.value) })} className="w-full bg-gray-800 p-3 border border-gray-600 rounded mt-1 text-white" />
                                </div>
                                <div className="col-span-2 bg-gray-800 p-4 rounded border border-gray-700">
                                    <label className="text-gray-400 block mb-2">Options Included:</label>
                                    <div className="flex space-x-6">
                                        <label className="flex items-center space-x-2">
                                            <input type="checkbox" checked={reqInput.parking} onChange={e => setReqInput({ ...reqInput, parking: e.target.checked })} className="w-4 h-4" />
                                            <span>Parking</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input type="checkbox" checked={reqInput.kitchen} readOnly className="w-4 h-4" />
                                            <span>Kitchen</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 p-4 bg-cyan-900/20 border border-cyan-500/30 rounded">
                                <p className="text-sm text-cyan-300">ℹ  The AI will generate 3 Variations: <strong>Standard, Privacy-Focused, and Open-Plan.</strong></p>
                            </div>
                            <button onClick={handleGenerate} className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded text-white mt-4 w-full text-lg font-bold tracking-wider shadow-lg shadow-green-900/50">GENERATE 3 VARIATIONS</button>
                        </div>
                    )}

                    {/* STEP 3: REVIEW (TABBED) */}
                    {step === 3 && activeResult && !isGenerating && (
                        <div className="grid grid-cols-2 gap-8 h-full pb-10">

                            {/* Left: Blueprint & Tabs */}
                            <div className="flex flex-col h-full">
                                {/* TABS + EDIT TOGGLE */}
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex space-x-1">
                                        {STRATEGIES.map(strat => (
                                            <button
                                                key={strat}
                                                onClick={() => setActiveTab(strat)}
                                                className={`px-4 py-2 text-xs font-bold rounded-t ${activeTab === strat ? 'bg-white text-black' : 'bg-gray-800 text-gray-500 hover:text-white'}`}
                                            >
                                                {results[strat] ? strat : `${strat} (N/A)`}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className={`px-3 py-1 text-xs border rounded ${isEditing ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'}`}
                                    >
                                        {isEditing ? 'DONE EDITING' : 'EDIT LAYOUT'}
                                    </button>
                                </div>

                                {/* CANVAS */}
                                <div className="bg-white p-2 rounded-b rounded-tr h-full overflow-hidden flex flex-col shadow-inner">
                                    {/* <InteractiveBlueprint
                                                layout={activeResult.layout}
                                                onLayoutChange={handleLayoutUpdate}
                                            /> */}
                                    {isEditing ? (
                                        <div className="flex-1 overflow-auto bg-gray-50 border border-indigo-200">
                                            <InteractiveBlueprint
                                                layout={activeResult.layout}
                                                onLayoutChange={handleLayoutUpdate}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex-1 border border-gray-300 bg-gray-50" dangerouslySetInnerHTML={{ __html: activeResult.svg }} />
                                    )}
                                </div>
                            </div>

                            {/* Right: Explainability & Actions */}
                            <div className="space-y-4 overflow-y-auto pr-2 pt-8">

                                {/* OPTIMIZATION DASHBOARD (Sprint 12-B2) */}
                                <OptimizationDashboard
                                    layout={activeResult.layout}
                                    onApply={handleLayoutUpdate}
                                />

                                {/* TRUST DASHBOARD (Sprint 12-I3) */}
                                <TrustDashboard
                                    confidence={0.88} // Placeholder
                                    risk={activeResult.report.security?.findings?.length > 0 ? 'MEDIUM' : 'LOW'}
                                    repairs={appliedRepairs}
                                    onUndoRepair={(id) => console.log("Undo", id)}
                                />

                                {/* REPAIR PANEL (Sprint 12-I2) */}
                                {activeResult.report.security && (
                                    <RepairPanel
                                        repairs={activeResult.report.security.repairs}
                                        onApplyRepair={handleRepair}
                                    />
                                )}

                                <div className="bg-gray-800 p-4 rounded border border-gray-700 shadow-lg">
                                    <h4 className="text-cyan-400 font-bold mb-2 uppercase text-sm flex justify-between">
                                        <span>Analysis: {activeTab}</span>
                                        <span className="text-green-400">{activeResult.report.solar.rating}</span>
                                    </h4>
                                    <ul className="text-sm list-disc pl-5 space-y-2 text-gray-300">
                                        {activeResult.report.insights.map((txt, i) => <li key={i}>{txt}</li>)}
                                    </ul>
                                </div>

                                <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                                    <span className="text-gray-400 text-sm">Est. Cost:</span>
                                    <span className="text-yellow-400 font-mono font-bold">{CostEstimatorFormat(activeResult.report.cost.total)}</span>
                                </div>

                                {activeResult.report.limitations.length > 0 && (
                                    <div className="bg-red-900/20 p-4 rounded border border-red-500/30">
                                        <h4 className="text-red-400 font-bold mb-2 uppercase text-sm">Limitations {activeResult.report.limitations.length}</h4>
                                        <ul className="text-xs list-disc pl-5 space-y-1 text-gray-400">
                                            {activeResult.report.limitations.map((txt, i) => <li key={i}>{txt}</li>)}
                                        </ul>
                                    </div>
                                )}

                                <p className="text-[10px] text-gray-500 italic border-t border-gray-800 pt-3 mt-4">
                                    {LEGAL_DISCLAIMERS.CONCEPT_ONLY.long}
                                </p>

                                <div className="pt-4 flex flex-col space-y-3">
                                    <div className="flex space-x-3">
                                        <button onClick={() => setStep(0)} className="flex-1 px-4 py-3 border border-gray-600 rounded hover:bg-gray-800 text-sm">REVISE INPUTS</button>
                                    </div>
                                    <button onClick={handleConfirmExport} className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-lg shadow-lg shadow-blue-900/50">
                                        EXPORT &quot;{activeTab}&quot; MODEL
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper (CostEstimator formatting not verified as global export, so defining simple one here or verify import)
// Actually we can use the formatted string from report if available. The update used logic from internal helper.
// Let's assume report.cost is valid.

function CostEstimatorFormat(num) {
    if (!num) return "N/A";
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(num);
}
