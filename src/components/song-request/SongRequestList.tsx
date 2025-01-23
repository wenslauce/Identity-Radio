import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { Check, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocation } from 'react-router-dom';

interface SongRequest {
  id: string;
  title: string;
  artist: string;
  status: 'pending' | 'played';
  requested_at: string;
}

export const SongRequestList = () => {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('song-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'song_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('song_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return;
    }

    setRequests(data || []);
  };

  const markAsPlayed = async (id: string) => {
    const { error } = await supabase
      .from('song_requests')
      .update({ 
        status: 'played',
        played_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to mark song as played",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Song marked as played",
    });
  };

  const deleteSongRequest = async (id: string) => {
    const { error } = await supabase
      .from('song_requests')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete song request",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Song request deleted",
    });
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Recent Requests</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Status</TableHead>
            {isAdmin && isAdminPage && (
              <>
                <TableHead>Requested At</TableHead>
                <TableHead>Actions</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.title}</TableCell>
              <TableCell>{request.artist}</TableCell>
              <TableCell>{request.status}</TableCell>
              {isAdmin && isAdminPage && (
                <>
                  <TableCell>
                    {new Date(request.requested_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => markAsPlayed(request.id)}
                        disabled={request.status === 'played'}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteSongRequest(request.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};