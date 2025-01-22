import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { useStreamMetadata } from "@/hooks/useStreamMetadata";
import { useAudioContext } from "@/hooks/useAudioContext";
import { CoverArt } from "./CoverArt";
import { TrackInfo } from "./TrackInfo";

const RADIO_NAME = 'Identity Radio';
const URL_STREAMING = 'https://stream.zeno.fm/mz5xfb9fffhvv';

export const RadioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackInfo = useStreamMetadata(URL_STREAMING);
  const { analyser, isInitialized } = useAudioContext(audioRef.current);

  useEffect(() => {
    const audio = new Audio(URL_STREAMING);
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;
    audio.volume = volume / 100;

    const handleError = () => {
      console.error("Stream error occurred");
      setIsPlaying(false);
    };

    audio.addEventListener("error", handleError);

    // Set up keyboard controls
    const handleKeyPress = (event: KeyboardEvent) => {
      switch(event.key) {
        case ' ':
        case 'p':
        case 'P':
          togglePlay();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'ArrowUp':
          setVolume(prev => Math.min(100, prev + 10));
          break;
        case 'ArrowDown':
          setVolume(prev => Math.max(0, prev - 10));
          break;
        default:
          if (!isNaN(Number(event.key)) && Number(event.key) >= 0 && Number(event.key) <= 9) {
            setVolume(Number(event.key) * 10);
          }
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      audio.removeEventListener("error", handleError);
      document.removeEventListener('keydown', handleKeyPress);
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 backdrop-blur-lg border border-white/10">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <CoverArt
          src={trackInfo.coverUrl}
          alt="Album Cover"
          className="w-48 h-48"
        />

        <div className="flex-1 space-y-4">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-1">{RADIO_NAME}</h2>
            <TrackInfo track={trackInfo} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center md:justify-start gap-4">
              <Toggle
                pressed={isPlaying}
                onPressedChange={togglePlay}
                size="lg"
                className="w-12 h-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Toggle>

              <Toggle
                pressed={isMuted}
                onPressedChange={toggleMute}
                size="lg"
                className="w-12 h-12 rounded-full"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </Toggle>

              <div className="w-full max-w-xs">
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};