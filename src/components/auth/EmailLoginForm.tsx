
import React, { useState } from 'react';
import { ArrowRight, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EmailLoginFormProps {
  onSubmit: (email: string, password: string, confirmPassword: string) => void;
  isSignUp: boolean;
  setIsSignUp: (value: boolean) => void;
  setShowEmailForm: (value: boolean) => void;
  loading: boolean;
}

const EmailLoginForm = ({ 
  onSubmit, 
  isSignUp, 
  setIsSignUp, 
  setShowEmailForm, 
  loading 
}: EmailLoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password, confirmPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12 rounded-full border-border bg-white/50"
        />
      </div>
      
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-12 rounded-full border-border bg-white/50 pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
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
            className="h-12 rounded-full border-border bg-white/50"
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full px-4 py-3 text-sm w-full h-12 transition-all duration-200"
      >
        {isSignUp ? 'Create Account' : 'Sign In'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowEmailForm(false)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to login options
        </button>
      </div>
    </form>
  );
};

export default EmailLoginForm;
