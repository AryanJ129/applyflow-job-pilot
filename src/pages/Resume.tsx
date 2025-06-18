
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import StepIndicator from '@/components/resume/StepIndicator';
import BasicInfoStep from '@/components/resume/BasicInfoStep';
import WorkExperienceStep from '@/components/resume/WorkExperienceStep';
import EducationStep from '@/components/resume/EducationStep';
import SkillsStep from '@/components/resume/SkillsStep';
import ReviewStep from '@/components/resume/ReviewStep';
import StepNavigation from '@/components/resume/StepNavigation';

interface ResumeData {
  id?: string;
  basic_info: {
    fullName: string;
    jobTitle: string;
    summary: string;
  };
  work_experience: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationYear: string;
  }>;
  skills: string[];
}

const Resume = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData>({
    basic_info: {
      fullName: '',
      jobTitle: '',
      summary: '',
    },
    work_experience: [],
    education: [],
    skills: [],
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 5;

  useEffect(() => {
    // Check authentication and load existing resume data
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUser(session.user);
      await loadResumeData(session.user.id);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadResumeData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const resume = data[0];
        
        // Safely cast JSONB data with proper type checking and fallbacks
        const basicInfo = resume.basic_info && typeof resume.basic_info === 'object' && !Array.isArray(resume.basic_info)
          ? resume.basic_info as { fullName?: string; jobTitle?: string; summary?: string }
          : {};

        const workExperience = Array.isArray(resume.work_experience) 
          ? resume.work_experience as Array<{
              jobTitle?: string;
              company?: string;
              startDate?: string;
              endDate?: string;
              description?: string;
            }>
          : [];

        const education = Array.isArray(resume.education)
          ? resume.education as Array<{
              degree?: string;
              institution?: string;
              graduationYear?: string;
            }>
          : [];

        const skills = Array.isArray(resume.skills)
          ? resume.skills.filter((skill): skill is string => typeof skill === 'string')
          : [];

        setResumeData({
          id: resume.id,
          basic_info: {
            fullName: basicInfo.fullName || '',
            jobTitle: basicInfo.jobTitle || '',
            summary: basicInfo.summary || '',
          },
          work_experience: workExperience.map(exp => ({
            jobTitle: exp.jobTitle || '',
            company: exp.company || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            description: exp.description || '',
          })),
          education: education.map(edu => ({
            degree: edu.degree || '',
            institution: edu.institution || '',
            graduationYear: edu.graduationYear || '',
          })),
          skills,
        });
      }
    } catch (error: any) {
      console.error('Error loading resume:', error);
      toast({
        title: "Error",
        description: "Failed to load resume data",
        variant: "destructive"
      });
    }
  };

  const saveResumeData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const resumePayload = {
        user_id: user.id,
        basic_info: resumeData.basic_info,
        work_experience: resumeData.work_experience,
        education: resumeData.education,
        skills: resumeData.skills,
      };

      if (resumeData.id) {
        // Update existing resume
        const { error } = await supabase
          .from('resumes')
          .update(resumePayload)
          .eq('id', resumeData.id);

        if (error) throw error;
      } else {
        // Create new resume
        const { data, error } = await supabase
          .from('resumes')
          .insert([resumePayload])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setResumeData(prev => ({ ...prev, id: data.id }));
        }
      }

      toast({
        title: "Success",
        description: "Resume saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving resume:', error);
      toast({
        title: "Error",
        description: "Failed to save resume",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
    saveResumeData();
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateResumeData = (section: keyof ResumeData, data: any) => {
    setResumeData(prev => ({
      ...prev,
      [section]: data
    }));
  };

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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Resume Builder
          </h1>
          <p className="text-muted-foreground">
            Build your professional resume in 5 simple steps
          </p>
        </div>

        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

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

export default Resume;
