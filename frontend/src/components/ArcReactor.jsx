import React from 'react';

const ArcReactor = ({ voiceActive }) => {
    return (
        <div className={`relative w-32 h-32 flex items-center justify-center animate-spin-slow opacity-80 transition-all duration-500 ${voiceActive ? 'scale-110 drop-shadow-[0_0_30px_rgba(0,255,255,0.8)]' : ''}`}>
            {/* Outer Ring */}
            <div className={`absolute inset-0 rounded-full border-4 border-cyan-500/30 shadow-[0_0_20px_#00f0ff] border-t-transparent animate-spin-reverse ${voiceActive ? 'border-cyan-300' : ''}`}></div>

            {/* Inner Ring */}
            <div className="absolute inset-2 rounded-full border-2 border-cyan-400/50 border-b-transparent animate-spin"></div>

            {/* Core */}
            <div className={`absolute inset-8 rounded-full bg-cyan-500/10 backdrop-blur-sm border border-cyan-300/50 shadow-[0_0_30px_#00f0ff] flex items-center justify-center transition-all ${voiceActive ? 'bg-cyan-400/20' : ''}`}>
                <div className={`w-8 h-8 bg-cyan-100 rounded-full shadow-[0_0_20px_white,0_0_40px_cyan] ${voiceActive ? 'animate-ping' : 'animate-pulse'}`}></div>
            </div>

            {/* Decorative Lines */}
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
                    style={{ transform: `rotate(${i * 45}deg)` }}
                />
            ))}
        </div>
    );
};

export default ArcReactor;
