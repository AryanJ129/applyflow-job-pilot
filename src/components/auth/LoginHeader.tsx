
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface LoginHeaderProps {
  showEmailForm: boolean;
  isSignUp: boolean;
}

const LoginHeader = ({ showEmailForm, isSignUp }: LoginHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Welcome to ApplyFlow
      </h1>
      
      <p className="text-sm text-muted-foreground">
        {showEmailForm 
          ? (isSignUp ? 'Create your account to get started' : 'Sign in to start building your AI-powered resume')
          : 'Sign in to start building your AI-powered resume'
        }
      </p>
    </div>
  );
};

export default LoginHeader;
