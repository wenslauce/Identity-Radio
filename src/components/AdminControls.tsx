import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2 } from 'lucide-react';

export const AdminControls = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const handleReset = async () => {
    try {
      // Delete all chat messages with a WHERE clause that matches all records
      const { error: chatError } = await supabase
        .from('chat_messages')
        .delete()
        .gte('created_at', '2000-01-01'); // This will match all records since this date is in the past
      
      if (chatError) throw chatError;

      // Delete all song requests with a WHERE clause that matches all records
      const { error: songError } = await supabase
        .from('song_requests')
        .delete()
        .gte('requested_at', '2000-01-01'); // This will match all records since this date is in the past

      if (songError) throw songError;

      toast({
        title: "Reset Successful",
        description: "All chats and song requests have been cleared.",
      });
    } catch (error) {
      console.error('Error resetting data:', error);
      toast({
        title: "Reset Failed",
        description: "There was an error clearing the data.",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="flex justify-end mb-4">
      <Button
        variant="destructive"
        onClick={handleReset}
        className="flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Reset All Data
      </Button>
    </div>
  );
};