
import React from 'react';

interface LoginHeaderProps {
  showEmailForm: boolean;
  isSignUp: boolean;
}

const LoginHeader = ({ showEmailForm, isSignUp }: LoginHeaderProps) => {
  return (
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
  );
};

export default LoginHeader;
