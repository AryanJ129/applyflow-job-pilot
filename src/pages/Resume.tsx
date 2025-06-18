
import React from 'react';
import { ResumeProvider, useResume } from '@/components/resume/ResumeProvider';
import StepIndicator from '@/components/resume/StepIndicator';
import ResumeSteps from '@/components/resume/ResumeSteps';
import StepNavigation from '@/components/resume/StepNavigation';
import LoadingSpinner from '@/components/resume/LoadingSpinner';

const ResumeContent = () => {
  const { 
    currentStep, 
    totalSteps, 
    handleNext, 
    handlePrevious, 
    loading, 
    user, 
    isAuthChecking 
  } = useResume();

  // Show loading spinner while checking authentication
  if (isAuthChecking || !user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background py-10 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Onboarding
          </h1>
          <p className="text-muted-foreground">
            Build your professional resume in 5 simple steps
          </p>
        </div>

        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        <ResumeSteps />

        <StepNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
          loading={loading}
        />
      </div>
    </div>
  );
};

const Resume = () => {
  return (
    <ResumeProvider>
      <ResumeContent />
    </ResumeProvider>
  );
};

export default Resume;
