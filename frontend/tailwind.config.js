/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                jarvis: {
                    bg: '#050505',
                    blue: '#00f0ff',
                    cyan: '#22d3ee',
                    dark: '#0a0a12',
                    panel: 'rgba(10, 16, 30, 0.6)',
                    border: 'rgba(0, 240, 255, 0.3)',
                    alert: '#ef4444',
                    success: '#22c55e',
                },
                fontFamily: {
                    mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
                }
            },
            animation: {
                'spin-slow': 'spin 12s linear infinite',
                'spin-reverse': 'spin-reverse 15s linear infinite',
                'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'scan': 'scan 4s linear infinite',
                'flash': 'flash 0.5s ease-in-out',
                'glitch': 'glitch 1s linear infinite',
            },
            keyframes: {
                'spin-reverse': {
                    '0%': { transform: 'rotate(360deg)' },
                    '100%': { transform: 'rotate(0deg)' },
                },
                'scan': {
                    '0%': { backgroundPosition: '0% 0%' },
                    '100%': { backgroundPosition: '0% 100%' },
                },
                'flash': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.3' },
                },
            }
        },
    },
    plugins: [],
}
