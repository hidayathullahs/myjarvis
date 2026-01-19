import React, { useState, useEffect, useRef } from 'react';
const Scene = React.lazy(() => import('./components/Scene'));
import HandController from './components/HandController';
import VoiceController from './components/VoiceController';
import HUD from './components/HUD';
import useTelemetry from './hooks/useTelemetry';
import { useJarvisVoice } from './hooks/useJarvisVoice';
import { useUIState } from './hooks/useUIState';
import { useDigitalTwin } from './hooks/useDigitalTwin'; // Digital Twin
import { useWhatIf } from './digital-twin/simulation/useWhatIf'; // Simulation
import { usePlanReconstruction } from './hooks/usePlanReconstruction'; // Plan To 3D
import { useTemporalIntelligence } from './hooks/useTemporalIntelligence'; // Temporal AI
import { RISK_LEVELS } from './constants/ui/RISK_LEVELS';
import { API_BASE_URL } from './config';
import { PerformanceMonitor } from './debug/PerformanceMonitor'; // Phase 5 Debug
import { DataPolicy, DATA_CLASSES } from './runtime/dataPolicy'; // Phase 6: Governance
import { createSessionSnapshot, restoreSession, downloadSessionFile } from './runtime/persistence'; // Phase 6: Persistence
import { useSafetyShield } from './modules/safety-shield/useSafetyShield'; // Phase 8: Safety
import { useCollaboration } from './context/CollaborationContext'; // Phase 8: Collaboration
import { driftDetector } from './modules/reality-link/driftDetector'; // Phase 8: Reality Link
import AIArchitectWizard from './ai-architect/ui/AIArchitectWizard'; // Phase 9: AI Architect



function App() {
    console.log("DEBUG: App component rendering...");
    const [gesture, setGesture] = useState('Idle');
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [logs, setLogs] = useState(['System Initialized', 'Waiting for input...']);
    const [voiceActive, setVoiceActive] = useState(false);
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [theme, setTheme] = useState('default'); // default, combat, stealth

    const [handCount, setHandCount] = useState(0);

    const canvasRef = useRef(null);
    const voiceControllerRef = useRef();
    const [modelUrl, setModelUrl] = useState(null); // URL for uploaded 3D model
    const [modelStats, setModelStats] = useState(null); // Metadata for loaded model

    // Tools State
    const [toolMode, setToolMode] = useState('view'); // 'view', 'measure', 'slice'
    const [measurementData, setMeasurementData] = useState(null); // { a, b, distance }
    const [sliceConfig, setSliceConfig] = useState({
        mode: 'horizontal', // 'horizontal' | 'vertical'
        offset: 0,          // -10 to 10 (meters)
        inverted: false     // Flip cut direction
    });

    const fileInputRef = useRef(null);
    const modelInputRef = useRef(null);
    const sessionInputRef = useRef(null); // Persistence Input
    const planInputRef = useRef(null); // New Ref for Plans
    const { processPlan, status: reconstructionStatus } = usePlanReconstruction({ // New Hook
        onComplete: (result) => {
            addLog("RECONSTRUCTION COMPLETE: 3D MESH GENERATED");
            // Set the Reconstructed Mesh URL/Object for Scene
            // NOTE: Scene currently takes a URL. We need to pass the Object or Blob.
            // For now, let's assume Scene can take an object or we fake a URL.
            // Better: update Scene to accept `reconstructedMesh` prop.
            setReconstructedMesh(result.mesh);
            // Also notify Twin
            sendTelemetry('MODEL_METRICS_LOADED', {
                id: 'reconstructed_plan',
                name: 'Blueprint Model',
                boundingBox: null, // Scene will calc
                dimensions: null,
                scale: 1.0
            });
        }
    });
    const [reconstructedMesh, setReconstructedMesh] = useState(null);

    const addLog = (msg) => {
        setLogs(prev => {
            if (prev[0] === msg) return prev; // Prevent duplicate spam
            return [msg, ...prev].slice(0, 10);
        });
    };

    const captureScreen = () => {
        if (canvasRef.current) {
            return canvasRef.current.toDataURL('image/png');
        }
        return null;
    };

    const prevHandPos = useRef(null); // Track previous hand position for delta gestures

    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const lastGestureTime = useRef(0); // Debounce for toggles

    // --- MOUSE CONTROLS ---
    const handleMouseDown = (e) => {
        isDragging.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;

        setRotation(prev => ({
            x: prev.x + deltaY * 0.01, // Mouse sensitivity
            y: prev.y + deltaX * 0.01,
            z: prev.z
        }));

        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleWheel = (e) => {
        setZoom(prev => Math.min(Math.max(prev - e.deltaY * 0.001, 0.5), 4));
    };

    // --- GESTURE LOGIC ---
    const handleGesture = (gestures, multiHandLandmarks, count = 0) => {
        setHandCount(count);

        if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
            setGesture('Idle');
            prevHandPos.current = null; // Reset tracking
            return;
        }

        const primaryHand = multiHandLandmarks[0];
        const primaryGesture = gestures[0];

        // Update UI Label
        if (multiHandLandmarks.length === 2) {
            setGesture('Dual Hand Zoom');
        } else {
            setGesture(primaryGesture);
        }

        // 1. TWO HANDS -> ZOOM LOGIC (Absolute Distance)
        if (multiHandLandmarks.length === 2) {
            prevHandPos.current = null; // Reset rotation tracking
            const hand1 = multiHandLandmarks[0][8];
            const hand2 = multiHandLandmarks[1][8];
            const distance = Math.hypot(hand1.x - hand2.x, hand1.y - hand2.y);

            // Map 0.1-0.6 distance to 0.5-3.0 zoom roughly
            const newZoom = Math.min(Math.max(distance * 5, 0.5), 4);
            setZoom(newZoom);
            return;
        }

        // 2. ONE HAND (PINCH) -> ROTATION LOGIC (Relative Delta)
        if (primaryGesture === 'Pinch' && primaryHand) {
            const currentPos = { x: primaryHand[8].x, y: primaryHand[8].y };

            if (prevHandPos.current) {
                // Calculate Delta (flip X because webcam is mirrored usually, but let's test)
                // Actually, if we move hand right (x increases), we want model to rotate right (around Y axis).
                const deltaX = currentPos.x - prevHandPos.current.x;
                const deltaY = currentPos.y - prevHandPos.current.y;

                setRotation(prev => ({
                    x: prev.x + deltaY * 5, // Sensitivity 5x
                    y: prev.y + deltaX * 5
                }));
            }

            prevHandPos.current = currentPos; // Update history
        } else {
            prevHandPos.current = null; // Reset if not pinching
        }

        if (primaryGesture === 'Fist') {
            // Optional: Stop momentum or reset? Let's just hold position.
            prevHandPos.current = null;
        }

        if (primaryGesture === 'Victory') {
            const now = Date.now();
            if (now - lastGestureTime.current > 3000) {
                setTheme(prev => prev === 'combat' ? 'default' : 'combat');
                const newMode = theme === 'combat' ? 'default' : 'combat';
                addLog(newMode === 'combat' ? 'COMBAT MODE ENGAGED' : 'SYSTEM: NORMALIZED');
                speak(newMode === 'combat' ? "Combat mode engaged." : "Standing down.");
                lastGestureTime.current = now;
            }
            prevHandPos.current = null;
        }

        if (primaryGesture === 'Open Hand') {
            const now = Date.now();
            if (now - lastGestureTime.current > 1000) {
                setRotation({ x: 0, y: 0, z: 0 });
                setZoom(1);
                addLog("SYSTEM RESET CONFIRMED");
                speak("System reset.");
                lastGestureTime.current = now;
            }
            prevHandPos.current = null;
        }
    };

    // Ref to trigger backend analysis manually
    const handleScan = () => {
        addLog("MANUAL OVERRIDE: INITIATING SCAN...");
        if (voiceControllerRef.current) {
            voiceControllerRef.current.triggerAnalyze();
        }
    };

    const handleMicClick = () => {
        if (voiceControllerRef.current) {
            voiceControllerRef.current.startListening();
        }
    };

    const handleUploadClick = () => {
        // Toggle: Ask user Plan or Image?
        // For simplicity: Left Click = Plan, Right Click (or modifier) = Image?
        // Or just repurpose "Upload" for Plan (Primary feature now) and "Tactical" for Image?
        // Let's make "UPLOAD" trigger Plan Input for Phase 4.
        if (planInputRef.current) planInputRef.current.click();
    };

    const handleTacticalClick = () => { // Old "Upload" logic moved here if needed
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleDeployClick = () => {
        if (modelInputRef.current) modelInputRef.current.click();
    }

    // Plan Upload Handler
    const handlePlanChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            addLog(`INGESTING BLUEPRINT: ${file.name}`);
            DataPolicy.register(file.name, DATA_CLASSES.BLUEPRINT_FILE, file.size);
            await processPlan(file);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            addLog(`UPLOADING IMAGE: ${file.name}`);
            DataPolicy.register(file.name, DATA_CLASSES.CV_PREPROCESSED, file.size);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                if (voiceControllerRef.current) {
                    voiceControllerRef.current.analyzeImage(base64String);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleModelChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setModelUrl(url);
            addLog(`DEPLOYING MODEL: ${file.name}`);
        }
    }

    const toggleCamera = () => {
        setCameraEnabled(prev => {
            const newState = !prev;
            addLog(`CAMERA SYSTEM: ${newState ? 'ONLINE' : 'OFFLINE'}`);
            return newState;
        });
    };

    // --- TOOLS LOGIC ---
    const handleToolToggle = (mode) => {
        // SAFETY SHIELD CHECK
        if (mode !== 'view') {
            const actionType = mode === 'measure' ? 'MEASURE' : 'SLICE';
            const check = safetyShield.validateAction(actionType);

            if (!check.allowed) {
                addLog(`SAFETY BLOCK: ${check.reason.toUpperCase()}`);
                speak(`Negative. ${check.reason}`);
                return;
            }
        }

        setToolMode(prev => {
            const newMode = prev === mode ? 'view' : mode;
            addLog(`TOOL SYSTEM: ${newMode.toUpperCase()} MODE ACTIVE`);
            if (newMode === 'view') setMeasurementData(null); // Reset data on exit
            return newMode;
        });
    };

    const handleMeasurementUpdate = (data) => {
        setMeasurementData(data);
        if (data.distance) {
            addLog(`MEASUREMENT DETECTED: ${data.distance}m`);
        }
    };

    const handleSliceUpdate = (newConfig) => {
        setSliceConfig(prev => {
            // Log significant changes (e.g., mode switch bounds check)
            if (prev.mode !== newConfig.mode) {
                addLog(`SLICE AXIS: ${newConfig.mode.toUpperCase()}`);

                // Telemetry: Mode Change
                sendTelemetry('CLIPPING_PARAM_UPDATE', {
                    axis: newConfig.mode,
                    offset: newConfig.offset // Reset implicitly handled by UI logic usually
                });
            } else {
                // Telemetry: Value Change (could debounce this)
                sendTelemetry('CLIPPING_PARAM_UPDATE', {
                    axis: newConfig.mode,
                    offset: newConfig.offset
                });

                // SIMULATION: Run "What-If" on every slider move
                simulateChange({
                    axis: newConfig.mode,
                    offset: newConfig.offset,
                    inverted: newConfig.inverted
                });
            }
            return { ...prev, ...newConfig };
        });
    };

    // --- NEW FEATURES ---
    const telemetry = useTelemetry();
    const { speak: rawSpeak, wake } = useJarvisVoice();
    const uiState = useUIState();    // --- TWIN INTELLIGENCE ---
    // 1. Core Digital Twin (Reality State)
    const { twinState, sendTelemetry, selectors } = useDigitalTwin();

    // 2. Simulation Layer (Physics/Logic validation)
    const { prediction, simulateChange } = useWhatIf(twinState);

    // 3. Temporal Layer (Time/Trend reasoning)
    const temporalInsights = useTemporalIntelligence(twinState); // What-If Engine

    // --- PHASE 8 EXPANSION ---
    const { joinSession, broadcastUpdate, peers, connected } = useCollaboration();
    const safetyShield = useSafetyShield(twinState, { role: 'SUPERVISOR' }); // Default role for now

    // --- PHASE 9: AI ARCHITECT ---
    const [showArchitect, setShowArchitect] = useState(false);

    const handleArchitectExport = (meshGroup) => {
        // In a real Three.js app, we would add this 'meshGroup' to the main scene.
        // For now, we simulate this by logging and speaking.
        console.log("AI ARCHITECT: Loading 3D Model into Scene...", meshGroup);
        addLog("AI: Importing Generative Design...");
        speak("Importing concept design. Establishing hologram projection.");

        // TODO: Pass 'meshGroup' to a viewing state/component or the DigitalTwinCanvas
    };

    // Join Session
    useEffect(() => {
        joinSession('mission_control_alpha', { name: 'Commander', role: 'SUPERVISOR' });

        // Phase 8: Start Reality Link Monitoring
        driftDetector.startMonitoring((driftEvent) => {
            // Priority Alert
            addLog(`REALITY DRIFT: ${driftEvent.description.toUpperCase()}`);
            if (driftEvent.severity === 'HIGH') {
                speak(`Alert. Reality mismatch detected in ${driftEvent.location}.`);
                // Auto-upgrade risk if high drift
                if (uiState.riskLevel !== 'critical') {
                    uiState.setRiskLevel('critical'); // Force critical UI
                    // Also notify peers
                    broadcastUpdate('RISK_LEVEL', 'critical');
                }
            } else {
                speak(`Notice. Minor drift in ${driftEvent.location}.`);
            }
        });

        return () => driftDetector.stopMonitoring();
    }, []);


    // Debug Wrapper for Speak
    const speak = (text) => {
        addLog(`AUDIO OUTPUT: "${text}"`);
        rawSpeak(text);
    };

    // --- SYNC TWIN INTELLIGENCE TO UI THEME ---
    useEffect(() => {
        if (!uiState || !twinState) return;

        // Drive the Cosmetic UI State from the computed Digital Twin Truth
        // This ensures the HUD theme matches the mathematical Risk Engine
        if (twinState.risk.level !== uiState.riskLevel) {
            uiState.setRiskLevel(twinState.risk.level);
        }

        // Only update if significantly different to avoid loop/render thrashing
        if (Math.abs(twinState.confidence.value - uiState.confidence) > 0.01) {
            uiState.setConfidence(twinState.confidence.value);
        }

    }, [twinState.risk.level, twinState.confidence.value, uiState]);

    // LEGACY LOGIC REMOVED: State is now computed by src/digital-twin/risk/riskEngine.js
    /*
    useEffect(() => {
        if (!uiState) return;
        if (toolMode === 'slice') { ... } 
    }, [toolMode, uiState]);
    */

    const [config, setConfig] = useState({ vision: true, voice: true, gestures: true }); // Plugin System
    const [isStarted, setIsStarted] = useState(false); // Startup State
    const [introAudioUrl, setIntroAudioUrl] = useState(null); // Custom Intro
    const introInputRef = useRef(null);

    const introAudioRef = useRef(null); // Keep audio instance alive

    const handleIntroChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setIntroAudioUrl(url);
            addLog(`AUDIO: INTRO UPDATED (${file.name})`);
        }
    };

    const handleIntroUploadClick = () => {
        if (introInputRef.current) introInputRef.current.click();
    };

    // --- PERSISTENCE HANDLERS ---
    const handleSaveSession = () => {
        if (window.confirm("SAVE SESSION?\n\nIncludes: Twin State, Config, Reasoning.\nExcludes: Raw Blueprints, Personal Data.")) {
            const snapshot = createSessionSnapshot({
                twinState,
                modelStats,
                uiState,
                simulationConfig: {} // Add any sim config state here
            });
            downloadSessionFile(snapshot, `jarvis_session_${Date.now()}.json`);
        }
    };

    const handleLoadSession = () => {
        if (sessionInputRef.current) sessionInputRef.current.click();
    };

    const handleSessionFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = restoreSession(event.target.result);
            if (result.success) {
                addLog("SESSION RESTORED SUCCESSFULLY");
                // Hydrate State
                if (result.modelStats) setModelStats(result.modelStats);
                if (result.uiState) {
                    if (result.uiState.mode) setToolMode(result.uiState.mode);
                    // Theme logic handled by twinState sync usually
                }
                // Note: Deep twinState hydration would go here (e.g. updating Zustand store)
                // For now, we rely on the Twin Engine to re-init or accept overrides if structured this way.
            } else {
                addLog(`RESTORE FAILED: ${result.error}`);
                speak("Session file invalid.");
            }
        };
        reader.readAsText(file);
    };

    const checkBackendHealth = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/health`);
            if (res.ok) {
                addLog("SERVER: CONNECTED");
            } else {
                throw new Error("Server not ready");
            }
        } catch (e) {
            addLog("SERVER: OFFLINE (Check Terminal)");
            speak("Warning. Server connection failed.");
        }
    };

    // --- PREMIUM FEATURES ---
    const [bootStep, setBootStep] = useState(0); // 0: Off, 1: Booting, 2: Ready
    const [aiContext, setAiContext] = useState(null); // Smart suggestions

    // AI Predictive Logic (Simulated)
    useEffect(() => {
        if (!isStarted) return;

        const interval = setInterval(() => {
            const suggestions = [
                { type: 'tip', text: "Microphone Signal Optimal" },
                { type: 'warn', text: "Long Session: Consider Rest" },
                { type: 'info', text: "Updates Available: None" },
                { type: 'cmd', text: "Try saying 'Create Box'" }
            ];

            // Only show if idle
            if (Math.random() > 0.7 && gesture === 'Idle') {
                const sugg = suggestions[Math.floor(Math.random() * suggestions.length)];
                setAiContext(sugg);
                setTimeout(() => setAiContext(null), 4000);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [isStarted, gesture]);

    // Listen for Model Telemetry from Scene
    useEffect(() => {
        const handleModelLoad = (e) => {
            setModelStats(e.detail);
            addLog(`METRICS: MODEL SCALED ${(e.detail.scale).toFixed(4)}x`);
        };
        window.addEventListener('model-loaded', handleModelLoad);

        // Phase 8: Collaboration Sync Listener
        const handleRemoteUpdate = (e) => {
            const { type, data, source } = e.detail;

            // Prevent feedback loops? (Source check already done in Context usually, but good to have)
            // if (source === myId) return; 

            if (type === 'ROTATION') {
                setRotation(data);
            } else if (type === 'ZOOM') {
                setZoom(data);
            } else if (type === 'RISK_LEVEL') {
                // Determine if we should override local analysis or just alert
                addLog(`CMD: RISK UPDATE RECEIVED (${data})`);
                uiState.setRiskLevel(data);
            }
        };
        window.addEventListener('twin_remote_update', handleRemoteUpdate);

        return () => {
            window.removeEventListener('model-loaded', handleModelLoad);
            window.removeEventListener('twin_remote_update', handleRemoteUpdate);
        };
    }, []);

    // Broadcast Local Changes (Phase 8)
    // We debounce this slightly to avoid flooding socket
    useEffect(() => {
        if (safetyShield.config.role === 'VIEWER') return; // Viewers don't broadcast?

        const timeout = setTimeout(() => {
            broadcastUpdate('ROTATION', rotation);
        }, 50);
        return () => clearTimeout(timeout);
    }, [rotation]);

    useEffect(() => {
        if (safetyShield.config.role === 'VIEWER') return;
        broadcastUpdate('ZOOM', zoom);
    }, [zoom]);

    // Drag and Drop Handler
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files[0];
        if (file && (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf'))) {
            const url = URL.createObjectURL(file);
            setModelUrl(url);
            // Reset stats?
            setModelStats(null);
            addLog(`DROP DETECTED: DEPLOYING ${file.name.toUpperCase()}...`);
        } else {
            addLog("Make sure to drop a valid .glb or .gltf file");
            const audio = new Audio('/error.mp3'); // Optional if you had one
            speak("Unsupported file format. Please use GLB or GLTF.");
        }
    };


    const handleStart = () => {
        setBootStep(1); // Start Boot Sequence

        // Simulating Boot Log Stream
        const bootLogs = [
            "Initializing Core Systems...",
            "Loading Holographic Engine...",
            "Connecting to Neural Cloud...",
            "Calibrating Sensors...",
            "System Online."
        ];

        let i = 0;
        const interval = setInterval(() => {
            addLog(bootLogs[i]);
            i++;
            if (i >= bootLogs.length) {
                clearInterval(interval);
                setIsStarted(true);
                setBootStep(2);
                wake();
                playIntro(); // Trigger Audio
                checkBackendHealth();
            }
        }, 600); // 600ms per step
    };

    // Robust Audio Player
    const playIntro = () => {
        if (introAudioRef.current) {
            introAudioRef.current.volume = 1.0;
            introAudioRef.current.play()
                .then(() => addLog("AUDIO: PLAYING INTRO"))
                .catch(e => {
                    console.error("Audio Fail:", e);
                    addLog("AUDIO ERROR: Click 'Replay'");
                });
        }
    };

    const handleVoiceCommand = (command) => {
        if (!command) return;
        const cmd = command.toLowerCase();
        addLog(`VOICE CMD: "${cmd.toUpperCase()}"`);

        if (cmd.includes('rotate left')) {
            setRotation(prev => ({ ...prev, y: prev.y - 0.5 }));
            speak("Rotating left.");
        } else if (cmd.includes('rotate right')) {
            setRotation(prev => ({ ...prev, y: prev.y + 0.5 }));
            speak("Rotating right.");
        } else if (cmd.includes('zoom in')) {
            setZoom(prev => Math.min(prev + 0.5, 4));
            speak("Zooming in.");
        } else if (cmd.includes('zoom out')) {
            setZoom(prev => Math.max(prev - 0.5, 0.5));
            speak("Zooming out.");
        } else if (cmd.includes('reset')) {
            setRotation({ x: 0, y: 0, z: 0 });
            setZoom(1);
            speak("System reset.");
        } else if (cmd.includes('stop')) {
            speak("Holding position.");
        }
    };

    return (
        <div
            className="relative w-full h-screen bg-black overflow-hidden font-mono text-white selection:bg-cyan-500/30 cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Startup Overlay with Arc Reactor */}
            {!isStarted && (
                <div className={`startup-overlay transition-opacity duration-1000 ${bootStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex flex-col items-center gap-8">
                        <button className={`arc-reactor-btn ${bootStep === 1 ? 'animate-ping' : ''}`} onClick={handleStart}></button>
                        <div className="text-cyan-400 font-bold tracking-[0.5em] animate-pulse">
                            {bootStep === 1 ? "INITIALIZING..." : "CLICK REACTOR TO INITIALIZE"}
                        </div>
                    </div>
                </div>
            )}

            {/* AI Context Popup (Bottom Center) */}
            {aiContext && isStarted && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50">
                    <div className="glass-panel px-6 py-2 rounded-full border border-cyan-500/30 flex items-center gap-3 animate-fade-in-up">
                        <span className="text-cyan-300 font-bold text-xs">J.A.R.V.I.S. INSIGHT:</span>
                        <span className="text-white text-xs tracking-wider">{aiContext.text}</span>
                    </div>
                </div>
            )}

            {/* 3D Background */}
            <div className="absolute inset-0 z-0">
                <React.Suspense fallback={<div className="w-full h-full bg-black flex items-center justify-center"><div className="text-cyan-900 font-mono text-xs animate-pulse">INITIALIZING OPTICAL ARRAY...</div></div>}>
                    <Scene
                        rotation={rotation}
                        zoom={zoom}
                        modelUrl={modelUrl}
                        reconstructedMesh={reconstructedMesh} // Pass generated mesh
                        onCanvasReady={(canvas) => canvasRef.current = canvas}
                        toolMode={toolMode}
                        onMeasurementUpdate={handleMeasurementUpdate}
                        sliceConfig={sliceConfig}
                    />
                </React.Suspense>
            </div>

            {/* Vignette & Grid Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]"></div>
            <div className="absolute inset-0 z-10 pointer-events-none opacity-5 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            {/* Controllers (Invisible but active) */}
            <HandController
                onGesture={handleGesture}
                cameraEnabled={cameraEnabled}
                onError={(err) => {
                    addLog("CAMERA ERROR: Access Denied or Missing");
                    setCameraEnabled(false);
                }}
            />
            <VoiceController
                ref={voiceControllerRef} // Expose methods
                onCommand={handleVoiceCommand}
                onStatusChange={setVoiceActive}
                addLog={addLog}
                getImage={captureScreen}
                speak={speak}
            />

            {/* Hidden Input for Images (Tactical) */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* Hidden Input for Plans (Blueprint) */}
            <input
                type="file"
                ref={planInputRef}
                style={{ display: 'none' }}
                accept="image/*.pdf" // TODO: Add PDF support in hook
                onChange={handlePlanChange}
            />

            {/* Hidden Input for Session Load */}
            <input
                type="file"
                ref={sessionInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleSessionFileChange}
            />

            {/* Hidden Input for 3D Models */}
            <input
                type="file"
                ref={modelInputRef}
                style={{ display: 'none' }}
                accept=".glb,.gltf"
                onChange={handleModelChange}
            />

            {/* Hidden Input for Intro Audio (State Loop) */}
            <input
                type="file"
                ref={introInputRef}
                style={{ display: 'none' }}
                accept="audio/*"
                onChange={handleIntroChange}
            />

            {/* REAL AUDIO ELEMENT FOR ROBUSTNESS */}
            <audio
                ref={introAudioRef}
                src={introAudioUrl || `/jarvis_intro.mp3?t=${Date.now()}`}
                crossOrigin="anonymous"
            />

            {/* AI Architect Button (Phase 9) */}
            <button
                onClick={() => setShowArchitect(true)}
                className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyan-900/80 border border-cyan-400 text-cyan-100 px-4 py-1 rounded shadow-lg backdrop-blur hover:bg-cyan-800 transition z-50 flex items-center space-x-2"
            >
                <span>🏗️ AI ARCHITECT</span>
            </button>

            {/* AI Architect Wizard Modal */}
            {showArchitect && (
                <AIArchitectWizard
                    onClose={() => setShowArchitect(false)}
                    onExport3D={handleArchitectExport}
                />
            )}

            {/* UI Overlay */}
            <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-1000 ${isStarted ? 'opacity-100' : 'opacity-0'}`}>
                <HUD
                    logs={logs}
                    gesture={gesture}
                    rotation={rotation}
                    voiceActive={voiceActive}
                    onScan={handleScan}
                    onMicClick={handleMicClick}
                    onUpload={handleUploadClick}
                    onDeploy={handleDeployClick}
                    cameraEnabled={cameraEnabled}
                    onToggleCamera={toggleCamera}
                    theme={theme}
                    handCount={handCount}
                    telemetry={telemetry}
                    twinSelectors={selectors}
                    modelStats={modelStats} // Keep for legacy file stats if needed
                    prediction={prediction}
                    temporal={temporalInsights} // Pass Temporal Data
                    onTactical={handleTacticalClick}
                    toolMode={toolMode}
                    measurementData={measurementData}
                    sliceConfig={sliceConfig}
                    onSliceUpdate={handleSliceUpdate}
                    onToggleTool={handleToolToggle}
                    onPlayIntro={playIntro}
                    onUpdateIntro={handleIntroUploadClick}
                    uiState={uiState}
                    onSaveSession={handleSaveSession}
                    onLoadSession={handleLoadSession}
                    // Phase 8
                    peers={peers}
                    connected={connected}
                />
            </div>
            {/* DEBUG OVERLAY (Toggle with Alt+D) */}
            <PerformanceMonitor />
        </div>
    );
}

export default App;
