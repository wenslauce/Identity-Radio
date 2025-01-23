
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAuth();
  const { toast } = useToast();

  const checkAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast({
          title: "Authentication Error",
          description: "Please try logging in again",
          variant: "destructive"
        });
        return;
      }
      
      if (session) {
        // First check if user exists in admin_users table
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (adminError) {
          console.error('Error checking admin status:', adminError);
          toast({
            title: "Error",
            description: "Failed to verify admin status",
            variant: "destructive"
          });
          await supabase.auth.signOut();
          return;
        }

        if (adminData) {
          navigate('/admin');
        } else {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive"
          });
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      toast({
        title: "Error",
        description: "An error occurred while checking authentication",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!isLoading) {
      checkAuth();
    }
  }, [isLoading, navigate, toast]);

  // Set up auth event listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        checkAuth();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-purple-900/20 p-4">
      <div className="w-full max-w-md glass rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#7c3aed',
                  brandAccent: '#6d28d9'
                }
              }
            }
          }}
          theme="light"
          providers={[]}
        />
      </div>
    </div>
  );
};

export default Login;