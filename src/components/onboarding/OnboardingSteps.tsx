
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BasicInfoStep from './BasicInfoStep';
import WorkExperienceStep from './WorkExperienceStep';
import EducationStep from './EducationStep';
import SkillsStep from './SkillsStep';
import ProfileReviewStep from './ProfileReviewStep';
import { useOnboarding } from './OnboardingProvider';

const OnboardingSteps = () => {
  const { currentStep, profileData, updateProfileData, saveProfileData, loading } = useOnboarding();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            data={profileData.basic_info}
            onUpdate={(data) => updateProfileData('basic_info', data)}
          />
        );
      case 2:
        return (
          <WorkExperienceStep
            data={profileData.work_experience}
            onUpdate={(data) => updateProfileData('work_experience', data)}
            isFresher={profileData.isFresher}
            onFresherChange={(isFresher) => updateProfileData('isFresher', isFresher)}
          />
        );
      case 3:
        return (
          <EducationStep
            data={profileData.education}
            onUpdate={(data) => updateProfileData('education', data)}
          />
        );
      case 4:
        return (
          <SkillsStep
            data={profileData.skills}
            onUpdate={(data) => updateProfileData('skills', data)}
          />
        );
      case 5:
        return (
          <ProfileReviewStep
            data={profileData}
            onSave={saveProfileData}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white/70 dark:bg-[#0f0f0f99] border border-[hsl(214.3_31.8%_91.4%)] dark:border-[hsl(217.2_32.6%_17.5%)] rounded-xl shadow-md backdrop-blur-md p-8"
      >
        {renderCurrentStep()}
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingSteps;
