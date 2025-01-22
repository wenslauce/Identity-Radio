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
        const { data, error } = await supabase.functions.invoke('get-metadata', {
          method: 'GET'
        });
        
        if (error) {
          console.error('Error fetching metadata:', error);
          return;
        }

        if (data && (data.title || data.artist)) {
          if (data.artist !== trackInfo.artist || data.title !== trackInfo.title) {
            const newTrackInfo = { 
              artist: data.artist || 'Unknown Artist', 
              title: data.title || 'Unknown Track',
              coverUrl: data.coverUrl
            };
            
            setTrackInfo(newTrackInfo);
            
            if ('mediaSession' in navigator) {
              navigator.mediaSession.metadata = new MediaMetadata({
                title: newTrackInfo.title,
                artist: newTrackInfo.artist,
                artwork: [
                  { 
                    src: newTrackInfo.coverUrl || '/placeholder.svg',
                    sizes: '512x512',
                    type: 'image/png'
                  }
                ]
              });
            }

            toast({
              title: "Now Playing",
              description: `${newTrackInfo.artist} - ${newTrackInfo.title}`,
              duration: 3000
            });
          }
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