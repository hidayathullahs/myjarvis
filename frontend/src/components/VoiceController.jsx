import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { API_BASE_URL } from '../config';

// Initialize Voice Controller
const VoiceController = forwardRef(({ onCommand, onStatusChange, addLog, getImage, speak }, ref) => {
    const recognitionRef = useRef(null);
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Expose method to parent via ref
    useImperativeHandle(ref, () => ({
        triggerAnalyze: () => {
            if (isThinking) {
                addLog("System Busy: processing previous request...");
                return;
            }
            addLog("Command: Tactical Scan Initiated");
            const image = getImage ? getImage() : null;
            askBackend("Analyze this view", image);
        },
        analyzeImage: (base64Image) => {
            if (isThinking) {
                addLog("System Busy: processing previous request...");
                return;
            }
            addLog("Command: Visual Data Uploaded");
            askBackend("Analyze this uploaded image", base64Image);
        },
        startListening: () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    addLog("Microphone: Manually Activated");
                } catch (e) {
                    addLog("Microphone: Already Active");
                }
            }
        }
    }));

    useEffect(() => {
        // Voice loading handler
        const loadVoices = () => {
            window.speechSynthesis.getVoices();
        };
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); // Initial load

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                onStatusChange(true);
                setIsListening(true);
                addLog("Voice System: Activated");
            };

            recognition.onend = () => {
                onStatusChange(false);
                setIsListening(false);
                // Attempt restart if not intentionally stopped
                // Use a small timeout to prevent rapid-fire loops if permission denied
                setTimeout(() => {
                    try {
                        recognition.start();
                    } catch (e) {
                        // Ignore already started errors
                    }
                }, 1000);
            };

            recognition.onerror = (event) => {
                if (event.error === 'no-speech') return;
                console.warn("Speech Error:", event.error);
                if (event.error === 'not-allowed') {
                    addLog("Error: Microphone Access Denied");
                }
            };

            recognition.onresult = async (event) => {
                if (!event || !event.results || event.results.length === 0) return;

                const lastResult = event.results[event.results.length - 1];
                if (!lastResult || !lastResult[0]) return;

                const transcript = lastResult[0].transcript.toLowerCase().trim();
                addLog(`Heard: "${transcript}"`);

                // 1. FAST PATH: Direct Client Commands (Zero Latency)
                if (transcript.includes('rotation') || transcript.includes('start') || transcript.includes('stop') || transcript.includes('reset') || transcript.includes('camera') || transcript.includes('jarvis') || transcript.includes('hi') || transcript.includes('hello')) {
                    onCommand(transcript);
                    return; // Skip backend to avoid double-processing and latency
                }

                // 2. AI PATH: Everything else goes to J.A.R.V.I.S. (Backend)
                if (transcript.length > 0) {
                    addLog("Conversing...");
                    const needsVision = transcript.includes('look') || transcript.includes('see') || transcript.includes('analyze') || transcript.includes('what is this');
                    const image = (needsVision && getImage) ? getImage() : null;

                    await askBackend(transcript, image);
                }
            };

            try {
                recognition.start();
            } catch (e) {
                console.warn("Could not start recognition:", e);
            }
            recognitionRef.current = recognition;
        } else {
            addLog("Error: Browser does not support Speech API");
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null; // Prevent restart
                recognitionRef.current.stop();
            }
        };
    }, []);



    const historyRef = useRef([]);

    // ... (rest of imports)

    const askBackend = async (prompt, image) => {
        setIsThinking(true);
        try {
            // Prepare payload with history
            const response = await fetch(`${API_BASE_URL}/api/jarvis-command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    image: image, // Send the base64 image
                    history: historyRef.current // Send previous context from Ref
                })
            });

            if (!response.ok) {
                const errText = await response.json();
                throw new Error(errText.error || 'Backend error');
            }

            const data = await response.json();
            // Data is now { response: "Text", action: "COMMAND" }
            const text = data.response || "I am unable to analyze the data.";
            const action = data.action;

            addLog(`AI: ${text}`);
            if (speak) speak(text);

            // Update History (Limit to last 10 turns to avoid token overflow)
            const newHistory = [
                ...historyRef.current,
                { role: 'user', text: prompt },
                { role: 'model', text: text }
            ];
            historyRef.current = newHistory.slice(-10); // Keep last 10 turns

            if (action) {
                setTimeout(() => {
                    addLog(`AI Action: Executing ${action}`);
                    // Trigger the command in App
                    if (onCommand) onCommand(action.toLowerCase().replace('_', ' '));
                }, 1000); // Slight delay for realism
            }
        } catch (error) {
            console.error(error);
            addLog("AI Error: Check Console/API Key");
            if (speak) speak("Sir, I cannot connect. Please verify my API Key is configured in the backend.");
        } finally {
            setIsThinking(false);
        }
    };

    // const speak = (text) => { ... } // Removed in favor of prop

    // Visual Feedback
    if (!isThinking && !isListening) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 pointer-events-none">
            {/* Voice Status Indicator */}
            {isListening && !isThinking && (
                <div className="bg-red-900/80 border border-red-500 text-red-100 px-4 py-2 rounded-full shadow-lg backdrop-blur flex items-center gap-2 animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    <span className="text-xs font-bold tracking-wider">LISTENING</span>
                </div>
            )}

            {/* Thinking Status Indicator */}
            {isThinking && (
                <div className="bg-cyan-900/80 border border-cyan-400 text-cyan-100 px-4 py-2 rounded-full shadow-lg backdrop-blur flex items-center gap-2 animate-pulse">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                    <span className="text-xs font-bold tracking-wider">THINKING...</span>
                </div>
            )}
            <div className={`p-3 rounded-full border border-white/10 backdrop-blur transition-all duration-500 ${isThinking ? 'bg-cyan-600/50 shadow-[0_0_20px_cyan]' : isListening ? 'bg-red-600/50 shadow-[0_0_20px_red]' : 'bg-black/50'}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-white transition-opacity ${isThinking || isListening ? 'opacity-100' : 'opacity-50'}`}>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
            </div>
        </div>
    );
});

export default VoiceController;
