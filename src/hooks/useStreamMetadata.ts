import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Track } from '@/types/radio';
import { supabase } from '@/integrations/supabase/client';

export const useStreamMetadata = (streamUrl: string) => {
  const [trackInfo, setTrackInfo] = useState<Track>({ 
    title: 'Loading...', 
    artist: 'Connecting to stream...',
    coverUrl: undefined
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Use Supabase function to fetch metadata
        const { data, error } = await supabase.functions.invoke('get-metadata');

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('No data received from metadata service');
        }

        const currentTrack = {
          artist: data.artist || 'Unknown Artist',
          title: data.title || 'Unknown Track',
          coverUrl: data.coverUrl
        };

        // Only update and notify if the track has changed
        if (currentTrack.artist !== trackInfo.artist || currentTrack.title !== trackInfo.title) {


          setTrackInfo(currentTrack);

          // Update media session
          if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: currentTrack.title,
              artist: currentTrack.artist,
              artwork: [
                { 
                  src: currentTrack.coverUrl || '/placeholder.svg',
                  sizes: '512x512',
                  type: 'image/png'
                }
              ]
            });
          }

          toast({
            title: "Now Playing",
            description: `${currentTrack.artist} - ${currentTrack.title}`,
            duration: 3000
          });
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };

    fetchMetadata();
    const interval = setInterval(fetchMetadata, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [streamUrl, toast, trackInfo.artist, trackInfo.title]);

  return trackInfo;
};