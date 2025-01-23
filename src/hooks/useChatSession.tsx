import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type ChatUser = {
  id: string;
  username: string;
  status: 'online' | 'offline';
  last_seen: string;
  country?: string;
};

export const useChatSession = () => {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { user_ip, country }, error: ipError } = await supabase.functions.invoke('get-ip');
        
        if (ipError) {
          console.error('Error getting IP:', ipError);
          setIsLoading(false);
          return;
        }

        if (!user_ip) {
          setIsLoading(false);
          return;
        }

        const { data: existingUser, error: userError } = await supabase
          .from('chat_users')
          .select('*')
          .eq('ip_address', user_ip)
          .maybeSingle(); // Changed from .single() to .maybeSingle()

        if (userError) {
          console.error('Error checking user:', userError);
          setIsLoading(false);
          return;
        }

        if (existingUser) {
          // Update user status and last_seen
          const { error: updateError } = await supabase
            .from('chat_users')
            .update({ 
              status: 'online', 
              last_seen: new Date().toISOString(),
              country: country || existingUser.country // Keep existing country if new one not available
            })
            .eq('id', existingUser.id);

          if (updateError) {
            console.error('Error updating user status:', updateError);
          } else {
            setUser(existingUser);
          }
        }
      } catch (error) {
        console.error('Error in session check:', error);
        toast({
          title: "Error checking session",
          description: "Please try refreshing the page",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();

    // Set up presence channel
    const channel = supabase.channel('user-presence')
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence sync');
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const registerUsername = async (username: string) => {
    try {
      const { data: { user_ip, country }, error: ipError } = await supabase.functions.invoke('get-ip');
      
      if (ipError) throw ipError;
      if (!user_ip) throw new Error('Could not determine IP address');

      const { data: newUser, error: insertError } = await supabase
        .from('chat_users')
        .insert([
          { 
            username, 
            ip_address: user_ip, 
            status: 'online',
            country 
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setUser(newUser);
      toast({
        title: "Welcome to the chat!",
        description: `You're now registered as ${username}`,
      });
    } catch (error) {
      console.error('Error registering username:', error);
      toast({
        title: "Registration failed",
        description: "Please try again with a different username",
        variant: "destructive",
      });
    }
  };

  return { user, isLoading, registerUsername };
};