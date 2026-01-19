import { useState, useEffect, useRef, useCallback } from 'react';

export function useJarvisVoice() {
    // const [voices, setVoices] = useState([]); // Unused
    const jarvisVoice = useRef(null);
    const synth = window.speechSynthesis;

    useEffect(() => {
        const loadVoices = () => {
            const available = synth.getVoices();
            // setVoices(available);

            // Priority Logic for Jarvis-like voices
            // 1. Google UK English Male (Chrome)
            // 2. Microsoft George (Windows)
            // 3. Daniel (Mac)
            // 4. Any UK English
            jarvisVoice.current = available.find(v => v.name === 'Google UK English Male') ||
                available.find(v => v.name.includes('George')) ||
                available.find(v => v.name === 'Daniel') ||
                available.find(v => v.lang === 'en-GB') ||
                available[0];
        };

        loadVoices();
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
    }, [synth]);

    const speak = useCallback((text) => {
        if (!synth) return;

        // Ensure not paused
        if (synth.paused) synth.resume();

        // Cancel previous if any (to prevent queue buildup)
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        if (jarvisVoice.current) {
            utterance.voice = jarvisVoice.current;
        } else {
            // Failsafe: Try to find a voice just in time
            const avail = synth.getVoices();
            utterance.voice = avail.find(v => v.lang === 'en-GB') || avail[0];
        }

        // Jarvis Profile Tuning
        utterance.pitch = 0.9;
        utterance.rate = 1.0; // Slightly slower for clarity
        utterance.volume = 1;

        synth.speak(utterance);
    }, [synth]);

    // Unlock function to be called on user click
    const wake = useCallback(() => {
        if (!synth) return;
        if (synth.paused) synth.resume();
        const empty = new SpeechSynthesisUtterance('');
        empty.volume = 0;
        synth.speak(empty);
    }, [synth]);

    return { speak, wake, voiceName: jarvisVoice.current?.name };
}
