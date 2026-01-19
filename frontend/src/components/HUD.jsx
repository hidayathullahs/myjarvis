import React from 'react';
import { Activity, Mic, MicOff, Hand, Scan, Cpu, Upload, Wifi, Battery, Radio, FileAudio, AlertTriangle } from 'lucide-react';
import ArcReactor from './ArcReactor';
import { SEMANTIC_COLORS } from '../constants/ui/SEMANTIC_COLORS';
import { RISK_LEVELS } from '../constants/ui/RISK_LEVELS';
import PrivacyNotice from './PrivacyNotice'; // Phase 6: Trust UI
import ModeBanner from './ModeBanner'; // Phase 6: UX Clarity

// --- SUBCOMPONENTS ---

const StatusBlock = ({ label, value, color = "text-cyan-400" }) => (
    <div className="flex flex-col bg-black/40 p-2 rounded border-l-2 border-cyan-800 backdrop-blur-sm">
        <span className="text-xs text-gray-400 font-bold tracking-widest">{label}</span>
        <span className={`text-base font-mono font-bold ${color} drop-shadow-md`}>{value}</span>
    </div>
);

const PredictionBanner = ({ prediction }) => {
    if (!prediction) return null;
    return (
        <div className="mt-4 bg-black/60 border border-purple-500/50 p-3 rounded backdrop-blur-md animate-pulse-slow">
            <div className="text-xs text-purple-300 font-bold tracking-widest mb-1 flex justify-between">
                <span>SIMULATION PREVIEW</span>
                <span>{prediction.uncertainty < 0.2 ? 'HIGH CONFIDENCE' : 'UNCERTAIN'}</span>
            </div>
            {prediction.outcomes.map((outcome, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-white/10 py-1 last:border-0">
                    <span className="text-gray-400">{outcome.label}</span>
                    <span className={outcome.context === 'CRITICAL' || outcome.context === 'SEVERE' ? 'text-red-400 font-bold' : 'text-cyan-400 font-mono'}>
                        {outcome.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

const Panel = ({ children, className = "" }) => (
    <div className={`glass-panel p-4 relative overflow-hidden transition-all duration-300 hover:bg-cyan-900/20 ${className}`}>
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-400/50"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-400/50"></div>
        {children}
    </div>
);

// --- MAIN HUD COMPONENT ---

export default function HUD({
    twinState,
    width,
    height,
    isConnected,
    isSpeaking,
    logs,
    twinSelectors,
    modelStats,
    prediction,
    temporal, // New Prop
    onUpload,
    onTactical,
    onDeploy,
    onSaveSession, // New Prop
    onLoadSession, // New Prop
    sliceConfig,
    setSliceConfig,
    toolMode, // Ensure toolMode is passed from App.jsx
    peers = [], // Phase 8: Collaboration
    connected = false, // Phase 8: Collaboration
    // Fix: Explicitly destructure handlers passed from App.jsx
    onMicClick,
    onScan,
    onToggleCamera,
    onPlayIntro,
    onUpdateIntro
}) {
    const [showPrivacy, setShowPrivacy] = React.useState(false);
    const time = new Date().toLocaleTimeString();

    // UI State / Theme Logic
    const riskLevel = twinState?.ui?.riskLevel || RISK_LEVELS.STABLE;
    const isCritical = riskLevel === RISK_LEVELS.CRITICAL;
    const confidence = twinState?.ui?.confidence || 1.0;
    const themeColors = SEMANTIC_COLORS[riskLevel] || SEMANTIC_COLORS.stable;

    // Determine Logic Mode for Banner
    // This aggregates toolMode (measure/slice) with other states if needed
    const currentMode = React.useMemo(() => {
        if (isCritical) return 'critical';
        // Map toolMode 'view' | 'measure' | 'slice' directly to banner keys
        return toolMode || 'view';
    }, [toolMode, isCritical]);

    const primaryColor = themeColors.primary;
    const borderColor = themeColors.border;
    const glowClass = themeColors.glow;
    const pulseAnim = twinState?.ui?.getConfidencePulse ? twinState.ui.getConfidencePulse() : 'animate-pulse';

    // Calm Mode: Opacity for Tier 3 elements
    const tier3Opacity = isCritical ? 'opacity-30 blur-[1px] pointer-events-none' : 'opacity-100';

    // Helper for slice buttons
    const handleMode = (mode) => setSliceConfig({ ...sliceConfig, mode });

    return (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between overflow-hidden scanline">

            {/* TIER 1: GLOBAL STATE & MODE (Top Layer) */}
            <ModeBanner mode={currentMode} riskLevel={riskLevel} />

            {/* TOP LEFT: TITLE + STATUS (Tier 1) */}
            <div className="absolute top-0 left-0 p-4 flex items-start gap-4 pointer-events-auto z-50">
                <div className="w-24 h-24 relative">
                    <ArcReactor voiceActive={isSpeaking} />
                    {/* RISK HALO RING */}
                    <div className={`absolute inset-0 rounded-full border-2 ${borderColor} opacity-30 ${pulseAnim}`}></div>
                </div>
                <div className="flex flex-col">
                    <h1 className={`text-4xl font-bold text-white tracking-widest ${glowClass}`}>
                        J.A.R.V.I.S.
                    </h1>
                    <div className="flex gap-4 mt-1">
                        <StatusBlock label="SYSTEM" value="ONLINE" color="text-green-400" />
                        <StatusBlock label="RISK" value={riskLevel.toUpperCase()} color={primaryColor} />
                        <StatusBlock label="CONFIDENCE" value={`${(confidence * 100).toFixed(0)}%`} color={confidence > 0.8 ? 'text-green-400' : 'text-yellow-400'} />
                    </div>
                    <div className="mt-1 text-[10px] text-cyan-600 font-bold tracking-[0.2em] animate-pulse">
                        HANDS DETECTED: {twinState?.handCount || 0} / 2
                    </div>
                </div>
            </div>

            {/* TOP RIGHT: TIME & BATTERY */}
            <div className="absolute top-0 right-0 p-4 text-right pointer-events-auto z-50">
                <div className={`text-3xl font-mono ${primaryColor} text-glow`}>{time}</div>
                <div className="flex items-center justify-end gap-2 mt-1 text-xs text-cyan-600">
                    <Wifi size={14} className={connected ? "text-green-400" : "text-red-400"} />
                    {connected ? "NET: SECURE" : "NET: OFFLINE"}
                    ({twinState?.telemetry?.networkSpeed || "0ms"})
                    <Battery size={14} className={`ml-2 ${twinState?.telemetry?.charging ? 'text-yellow-400' : ''}`} /> {twinState?.telemetry?.battery || 100}%
                </div>

                {/* COLLAB STATUS (Phase 8) */}
                {peers.length > 0 && (
                    <div className="mt-2 text-[10px] font-mono border-t border-cyan-800 pt-1 animate-pulse">
                        <div className="text-purple-400 font-bold mb-1">LIVE SESSION ({peers.length + 1})</div>
                        {peers.map((p, i) => (
                            <div key={i} className="text-cyan-600 text-right">{p.name || `Operator ${i + 1}`} ({p.role})</div>
                        ))}
                    </div>
                )}
            </div>

            {/* CENTER AIM / BACKIS */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                <div className={`w-[600px] h-[600px] border ${borderColor}/20 rounded-full flex items-center justify-center animate-spin-slow relative`}>
                    <div className={`absolute inset-0 border-t border-b ${borderColor}/10`}></div>
                </div>
            </div>

            {/* CENTER: PRIORITY SPINE */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-40 w-[400px]">

                {/* 1. CRITICAL ALERTS */}
                {riskLevel === RISK_LEVELS.CRITICAL && (
                    <div className="w-full bg-red-500/10 border-l-4 border-red-500 p-4 animate-pulse-fast backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-red-500 font-bold tracking-widest">
                            <AlertTriangle size={24} /> CRITICAL WARNING
                        </div>
                        <div className="text-xs text-red-300 mt-1 font-mono">
                            SYSTEM INTEGRITY COMPROMISED. IMMEDIATE ACTION REQUIRED.
                        </div>
                    </div>
                )}

                {/* 2. GESTURE FEEDBACK */}
                <div className={`glass-panel px-8 py-2 rounded-full border ${borderColor}/30 flex items-center gap-3 transition-all duration-300 ${twinState?.gesture !== 'Idle' ? `scale-110 shadow-[0_0_30px_currentColor] ${primaryColor}` : 'scale-100'}`}>
                    <Hand size={20} className={twinState?.gesture !== 'Idle' ? 'text-white' : 'text-gray-500'} />
                    <span className={`font-bold tracking-widest text-sm ${twinState?.gesture !== 'Idle' ? 'text-white' : 'text-gray-400'}`}>
                        {twinState?.gesture === 'Idle' ? 'NO INPUT' : `DETECTED: ${twinState?.gesture.toUpperCase()}`}
                    </span>
                </div>
            </div>

            {/* LEFT COLUMN: CONTROLS (Tier 3 - Dimmable) */}
            <div className={`absolute left-8 top-1/3 flex flex-col gap-6 w-72 pointer-events-auto transition-all duration-500 ${tier3Opacity}`}>
                <Panel className={borderColor}>
                    <div className={`flex justify-between items-center mb-4 border-b ${borderColor}/20 pb-2`}>
                        <span className={`text-xs ${primaryColor} font-bold`}>ACTIVE PROTOCOLS</span>
                        <Activity size={16} className={`${primaryColor} animate-pulse`} />
                    </div>

                    <div className="space-y-3">
                        {/* Audio Visualizer Area */}
                        <div className="h-10 w-full bg-gray-900/50 rounded overflow-hidden border border-cyan-900/30 relative">
                            <div className={`absolute inset-0 opacity-20 ${isSpeaking ? 'animate-pulse' : ''}`}>
                                <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#00f0ff_2px,#00f0ff_4px)]" />
                            </div>
                        </div>
                        {isSpeaking && (
                            <div className="text-[10px] text-cyan-300 animate-pulse mt-1 text-center tracking-widest flex justify-between px-2">
                                <span>RECEIVING AUDIO...</span>
                                <span className="font-mono">FREQ: {Math.floor(Math.random() * 900) + 100}Hz</span>
                            </div>
                        )}

                        <div className="flex gap-2 mt-4">
                            <button onClick={onMicClick} className={`flex-1 bg-gray-900/30 border ${borderColor}/50 hover:bg-white/10 ${primaryColor} text-xs py-2 px-2 transition-all flex items-center justify-center gap-2 animate-pulse`}>
                                <Mic size={14} /> TALK
                            </button>
                            <button onClick={onScan} className={`flex-1 bg-gray-900/30 border ${borderColor}/50 hover:bg-white/10 ${primaryColor} text-xs py-2 px-2 transition-all flex items-center justify-center gap-2`}>
                                <Scan size={14} /> SCAN
                            </button>
                            <button onClick={onUpload} className={`flex-1 bg-gray-900/30 border ${borderColor}/50 hover:bg-white/10 ${primaryColor} text-xs py-2 px-2 transition-all flex items-center justify-center gap-2`}>
                                <Upload size={14} /> PLAN
                            </button>
                        </div>

                        <button onClick={onDeploy} className={`w-full bg-cyan-900/20 border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-300 text-xs py-2 px-2 transition-all flex items-center justify-center gap-2 mt-2 font-bold tracking-wider`}>
                            <Cpu size={14} /> DEPLOY MODEL (.GLB)
                        </button>

                        <button onClick={onToggleCamera} className={`w-full ${twinState?.cameraEnabled ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'} border border-cyan-600/50 hover:brightness-125 text-xs py-2 px-2 transition-all flex items-center justify-center gap-2 mt-2`}>
                            {twinState?.cameraEnabled ? <MicOff size={14} /> : <Scan size={14} />}
                            {twinState?.cameraEnabled ? "DISENGAGE VISUALS" : "ENGAGE VISUALS"}
                        </button>

                        <div className="flex gap-2 mt-2">
                            <button onClick={onPlayIntro} className={`flex-1 bg-cyan-900/30 text-cyan-400 border border-cyan-600/50 hover:brightness-125 text-xs py-2 px-2 transition-all flex items-center justify-center gap-2`}>
                                <Radio size={14} /> REPLAY
                            </button>
                            <button onClick={onUpdateIntro} className={`flex-1 bg-cyan-900/30 text-cyan-400 border border-cyan-600/50 hover:brightness-125 text-xs py-2 px-2 transition-all flex items-center justify-center gap-2`}>
                                <FileAudio size={14} /> UPLOAD
                            </button>
                        </div>

                        <div className="flex gap-2 mt-2">
                            <button onClick={onSaveSession} className={`flex-1 bg-cyan-900/30 text-cyan-400 border border-cyan-600/50 hover:brightness-125 text-xs py-2 px-2 transition-all flex items-center justify-center gap-2 font-mono`}>
                                SAVE STATE
                            </button>
                            <button onClick={onLoadSession} className={`flex-1 bg-cyan-900/30 text-cyan-400 border border-cyan-600/50 hover:brightness-125 text-xs py-2 px-2 transition-all flex items-center justify-center gap-2 font-mono`}>
                                LOAD STATE
                            </button>
                        </div>

                        {/* TOOLS PANEL */}
                        <div className="pt-4 border-t border-cyan-500/20 mt-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => twinState?.onToggleTool('measure')}
                                    className={`flex-1 text-xs py-2 px-2 transition-all border ${twinState?.ui?.mode === 'measure' ? 'bg-cyan-500 text-black border-cyan-400 font-bold' : 'bg-transparent text-cyan-500 border-cyan-700/50'}`}
                                >
                                    MEASURE
                                </button>
                                <button
                                    onClick={() => twinState?.onToggleTool('slice')}
                                    className={`flex-1 text-xs py-2 px-2 transition-all border ${twinState?.ui?.mode === 'slice' ? 'bg-cyan-500 text-black border-cyan-400 font-bold' : 'bg-transparent text-cyan-500 border-cyan-700/50'}`}
                                >
                                    SLICE
                                </button>
                            </div>
                        </div>

                        {/* SLICE CONTROLS + PREDICTION */}
                        {twinState?.ui?.mode === 'slice' && (
                            <Panel className="w-full flex">
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="text-xs text-cyan-500 font-bold tracking-widest mb-2 border-b border-cyan-500/30 pb-1">
                                        SECTION SCAN PROTOCOL
                                    </div>

                                    <div className="flex gap-2 mb-2">
                                        <button
                                            onClick={() => handleMode('horizontal')}
                                            className={`flex-1 py-1 text-[10px] font-bold border ${sliceConfig.mode === 'horizontal' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'border-gray-700 text-gray-500'}`}
                                        >
                                            HORIZ
                                        </button>
                                        <button
                                            onClick={() => handleMode('vertical')}
                                            className={`flex-1 py-1 text-[10px] font-bold border ${sliceConfig.mode === 'vertical' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'border-gray-700 text-gray-500'}`}
                                        >
                                            VERT
                                        </button>
                                        <button
                                            onClick={() => setSliceConfig({ ...sliceConfig, inverted: !sliceConfig.inverted })}
                                            className={`px-3 py-1 text-[10px] font-bold border ${sliceConfig.inverted ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'border-gray-700 text-gray-500'}`}
                                        >
                                            FLIP
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-cyan-600 font-mono w-8 text-right">
                                            {sliceConfig.offset.toFixed(2)}m
                                        </span>
                                        <input
                                            type="range"
                                            min="-5"
                                            max="5"
                                            step="0.1"
                                            value={sliceConfig.offset}
                                            onChange={(e) => setSliceConfig({ ...sliceConfig, offset: parseFloat(e.target.value) })}
                                            className="flex-1 accent-cyan-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <PredictionBanner prediction={prediction} />
                                </div>
                            </Panel>
                        )}
                    </div>
                </Panel>
            </div>

            {/* RIGHT COLUMN: DATA (Tier 2/3 - Dimmable, but Keep Risk/Forecast Visible?) */}
            {/* We dim this as Tier 3, but the Alerts inside might need promotion. 
                For now, telemetry is Tier 3. Temporal Forecast is Tier 2. 
                Let's keep Temporal Forecast visible if possible or dim less? 
                Strict Calm Mode: Focus on Center Spine (Critical Alert). Everything else dims. 
            */}
            <div className={`absolute right-8 top-1/3 flex flex-col gap-6 w-72 pointer-events-auto transition-all duration-500 ${tier3Opacity}`}>
                <Panel className={borderColor}>
                    <div className="flex justify-between items-center mb-4 border-b border-cyan-500/20 pb-2">
                        <span className="text-xs text-cyan-400 font-bold">TELEMETRY</span>
                        <Radio size={16} className={primaryColor} />
                    </div>
                    <div className="space-y-2 font-mono text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-500">ROTATION X</span>
                            <span className={primaryColor}>{twinState?.rotation?.x?.toFixed(2) || "0.00"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">ROTATION Y</span>
                            <span className={primaryColor}>{twinState?.rotation?.y?.toFixed(2) || "0.00"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={primaryColor}>100%</span>
                        </div>

                        {/* MODEL STATS */}
                        {modelStats && (
                            <div className="mt-4 pt-2 border-t border-cyan-500/10 animate-fade-in">
                                <div className="text-gray-500 mb-1 font-bold">MODEL METRICS</div>
                                <div className={`text-[10px] ${primaryColor} font-mono space-y-1`}>
                                    <div className="flex justify-between">
                                        <span>SIZE X:</span> <span>{modelStats.size.x.toFixed(2)}m</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>SIZE Y:</span> <span>{modelStats.size.y.toFixed(2)}m</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>SIZE Z:</span> <span>{modelStats.size.z.toFixed(2)}m</span>
                                    </div>
                                    <div className="flex justify-between text-yellow-400">
                                        <span>SCALE:</span> <span>{modelStats.scale.toFixed(4)}x</span>
                                    </div>
                                    <div className="flex justify-between text-green-400">
                                        <span>STATUS:</span> <span>NORMALIZED</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* MEASUREMENT DATA */}
                    {twinState?.ui?.mode === 'measure' && (
                        <div className="mt-4 pt-2 border-t border-cyan-500/10 animate-fade-in">
                            <div className="text-gray-500 mb-1 font-bold flex justify-between items-center">
                                <span>MEASUREMENT</span>
                                <span className="text-[9px] bg-cyan-900 text-cyan-300 px-1 rounded">ACTIVE</span>
                            </div>
                            <div className={`text-[10px] ${primaryColor} font-mono space-y-1`}>
                                <div className="flex justify-between text-yellow-400 font-bold border-t border-cyan-500/20 pt-1 mt-1">
                                    <span>DISTANCE:</span>
                                    <span>{twinState?.measurements?.distance || '0.00'} m</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TEMPORAL ANALYSIS (Phase 5) */}
                    {temporal && (
                        <div className="mb-4 pt-2 border-t border-purple-500/30">
                            <div className="text-[10px] text-purple-400 mb-1">TEMPORAL FORECAST</div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] text-cyan-300">TREND</span>
                                <span className={`text-[10px] font-bold ${temporal.trend === 'RISING' ? 'text-red-400' :
                                    temporal.trend === 'FALLING' ? 'text-green-400' : 'text-blue-200'
                                    }`}>{temporal.trend}</span>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] text-cyan-300">VOLATILITY</span>
                                <span className={`text-[10px] font-mono ${temporal.volatility === 'HIGH' ? 'text-orange-400' : 'text-cyan-500'
                                    }`}>{temporal.volatility}</span>
                            </div>
                            {temporal.forecast && (
                                <div className="mt-1 p-1 bg-purple-900/20 border border-purple-500/20 rounded">
                                    <div className="text-[9px] text-purple-200">
                                        PROJECTION ({temporal.forecast.horizon.toFixed(1)}s):
                                    </div>
                                    <div className="text-[10px] font-bold text-white">
                                        {temporal.forecast.likelyRiskLevel.toUpperCase()}
                                    </div>
                                </div>
                            )}

                            {/* EXPLAINABILITY "WHY" PANEL (Milestone 4) */}
                            {temporal.explanation && temporal.explanation.findings && (
                                <div className="mt-2 pt-2 border-t border-cyan-500/20">
                                    <div className="text-[9px] text-cyan-400 mb-1 font-bold">WHY:</div>
                                    <div className="text-[9px] text-cyan-300/80 font-mono leading-tight space-y-1">
                                        {/* Dynamic Reason Breakdown */}
                                        {temporal.explanation.findings.primaryCause && (
                                            <div>Root: {temporal.explanation.findings.primaryCause}</div>
                                        )}
                                        {temporal.explanation.findings.signals.map((sig, i) => (
                                            <div key={i}>• {sig}</div>
                                        ))}
                                        <div className="text-gray-500 mt-1">
                                            Conf: {(temporal.explanation.findings.confidence * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-4 pt-2 border-t border-cyan-500/10 text-[9px] text-gray-500">
                        <div>PINCH: ROTATE | 2-HAND: ZOOM</div>
                    </div>
                </Panel>
            </div>

            {/* BOTTOM LOGS (Tier 3 - Dimmable) */}
            <div className={`absolute bottom-8 left-8 right-8 h-48 pointer-events-auto flex items-end gap-6 transition-all duration-500 ${tier3Opacity}`}>
                <Panel className={`w-1/3 h-full flex flex-col ${borderColor}`}>
                    <div className={`text-xs ${primaryColor} font-bold mb-2 flex items-center gap-2`}>
                        <div className={`w-2 h-2 ${riskLevel === RISK_LEVELS.CRITICAL ? 'bg-red-500' : 'bg-cyan-500'} rounded-full animate-blink`}></div>
                        SYSTEM LOGS
                    </div>
                    <div className={`flex-1 overflow-hidden flex flex-col-reverse gap-1 text-[11px] font-mono ${riskLevel === RISK_LEVELS.CRITICAL ? 'text-red-300/80' : 'text-cyan-300/80'}`}>
                        {Array.isArray(logs) && logs.map((log, i) => (
                            <div key={i} className={`border-l-2 ${riskLevel === RISK_LEVELS.CRITICAL ? 'border-red-800' : 'border-cyan-800'} pl-2 opacity-80 hover:opacity-100 transition-opacity`}>
                                <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                                {log}
                            </div>
                        ))}
                    </div>
                </Panel>

                <div className="flex-1"></div>
            </div>

        </div>
    );
};


