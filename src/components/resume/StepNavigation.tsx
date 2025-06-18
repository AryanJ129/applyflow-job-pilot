
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useResume } from './ResumeProvider';

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
  const { canProceed } = useResume();

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

      <Button
        onClick={onNext}
        disabled={currentStep === totalSteps || !canProceed()}
        className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 rounded-full px-6 h-12 disabled:opacity-50"
      >
        {currentStep === totalSteps ? (
          'Review & Export'
        ) : (
          <>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
};

export default StepNavigation;
