
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/auth/LoadingSpinner';
import BackButton from '@/components/auth/BackButton';
import LoginHeader from '@/components/auth/LoginHeader';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import EmailOrDivider from '@/components/auth/EmailOrDivider';
import EmailButton from '@/components/auth/EmailButton';
import EmailLoginForm from '@/components/auth/EmailLoginForm';
import LoginFooter from '@/components/auth/LoginFooter';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/onboarding');
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/onboarding');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`
        }
      });
      
      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (email: string, password: string, confirmPassword: string, name?: string) => {
    if (isSignUp && password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: {
              full_name: name || ''
            }
          }
        });
        
        if (error) {
          toast({
            title: "Sign Up Error",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          toast({
            title: "Sign In Error",
            description: error.message,
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <BackButton />

      <motion.div 
        className="bg-white/70 backdrop-blur-md border border-[#e6e6e6] rounded-2xl shadow-md p-8 w-full max-w-md"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <LoginHeader showEmailForm={showEmailForm} isSignUp={isSignUp} />

        {!showEmailForm ? (
          <div className="space-y-6">
            <GoogleLoginButton onGoogleLogin={handleGoogleLogin} loading={loading} />
            <EmailOrDivider />
            <EmailButton onClick={() => setShowEmailForm(true)} />
          </div>
        ) : (
          <EmailLoginForm
            onSubmit={handleEmailAuth}
            isSignUp={isSignUp}
            setIsSignUp={setIsSignUp}
            setShowEmailForm={setShowEmailForm}
            loading={loading}
          />
        )}

        <LoginFooter />
      </motion.div>
    </div>
  );
};

export default Login;
