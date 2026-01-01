import React from 'react';
import { Activity, Mic, MicOff, Hand, Scan, Cpu, Upload, Wifi, Battery, Radio } from 'lucide-react';
import ArcReactor from './ArcReactor';

// Subcomponents for cleaner code
const StatusBlock = ({ label, value, color = "text-cyan-400" }) => (
    <div className="flex flex-col">
        <span className="text-[10px] text-gray-500 font-bold tracking-widest">{label}</span>
        <span className={`text-sm ${color} font-mono font-bold text-glow`}>{value}</span>
    </div>
);

const Panel = ({ children, className = "" }) => (
    <div className={`glass-panel p-4 relative overflow-hidden transition-all duration-300 hover:bg-cyan-900/20 ${className}`}>
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-400/50"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-400/50"></div>
        {children}
    </div>
);

const HUD = ({ logs, gesture, rotation, voiceActive, onScan, onMicClick, onUpload, onDeployModel, cameraEnabled, onToggleCamera, theme = 'default', handCount = 0, telemetry, onPlayIntro }) => {
    const time = new Date().toLocaleTimeString();

    // Determine colors based on theme
    const primaryColor = theme === 'combat' ? 'text-red-500' : theme === 'stealth' ? 'text-blue-500' : 'text-cyan-400';
    const borderColor = theme === 'combat' ? 'border-red-500' : theme === 'stealth' ? 'border-blue-900' : 'border-cyan-400';
    const glowClass = theme === 'combat' ? 'drop-shadow-[0_0_10px_red]' : 'drop-shadow-[0_0_10px_cyan]';

    return (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between overflow-hidden scanline">

            {/* TOP LEFT: TITLE + STATUS */}
            <div className="absolute top-0 left-0 p-4 flex items-start gap-4 pointer-events-auto z-50">
                <div className="w-24 h-24">
                    <ArcReactor voiceActive={voiceActive} />
                </div>
                <div className="flex flex-col">
                    <h1 className={`text-4xl font-bold text-white tracking-widest ${glowClass}`}>
                        J.A.R.V.I.S.
                    </h1>
                    <div className="flex gap-4 mt-1">
                        <StatusBlock label="SYSTEM" value="ONLINE" color="text-green-400" />
                        <StatusBlock label="CORES" value={`${telemetry?.cores || 4}`} />
                        <StatusBlock label="CAMERA" value={cameraEnabled ? "ACTIVE" : "OFFLINE"} color={cameraEnabled ? "text-green-400" : "text-red-500"} />
                    </div>
                    <div className="mt-1 text-[10px] text-cyan-600 font-bold tracking-[0.2em] animate-pulse">
                        HANDS DETECTED: {handCount} / 2
                    </div>
                </div>
            </div>

            {/* TOP RIGHT: TIME & BATTERY */}
            <div className="absolute top-0 right-0 p-4 text-right pointer-events-auto z-50">
                <div className={`text-3xl font-mono ${primaryColor} text-glow`}>{time}</div>
                <div className="flex items-center justify-end gap-2 mt-1 text-xs text-cyan-600">
                    <Wifi size={14} /> {telemetry?.networkType?.toUpperCase() || "NET"} ({telemetry?.networkSpeed || "?"})
                    <Battery size={14} className={`ml-2 ${telemetry?.charging ? 'text-yellow-400' : ''}`} /> {telemetry?.battery || 100}%
                </div>
            </div>

            {/* CENTER AIM / BACKIS */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                <div className={`w-[600px] h-[600px] border ${borderColor}/20 rounded-full flex items-center justify-center animate-spin-slow relative`}>
                    <div className={`absolute inset-0 border-t border-b ${borderColor}/10`}></div>
                </div>
            </div>

            {/* GESTURE FEEDBACK (Center Top) */}
            <div className="absolute top-32 left-1/2 -translate-x-1/2 pointer-events-auto">
                <div className={`glass-panel px-8 py-2 rounded-full border ${borderColor}/30 flex items-center gap-3 transition-all duration-300 ${gesture !== 'Idle' ? `scale-110 shadow-[0_0_30px_currentColor] ${primaryColor}` : 'scale-100'}`}>
                    <Hand size={18} className={gesture !== 'Idle' ? 'text-white' : 'text-gray-500'} />
                    <span className={`font-bold tracking-widest ${gesture !== 'Idle' ? 'text-white' : 'text-gray-400'}`}>
                        {gesture === 'Idle' ? 'NO INPUT' : `DETECTED: ${gesture.toUpperCase()}`}
                    </span>
                </div>
            </div>

            {/* LEFT COLUMN: CONTROLS */}
            <div className="absolute left-8 top-1/3 flex flex-col gap-6 w-72 pointer-events-auto">
                <Panel className={borderColor}>
                    <div className={`flex justify-between items-center mb-4 border-b ${borderColor}/20 pb-2`}>
                        <span className={`text-xs ${primaryColor} font-bold`}>ACTIVE PROTOCOLS</span>
                        <Activity size={16} className={`${primaryColor} animate-pulse`} />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">VOICE MODULE</span>
                            <span className={voiceActive ? "text-green-400 animate-pulse font-bold" : "text-gray-600"}>
                                {voiceActive ? "LISTENING" : "STANDBY"}
                            </span>
                        </div>
                        <div className="h-1 w-full bg-gray-800 rounded overflow-hidden">
                            <div className={`h-full ${theme === 'combat' ? 'bg-red-500' : 'bg-cyan-400'} transition-all duration-100 ${voiceActive ? 'w-full animate-glitch' : 'w-0'}`}></div>
                        </div>
                        {voiceActive && (
                            <div className="text-[10px] text-cyan-300 animate-pulse mt-1 text-center tracking-widest">
                                RECEIVING AUDIO...
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
                                <Upload size={14} /> TACTICAL
                            </button>
                        </div>

                        <button onClick={onDeployModel} className={`w-full bg-cyan-900/20 border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-300 text-xs py-2 px-2 transition-all flex items-center justify-center gap-2 mt-2 font-bold tracking-wider`}>
                            <Cpu size={14} /> DEPLOY MODEL (.GLB)
                        </button>

                        <button onClick={onToggleCamera} className={`w-full ${cameraEnabled ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'} border border-cyan-600/50 hover:brightness-125 text-xs py-2 px-2 transition-all flex items-center justify-center gap-2 mt-2`}>
                            {cameraEnabled ? <MicOff size={14} /> : <Scan size={14} />}
                            {cameraEnabled ? "DISENGAGE VISUALS" : "ENGAGE VISUALS"}
                        </button>

                        <button onClick={onPlayIntro} className={`w-full bg-cyan-900/30 text-cyan-400 border border-cyan-600/50 hover:brightness-125 text-xs py-2 px-2 transition-all flex items-center justify-center gap-2 mt-2`}>
                            <Radio size={14} /> REPLAY INTRO
                        </button>
                    </div>
                </Panel>
            </div>

            {/* RIGHT COLUMN: DATA */}
            <div className="absolute right-8 top-1/3 flex flex-col gap-6 w-72 pointer-events-auto">
                <Panel className={borderColor}>
                    <div className="flex justify-between items-center mb-4 border-b border-cyan-500/20 pb-2">
                        <span className="text-xs text-cyan-400 font-bold">TELEMETRY</span>
                        <Radio size={16} className={primaryColor} />
                    </div>
                    <div className="space-y-2 font-mono text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-500">ROTATION X</span>
                            <span className={primaryColor}>{rotation?.x?.toFixed(2) || "0.00"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">ROTATION Y</span>
                            <span className={primaryColor}>{rotation?.y?.toFixed(2) || "0.00"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">ZOOM LEVEL</span>
                            <span className={primaryColor}>100%</span>
                        </div>

                        <div className="mt-4 pt-2 border-t border-cyan-500/10">
                            <div className="text-gray-500 mb-1 font-bold">MANUAL OVERRIDE</div>
                            <div className={`text-[9px] ${primaryColor} space-y-2 font-mono`}>
                                <div>
                                    <span className="text-white font-bold">ROTATE:</span> ONE HAND PINCH <br />
                                    <span className="opacity-70">& DRAG (JOYSTICK MODE)</span>
                                </div>
                                <div>
                                    <span className="text-white font-bold">ZOOM:</span> TWO HANDS <br />
                                    <span className="opacity-70">MOVE APART / TOGETHER</span>
                                </div>
                                <div>
                                    <span className="text-white font-bold">VOICE:</span> "ROTATE LEFT", <br />
                                    "RESET", "COMBAT MODE"
                                </div>
                            </div>
                        </div>
                    </div>
                </Panel>
            </div>

            {/* BOTTOM LOGS */}
            <div className="absolute bottom-8 left-8 right-8 h-48 pointer-events-auto flex items-end gap-6">
                <Panel className={`w-1/3 h-full flex flex-col ${borderColor}`}>
                    <div className={`text-xs ${primaryColor} font-bold mb-2 flex items-center gap-2`}>
                        <div className={`w-2 h-2 ${theme === 'combat' ? 'bg-red-500' : 'bg-cyan-500'} rounded-full animate-blink`}></div>
                        SYSTEM LOGS
                    </div>
                    <div className={`flex-1 overflow-hidden flex flex-col-reverse gap-1 text-[11px] font-mono ${theme === 'combat' ? 'text-red-300/80' : 'text-cyan-300/80'}`}>
                        {Array.isArray(logs) && logs.map((log, i) => (
                            <div key={i} className={`border-l-2 ${theme === 'combat' ? 'border-red-800' : 'border-cyan-800'} pl-2 opacity-80 hover:opacity-100 transition-opacity`}>
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

export default HUD;


