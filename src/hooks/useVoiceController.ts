import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceIntentParser } from '../utils/nlpParser';
import { soundEffects } from '../utils/audio';
import { speechFeedback } from '../utils/speech';
import type { VoiceCommandResult } from '../types/task';

// TypeScript declaration for webkitSpeechRecognition
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface UseVoiceControllerProps {
  onCommandParsed: (result: VoiceCommandResult) => void;
  onBriefingRequest: () => void;
}

export function useVoiceController({ onCommandParsed, onBriefingRequest }: UseVoiceControllerProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef(false);
  const audioIntervalRef = useRef<number | null>(null);

  // Initialize SpeechRecognition
  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage(null);
      soundEffects.playListeningStart();

      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = window.setInterval(() => {
        setAudioLevel(Math.random() * 0.7 + 0.3);
      }, 100);
    };

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let finalSpeech = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalSpeech += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(currentInterim);

      if (finalSpeech.trim().length > 0) {
        const full = finalSpeech.trim();
        setTranscript(full);
        setInterimTranscript('');
        processSpokenCommand(full);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser bar.');
      } else if (event.error !== 'no-speech') {
        setErrorMessage(`Voice recognition notice: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      setAudioLevel(0);

      if (!isManuallyStoppedRef.current && isListening) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    };
  }, []);

  const processSpokenCommand = useCallback((spokenText: string) => {
    const result = VoiceIntentParser.parse(spokenText);
    setLastCommand(result);

    if (result.intent === 'briefing') {
      soundEffects.playSuccessChord();
      onBriefingRequest();
      return;
    }

    if (result.intent === 'unknown') {
      soundEffects.playErrorTone();
      speechFeedback.speak("I couldn't recognize that command. Try 'Create task' or 'Move task to done'.");
    } else {
      soundEffects.playSuccessChord();
      if (result.feedbackMessage) {
        speechFeedback.speak(result.feedbackMessage);
      }
      onCommandParsed(result);
    }
  }, [onCommandParsed, onBriefingRequest]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    isManuallyStoppedRef.current = false;
    setTranscript('');
    setInterimTranscript('');
    try {
      recognitionRef.current.start();
    } catch {
      // already active
    }
  }, []);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        soundEffects.playListeningStop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
    }
    setAudioLevel(0);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    lastCommand,
    isSupported,
    errorMessage,
    audioLevel,
    startListening,
    stopListening,
    toggleListening,
    simulateCommand: processSpokenCommand,
  };
}
