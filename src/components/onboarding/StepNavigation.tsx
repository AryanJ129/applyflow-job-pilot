
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  loading: boolean;
}

const StepNavigation = ({ 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrevious, 
  loading 
}: StepNavigationProps) => {
  const { canProceed } = useOnboarding();

  return (
    <div className="flex justify-between items-center">
      <Button
        onClick={onPrevious}
        disabled={currentStep === 1}
        variant="outline"
        className="rounded-full px-6 h-12"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-sm text-muted-foreground">
        {currentStep} of {totalSteps}
      </div>

      {/* Removed the Next/Complete Setup button */}
      <div></div>
    </div>
  );
};

export default StepNavigation;
