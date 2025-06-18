
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BasicInfoStep from './BasicInfoStep';
import WorkExperienceStep from './WorkExperienceStep';
import EducationStep from './EducationStep';
import SkillsStep from './SkillsStep';
import ReviewStep from './ReviewStep';
import { useResume } from './ResumeProvider';

const ResumeSteps = () => {
  const { currentStep, resumeData, updateResumeData, saveResumeData, loading } = useResume();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            data={resumeData.basic_info}
            onUpdate={(data) => updateResumeData('basic_info', data)}
          />
        );
      case 2:
        return (
          <WorkExperienceStep
            data={resumeData.work_experience}
            onUpdate={(data) => updateResumeData('work_experience', data)}
          />
        );
      case 3:
        return (
          <EducationStep
            data={resumeData.education}
            onUpdate={(data) => updateResumeData('education', data)}
          />
        );
      case 4:
        return (
          <SkillsStep
            data={resumeData.skills}
            onUpdate={(data) => updateResumeData('skills', data)}
          />
        );
      case 5:
        return (
          <ReviewStep
            data={resumeData}
            onSave={saveResumeData}
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

export default ResumeSteps;
