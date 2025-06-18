
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
      className="w-full h-12 rounded-full border-[hsl(214.3_31.8%_91.4%)] text-[hsl(222.2_84%_4.9%)] hover:bg-[hsl(210_40%_96.1%)]"
    >
      <Mail className="w-4 h-4 mr-2" />
      Continue with Email
    </Button>
  );
};

export default EmailButton;
