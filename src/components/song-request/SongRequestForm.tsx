import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";

export const SongRequestForm = () => {
  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (songTitle && artist) {
      const { error } = await supabase
        .from('song_requests')
        .insert([
          { title: songTitle, artist: artist }
        ]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to submit song request",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Song Requested!",
        description: `Your request for "${songTitle}" by ${artist} has been submitted.`,
      });
      setSongTitle('');
      setArtist('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          value={songTitle}
          onChange={(e) => setSongTitle(e.target.value)}
          placeholder="Song title"
          className="w-full"
        />
      </div>
      
      <div>
        <Input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artist name"
          className="w-full"
        />
      </div>
      
      <Button type="submit" className="w-full">
        Submit Request
      </Button>
    </form>
  );
};