
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/resume');
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/resume');
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
          redirectTo: `${window.location.origin}/resume`
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
            emailRedirectTo: `${window.location.origin}/resume`
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
    return (
      <div className="min-h-screen bg-[hsl(0_0%_100%)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(222.2_84%_4.9%)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(0_0%_100%)] flex items-center justify-center p-4">
      <motion.div 
        className="backdrop-blur-md bg-white/70 border border-[hsl(214.3_31.8%_91.4%)] rounded-xl p-8 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-[hsl(222.2_84%_4.9%)] mb-2">
            Welcome to ApplyFlow
          </h1>
          <p className="text-center text-[hsl(215.4_16.3%_46.9%)] text-sm">
            {showEmailForm 
              ? (isSignUp ? 'Create your account to get started' : 'Sign in to start building your AI-powered resume')
              : 'Sign in to start building your AI-powered resume'
            }
          </p>
        </div>

        {!showEmailForm ? (
          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md rounded-full px-6 py-3 text-sm w-full h-12"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[hsl(214.3_31.8%_91.4%)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/70 px-2 text-[hsl(215.4_16.3%_46.9%)]">Or</span>
              </div>
            </div>

            <Button
              onClick={() => setShowEmailForm(true)}
              variant="outline"
              className="w-full h-12 rounded-full border-[hsl(214.3_31.8%_91.4%)] text-[hsl(222.2_84%_4.9%)] hover:bg-[hsl(210_40%_96.1%)]"
            >
              <Mail className="w-4 h-4 mr-2" />
              Continue with Email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-full border-[hsl(214.3_31.8%_91.4%)] bg-white/50"
              />
            </div>
            
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-full border-[hsl(214.3_31.8%_91.4%)] bg-white/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[hsl(215.4_16.3%_46.9%)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {isSignUp && (
              <div>
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 rounded-full border-[hsl(214.3_31.8%_91.4%)] bg-white/50"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md rounded-full px-6 py-3 text-sm w-full h-12"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-[hsl(215.4_16.3%_46.9%)] hover:text-[hsl(222.2_84%_4.9%)] transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="text-sm text-[hsl(215.4_16.3%_46.9%)] hover:text-[hsl(222.2_84%_4.9%)] transition-colors"
              >
                ← Back to login options
              </button>
            </div>
          </form>
        )}

        <p className="text-xs text-center text-[hsl(215.4_16.3%_46.9%)] mt-6">
          By continuing, you agree to our Terms and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
