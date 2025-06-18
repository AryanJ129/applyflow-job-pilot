
import React from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmailButtonProps {
  onClick: () => void;
}

const EmailButton = ({ onClick }: EmailButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="w-full h-12 rounded-full border-border text-foreground hover:bg-accent transition-all duration-200"
    >
      <Mail className="w-4 h-4 mr-2" />
      Continue with Email
    </Button>
  );
};

export default EmailButton;
