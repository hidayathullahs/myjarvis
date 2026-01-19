import { RISK_LEVELS } from './RISK_LEVELS';

export const SEMANTIC_COLORS = {
    [RISK_LEVELS.STABLE]: {
        primary: 'text-cyan-400',
        border: 'border-cyan-400',
        bg: 'bg-cyan-900/20',
        glow: 'drop-shadow-[0_0_10px_cyan]',
        pulse: 'animate-pulse-slow'
    },
    [RISK_LEVELS.ADVISORY]: {
        primary: 'text-green-400',
        border: 'border-green-400',
        bg: 'bg-green-900/20',
        glow: 'drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]',
        pulse: 'animate-pulse'
    },
    [RISK_LEVELS.WARNING]: {
        primary: 'text-amber-400',
        border: 'border-amber-400',
        bg: 'bg-amber-900/20',
        glow: 'drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]',
        pulse: 'animate-pulse'
    },
    [RISK_LEVELS.CRITICAL]: {
        primary: 'text-red-500',
        border: 'border-red-500',
        bg: 'bg-red-900/30',
        glow: 'drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]',
        pulse: 'animate-pulse-fast'
    }
};

export const ACTIVITY_OPACITY = 0.5;
