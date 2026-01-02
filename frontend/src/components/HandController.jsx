import React, { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export default function HandController({ onGesture, cameraEnabled = true, onError }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const handLandmarkerRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);
    const cameraEnabledRef = useRef(cameraEnabled);

    // Keep ref in sync with prop
    useEffect(() => {
        cameraEnabledRef.current = cameraEnabled;
    }, [cameraEnabled]);

    useEffect(() => {
        const initMediaPipe = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
            );

            handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 2, // Enable multi-hand tracking
                minHandDetectionConfidence: 0.3, // Sensitivity
                minHandPresenceConfidence: 0.3,
                minTrackingConfidence: 0.3
            });

            if (cameraEnabled) {
                startCamera();
            }
        };

        if (cameraEnabled) {
            if (!handLandmarkerRef.current) {
                initMediaPipe();
            } else {
                startCamera();
            }
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
            handLandmarkerRef.current = null; // Force cleanup
        };
    }, [cameraEnabled]);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        clearCanvas();
    };

    const startCamera = async () => {
        if (!videoRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 } // Lower res for performance
            });
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            // Listen once for data loaded
            videoRef.current.onloadeddata = predictWebcam;
        } catch (err) {
            console.error("Camera error:", err);
            if (onError) onError(err);
        }
    };

    const predictWebcam = async () => {
        // Use Ref for current state in loop
        if (!handLandmarkerRef.current || !videoRef.current || !cameraEnabledRef.current) return;

        let startTimeMs = performance.now();

        if (videoRef.current.currentTime > 0) {
            const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

            if (results && results.landmarks && results.landmarks.length > 0) {
                // Collect gestures for ALL detected hands
                const gestures = results.landmarks.map(landmarks => detectGesture(landmarks));

                // Pass count as 3rd arg
                onGesture(gestures, results.landmarks, results.landmarks.length);

                // Draw all
                const canvas = canvasRef.current;
                const ctx = canvas ? canvas.getContext('2d') : null;

                if (canvas && ctx) {
                    canvas.width = videoRef.current.videoWidth;
                    canvas.height = videoRef.current.videoHeight;
                    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear once

                    results.landmarks.forEach(landmarks => drawLandmarksOnCtx(ctx, landmarks, canvas.width, canvas.height));
                }
            } else {
                onGesture(['Idle'], [], 0);
                clearCanvas();
            }
        }

        animationFrameRef.current = requestAnimationFrame(predictWebcam);
    };

    const detectGesture = (landmarks) => {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        const indexPip = landmarks[6];
        const middlePip = landmarks[10];
        const ringPip = landmarks[14];
        const pinkyPip = landmarks[18];

        // 1. PINCH (Thumb & Index Close)
        const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        if (pinchDist < 0.05) return 'Pinch';

        // 2. FIST (All fingers curled)
        // Check if tips are lower than PIP joints (assuming hand is upright)
        // This logic is simple, might need improvement for orientation
        const isFist = indexTip.y > indexPip.y && middleTip.y > middlePip.y && ringTip.y > ringPip.y && pinkyTip.y > pinkyPip.y;
        if (isFist) return 'Fist';

        // 3. VICTORY (Index & Middle UP, others DOWN)
        const isIndexUp = indexTip.y < indexPip.y;
        const isMiddleUp = middleTip.y < middlePip.y;
        // Ring/Pinky down
        const isRingDown = ringTip.y > ringPip.y;
        const isPinkyDown = pinkyTip.y > pinkyPip.y;

        if (isIndexUp && isMiddleUp && isRingDown && isPinkyDown) return 'Victory';

        // 4. OPEN HAND (All fingers extended)
        const isIndexOpen = indexTip.y < indexPip.y;
        const isMiddleOpen = middleTip.y < middlePip.y;
        const isRingOpen = ringTip.y < ringPip.y;
        const isPinkyOpen = pinkyTip.y < pinkyPip.y;

        if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) return 'Open Hand';

        // 5. Default
        return 'Idle';
    };

    const drawLandmarksOnCtx = (ctx, landmarks, width, height) => {
        ctx.fillStyle = "#00f0ff";
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2;

        for (const point of landmarks) {
            const x = point.x * width;
            const y = point.y * height;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    if (!cameraEnabled) return null;

    return (
        <div className="absolute top-4 right-4 w-64 h-48 border border-jarvis-blue bg-black/50 overflow-hidden rounded-lg z-50 opacity-80 hover:opacity-100 transition-opacity">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover -scale-x-100" autoPlay playsInline muted></video>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover -scale-x-100"></canvas>
            <div className="absolute bottom-1 left-2 text-xs text-jarvis-blue bg-black px-1">CAM FEED</div>
        </div>
    );
}
