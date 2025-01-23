import React, { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/components/ui/use-toast";
import { CoverArt } from "./CoverArt";
import { TrackInfo } from "./TrackInfo";

const RADIO_NAME = 'Identity Radio';
const URL_STREAMING = 'https://stream.zeno.fm/mz5xfb9fffhvv';
const METADATA_URL = 'https://api.zeno.fm/mounts/metadata/subscribe/mz5xfb9fffhvv';
const DEEZER_API_URL = 'https://api.deezer.com/search';
const RATE_LIMIT_DELAY = 300; // 300ms delay for better responsiveness
const DEFAULT_COVER_ART = '/placeholder.svg'; // Default cover art image

interface Track {
  title: string;
  artist: string;
  coverUrl?: string;
}

// Debounce function to handle rate limiting
const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    return new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        resolve(func(...args));
      }, waitFor);
    });
  };
};

export const RadioPlayer = () => {
  // State declarations
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track>({
    title: 'Loading...',
    artist: 'Connecting to stream...',
    coverUrl: DEFAULT_COVER_ART
  });
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastFetchRef = useRef<string>('');
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef<number>(0);
  const userInteracted = useRef<boolean>(false);

  // Hooks
  const { toast } = useToast();

  // Function declarations
  // Add ref to track current play attempt
  const playAttemptRef = useRef<Promise<void> | null>(null);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (!audioRef.current.paused) {
      audioRef.current.pause();
    } else {
      audioRef.current.load();
      audioRef.current.play();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    
    // Update UI state immediately
    setIsMuted(!isMuted);
    
    // Apply mute state
    audioRef.current.muted = !isMuted;
  }, [isMuted]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    // Apply volume change immediately if audio exists
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  }, []);

  const fetchCoverArt = useCallback((artist: string, title: string) => {
    // Use JSONP exactly like script.js
    const script = document.createElement('script');
    script.src = `${DEEZER_API_URL}?q=${encodeURIComponent(`${artist} ${title}`)}&output=jsonp&callback=handleDeezerResponse`;
    document.body.appendChild(script);

    // Clean up script after timeout
    const timeoutId = setTimeout(() => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    }, 5000);

    // Store timeout ID for cleanup
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }
    requestTimeoutRef.current = timeoutId;
  }, []);

  // Add JSONP callback to window exactly like script.js
  useEffect(() => {
    (window as any).handleDeezerResponse = (data: any) => {
      if (data.data && data.data.length > 0) {
        const artworkUrl = data.data[0].album.cover_big;
        setCurrentTrack(prev => ({ ...prev, coverUrl: artworkUrl }));

        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrack.title,
            artist: currentTrack.artist,
            artwork: [
              { src: artworkUrl, sizes: '96x96', type: 'image/png' },
              { src: artworkUrl, sizes: '128x128', type: 'image/png' },
              { src: artworkUrl, sizes: '192x192', type: 'image/png' },
              { src: artworkUrl, sizes: '256x256', type: 'image/png' },
              { src: artworkUrl, sizes: '384x384', type: 'image/png' },
              { src: artworkUrl, sizes: '512x512', type: 'image/png' }
            ]
          });
        }
      }
    };

    return () => {
      delete (window as any).handleDeezerResponse;
    };
  }, [currentTrack.title, currentTrack.artist]);







  const setupEventSource = useCallback((es: EventSource) => {
    let lastTitle = '';

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.streamTitle && data.streamTitle !== lastTitle) {
        lastTitle = data.streamTitle;
        const [artist, title] = data.streamTitle.split(' - ');
        const newTitle = title?.trim() || 'Unknown Track';
        const newArtist = artist?.trim() || 'Unknown Artist';

        // Update track info immediately
        setCurrentTrack(prev => ({
          ...prev,
          title: newTitle,
          artist: newArtist,
          coverUrl: DEFAULT_COVER_ART // Set default while loading
        }));

        // Show toast after track info is updated
        toast({
          title: "Now Playing",
          description: `${newArtist} - ${newTitle}`,
          duration: 3000
        });

        // Start cover art fetch immediately
        fetchCoverArt(newArtist, newTitle);
      }
    };

    es.onerror = () => {
      toast({
        title: "Metadata Error",
        description: "Lost connection to stream metadata. Reconnecting...",
        variant: "destructive"
      });
      
      es.close();
      // Reduce reconnection delay
      setTimeout(() => {
        const newEventSource = new EventSource(METADATA_URL);
        setupEventSource(newEventSource);
      }, 1000);
    };
  }, [toast, fetchCoverArt]);



  const handleKeyPress = useCallback((event: KeyboardEvent) => {
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
  }, [togglePlay, toggleMute]);

  // Initialize audio exactly like script.js
  useEffect(() => {
    const audio = new Audio(URL_STREAMING);
    audioRef.current = audio;

    // Set initial volume
    const defaultVolume = 80;
    audio.volume = defaultVolume / 100;
    setVolume(defaultVolume);

    // Event handlers exactly like script.js
    audio.onplay = () => {
      setIsPlaying(true);
    };

    audio.onpause = () => {
      setIsPlaying(false);
    };

    audio.onvolumechange = () => {
      if (audio.volume > 0) {
        audio.muted = false;
        setIsMuted(false);
      }
    };

    audio.onerror = () => {
      const confirmReload = window.confirm('Stream Down / Network Error. \nClick OK to try again.');
      if (confirmReload) {
        window.location.reload();
      }
    };

    // Start playing immediately
    audio.play();

    // Add keyboard controls
    document.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [handleKeyPress, toast]);



  useEffect(() => {
    const eventSource = new EventSource(METADATA_URL);
    setupEventSource(eventSource);

    return () => {
      eventSource.close();
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, [setupEventSource]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  return (
    <div className="w-full bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 sm:p-6 backdrop-blur-lg border border-white/10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="flex justify-center lg:col-span-1">
          <CoverArt
            src={currentTrack.coverUrl}
            alt="Album Cover"
            className="w-36 h-36 sm:w-48 sm:h-48 transition-opacity duration-300"
          />
        </div>

        <div className="lg:col-span-2 flex flex-col justify-between gap-4">
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{RADIO_NAME}</h2>
            <TrackInfo track={currentTrack} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
      <Toggle
        pressed={isPlaying}
        onPressedChange={togglePlay}
        size="lg"
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <Play className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
      </Toggle>

              <div className="relative group flex items-center gap-2 min-w-[200px] max-w-md">
                {/* Volume Button with Glow Effect */}
                <button
                  onClick={toggleMute}
                  className={`relative p-3 rounded-full transition-all duration-300 
                    ${isMuted ? 'bg-red-500/10' : 'bg-white/10'} 
                    hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20
                    before:absolute before:inset-0 before:rounded-full before:blur-lg before:opacity-0
                    before:transition-opacity before:duration-300
                    ${isMuted ? 'before:bg-red-500/30' : 'before:bg-white/30'}
                    group-hover:before:opacity-100`}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-red-500" />
                  ) : (
                    <Volume2 className={`w-5 h-5 transition-colors duration-300
                      ${volume > 66 ? 'text-green-400' : 
                        volume > 33 ? 'text-yellow-400' : 
                        volume > 0 ? 'text-orange-400' : 'text-white'}`} 
                    />
                  )}
                </button>

                {/* Modern Volume Slider */}
                <div className="relative flex-1 h-12 flex items-center group">
                  <div className="absolute inset-y-0 left-0 w-full flex items-center px-2">
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full
                          ${isMuted ? 'bg-red-500/50' :
                            volume > 66 ? 'bg-green-400' : 
                            volume > 33 ? 'bg-yellow-400' : 
                            'bg-orange-400'}`}
                        style={{ width: `${volume}%` }}
                      />
                    </div>
                  </div>
                  <Slider
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                {/* Volume Percentage with Glow */}
                <div className={`min-w-[3rem] text-center px-2 py-1 rounded-md text-sm font-medium
                  transition-colors duration-300
                  ${isMuted ? 'text-red-500 bg-red-500/10' :
                    volume > 66 ? 'text-green-400 bg-green-400/10' : 
                    volume > 33 ? 'text-yellow-400 bg-yellow-400/10' : 
                    'text-orange-400 bg-orange-400/10'}`}
                >
                  {volume}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};