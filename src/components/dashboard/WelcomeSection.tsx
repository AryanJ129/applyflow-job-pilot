
import React from 'react';

interface WelcomeSectionProps {
  firstName: string;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ firstName }) => {
  return (
    <div className="mb-12 text-center">
      <h1 className="text-4xl font-bold text-[hsl(222.2_84%_4.9%)] mb-4">
        Welcome back, {firstName} 👋
      </h1>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
        Your personalized job search dashboard. Access all your tools and track your progress in one place.
      </p>
    </div>
  );
};

export default WelcomeSection;
