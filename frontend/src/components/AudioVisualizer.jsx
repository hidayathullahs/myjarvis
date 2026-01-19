import React, { useEffect, useRef } from 'react';

const AudioVisualizer = ({ isActive, color = "#00f0ff" }) => {
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (isActive) {
            startVisualizer();
        } else {
            stopVisualizer();
        }
        return () => stopVisualizer();
    }, [isActive]);

    const startVisualizer = async () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 64; // Low detail for retro look

            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            draw();
        } catch (err) {
            console.error("Audio Visualizer Error:", err);
        }
    };

    const stopVisualizer = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (sourceRef.current) sourceRef.current.disconnect();
        // Don't close context to allow reuse
    };

    const draw = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        const ctx = canvasRef.current.getContext('2d');
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;

        ctx.clearRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height;

            ctx.fillStyle = color;
            // Create a glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;

            ctx.fillRect(x, height - barHeight, barWidth, barHeight);

            x += barWidth + 2;
        }

        animationRef.current = requestAnimationFrame(draw);
    };

    return (
        <canvas
            ref={canvasRef}
            width={200}
            height={50}
            className="w-full h-full opacity-80"
        />
    );
};

export default AudioVisualizer;
