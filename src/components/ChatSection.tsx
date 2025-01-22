import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Flag } from 'lucide-react';
import type { ChatUser } from '@/hooks/useChatSession';

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  chat_users: ChatUser;
}

interface ChatSectionProps {
  currentUser: ChatUser;
}

export const ChatSection = ({ currentUser }: ChatSectionProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          chat_users (*)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error loading messages",
        description: "Please refresh the page to try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Set up realtime subscription for messages
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the complete message with user data
            const { data: newMessage, error } = await supabase
              .from('chat_messages')
              .select(`*, chat_users (*)`)
              .eq('id', payload.new.id)
              .single();

            if (!error && newMessage) {
              setMessages(prev => [...prev, newMessage]);
              // Show notification for new messages
              if (newMessage.user_id !== currentUser.id) {
                new Notification('New Message', {
                  body: `${newMessage.chat_users.username}: ${newMessage.message}`,
                });
              }
            }
          }
        }
      )
      .subscribe();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, toast]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([
          {
            message: newMessage.trim(),
            user_id: currentUser.id,
          }
        ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4 h-[400px] flex items-center justify-center">
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 h-[400px] flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Live Chat</h2>
      
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`bg-secondary/50 rounded-lg p-3 ${
                msg.user_id === currentUser.id ? 'ml-auto max-w-[80%]' : 'mr-auto max-w-[80%]'
              }`}
            >
              <div className="flex justify-between items-baseline gap-2">
                <div className="flex items-center gap-2">
                  {msg.chat_users?.country && (
                    <Flag className="h-4 w-4" aria-label={`Flag of ${msg.chat_users.country}`} />
                  )}
                  <span className="font-medium text-primary">
                    {msg.chat_users?.username || 'Unknown User'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-1 text-sm break-words">{msg.message}</p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" disabled={!newMessage.trim()}>Send</Button>
      </form>
    </div>
  );
};