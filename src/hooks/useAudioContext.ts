import { useEffect, useRef, useState } from 'react';

export const useAudioContext = (audioElement: HTMLAudioElement | null) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!audioElement || isInitialized) return;

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
      analyserRef.current = audioContextRef.current.createAnalyser();

      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      analyserRef.current.fftSize = 256;
      setIsInitialized(true);
    } catch (e) {
      console.error('Web Audio API not supported:', e);
    }
  }, [audioElement, isInitialized]);

  return {
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
    isInitialized
  };
};