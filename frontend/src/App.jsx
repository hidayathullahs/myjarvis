import React, { useState, useEffect, useRef } from 'react';
import Scene from './components/Scene';
import HandController from './components/HandController';
import VoiceController from './components/VoiceController';
import HUD from './components/HUD';
import useTelemetry from './hooks/useTelemetry';
import useJarvisVoice from './hooks/useJarvisVoice';
import { API_BASE_URL } from './config';


function App() {
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
    const fileInputRef = useRef(null);
    const modelInputRef = useRef(null);

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

    // --- UPLOAD HANDLERS ---
    const handleUploadClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleDeployClick = () => {
        if (modelInputRef.current) modelInputRef.current.click();
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            addLog(`UPLOADING IMAGE: ${file.name}`);
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

    // --- NEW FEATURES ---
    const telemetry = useTelemetry();
    const { speak: rawSpeak, wake } = useJarvisVoice();

    // Debug Wrapper for Speak
    const speak = (text) => {
        addLog(`AUDIO OUTPUT: "${text}"`);
        rawSpeak(text);
    };
    const [config, setConfig] = useState({ vision: true, voice: true, gestures: true }); // Plugin System
    const [isStarted, setIsStarted] = useState(false); // Startup State

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

    const handleStart = () => {
        setIsStarted(true);
        wake(); // Unlock Speech Synthesis
        // playIntro(); // Intro removed
        checkBackendHealth();
        addLog("SYSTEM: INITIALIZED");
        speak("System online.");
    };

    // removed simple useEffect to prevent autoplay error
    // useEffect(() => {
    //     playIntro();
    //     checkBackendHealth();
    // }, []);

    const handleVoiceCommand = (command) => {
        addLog(`VOICE: "${command}"`);
        if (command.includes('rotate left')) {
            setRotation(prev => ({ ...prev, y: prev.y - 1 }));
            addLog('Action: Rotating Left');
            speak("Rotating left.");
        } else if (command.includes('rotate right')) {
            setRotation(prev => ({ ...prev, y: prev.y + 1 }));
            addLog('Action: Rotating Right');
            speak("Rotating right.");
        } else if (command.includes('zoom in')) {
            setZoom(prev => Math.min(prev + 0.2, 2));
            addLog('Action: Zooming In');
            speak("Enhancing zoom.");
        } else if (command.includes('reset')) {
            setRotation({ x: 0, y: 0 });
            setZoom(1);
            setTheme('default');
            addLog('Action: Reset System');
            speak("System normalized.");
        } else if (command.includes('camera on')) {
            setCameraEnabled(true);
            addLog('Action: Camera Online');
            speak("Visuals engaged.");
        } else if (command.includes('camera off')) {
            setCameraEnabled(false);
            addLog('Action: Camera Offline');
            speak("Visuals disengaged.");
        } else if (command.includes('camera toggle')) {
            toggleCamera();
            addLog('Action: Toggling Camera');
        } else if (command.includes('combat mode')) {
            setTheme('combat');
            addLog('WARNING: COMBAT PROTOCOL ENGAGED');
            speak("Combat protocol engaged. Lethal force authorized.");
        } else if (command.includes('stealth mode')) {
            setTheme('stealth');
            addLog('PROTOCOL: SILENT RUNNING');
            speak("Stealth mode active.");
        } else if (command.includes('default mode') || command.includes('system normalize')) {
            setTheme('default');
            addLog('SYSTEM: NORMALIZED');
            speak("Restoring default configuration.");
        } else if (command.includes('house party protocol')) {
            setTheme('party'); // Needs css support or just variable color
            addLog('🎉 HOUSE PARTY PROTOCOL ENGAGED 🎉');
            speak("House Party Protocol...... initialized.");
            // Easter egg: Spin
            let spinInterval = setInterval(() => {
                setRotation(prev => ({ ...prev, y: prev.y + 0.5 }));
            }, 16);
            setTimeout(() => clearInterval(spinInterval), 5000); // Spin for 5s
        } else if (command.includes('jarvis') || command.includes('hi') || command.includes('hello')) {
            addLog("SYSTEM: ONLINE");
            speak("At your service, Sir.");
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
        >
            {/* Startup Overlay */}
            {!isStarted && (
                <div className="startup-overlay">
                    <button className="arc-reactor-btn" onClick={handleStart}></button>
                    <div className="absolute mt-48 text-cyan-400 animate-pulse">CLICK REACTOR TO INITIALIZE</div>
                </div>
            )}

            {/* 3D Background */}
            <div className="absolute inset-0 z-0">
                <Scene rotation={rotation} zoom={zoom} modelUrl={modelUrl} onCanvasReady={(canvas) => canvasRef.current = canvas} />
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

            {/* Hidden Input for Images */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* Hidden Input for 3D Models */}
            <input
                type="file"
                ref={modelInputRef}
                style={{ display: 'none' }}
                accept=".glb,.gltf"
                onChange={handleModelChange}
            />

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
                    onDeployModel={handleDeployClick}
                    cameraEnabled={cameraEnabled}
                    onToggleCamera={toggleCamera}
                    theme={theme}
                    handCount={handCount}
                    telemetry={telemetry}
                />
            </div>
        </div>
    );
}

export default App;
