
import React from 'react';
import { OnboardingProvider, useOnboarding } from '@/components/onboarding/OnboardingProvider';
import StepIndicator from '@/components/onboarding/StepIndicator';
import OnboardingSteps from '@/components/onboarding/OnboardingSteps';
import StepNavigation from '@/components/onboarding/StepNavigation';
import LoadingSpinner from '@/components/onboarding/LoadingSpinner';

const OnboardingContent = () => {
  const { 
    currentStep, 
    totalSteps, 
    handleNext, 
    handlePrevious, 
    loading, 
    user, 
    isAuthChecking 
  } = useOnboarding();

  // Show loading spinner while checking authentication
  if (isAuthChecking || !user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background py-10 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome to ApplyFlow
          </h1>
          <p className="text-muted-foreground">
            Let's set up your profile in 5 simple steps
          </p>
        </div>

        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        <OnboardingSteps />

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

const Onboarding = () => {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
};

export default Onboarding;
