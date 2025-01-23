import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from '@supabase/auth-helpers-react';

type AuthContextType = {
  isAdmin: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const session = useSession();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (session?.user) {
          const { data: adminData, error } = await supabase
            .from('admin_users')
            .select('*')
            .single();
          
          if (error) {
            console.error('Error checking admin status:', error);
            toast({
              title: "Error",
              description: "Failed to verify admin status",
              variant: "destructive"
            });
            setIsAdmin(false);
          } else {
            setIsAdmin(!!adminData);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast({
          title: "Error",
          description: "Failed to verify admin status",
          variant: "destructive"
        });
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        checkAdminStatus();
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [session, toast]);

  return (
    <AuthContext.Provider value={{ isAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);