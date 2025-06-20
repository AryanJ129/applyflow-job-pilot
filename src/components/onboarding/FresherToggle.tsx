
import React from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

interface FresherToggleProps {
  isFresher: boolean;
  onToggle: () => void;
}

const FresherToggle = ({ isFresher, onToggle }: FresherToggleProps) => {
  return (
    <div className="flex justify-center mb-6">
      <Button
        onClick={onToggle}
        variant={isFresher ? "default" : "outline"}
        className={`flex items-center gap-2 h-12 px-6 rounded-full transition-all duration-300 ${
          isFresher 
            ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 shadow-lg' 
            : 'border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-border'
        }`}
      >
        <GraduationCap className="w-4 h-4" />
        {isFresher ? "I'm just starting my career" : "I'm just starting my career"}
      </Button>
    </div>
  );
};

export default FresherToggle;
