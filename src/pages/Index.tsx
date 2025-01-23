import { useState, useEffect } from "react";
import { ChatSection } from "@/components/chat/ChatSection";
import { SongRequest } from "@/components/SongRequest";
import { UsernameForm } from "@/components/chat/UsernameForm";
import { MainNav } from "@/components/layout/MainNav";
import { Footer } from "@/components/layout/Footer";
import { RadioPlayer } from "@/components/RadioPlayer";
import { useChatSession } from "@/hooks/chat/useChatSession";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { user, isLoading, registerUsername } = useChatSession();
  type Message = {
    id: string;
    message: string;
    created_at: string;
    user_id: string;
    user: {
      id: string;
      username: string;
      status: 'online' | 'offline';
    };
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, user:chat_users(*)')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    const fetchMessageDetails = async (messageId: string) => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*, user:chat_users(*)')
        .eq('id', messageId)
        .single();
      
      if (data) {
        setMessages(current => [...current, data]);
      }
    };

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages' 
      }, (payload) => {
        fetchMessageDetails(payload.new.id);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          message: content,
          user_id: user.id
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background to-purple-900/20 p-4 md:p-8 flex flex-col">
      <MainNav />
      <div className="max-w-7xl mx-auto space-y-8 flex-grow">
        <RadioPlayer />
        <div className="glass rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-lg border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            <div className="lg:col-span-8">
              {isLoading ? (
                <div className="glass rounded-xl p-4 h-[400px] flex items-center justify-center">
                  <p>Loading...</p>
                </div>
              ) : user ? (
                <ChatSection 
                  currentUser={user}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                />
              ) : (
                <UsernameForm onSubmit={registerUsername} />
              )}
            </div>
            <div className="lg:col-span-4">
              <SongRequest />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;