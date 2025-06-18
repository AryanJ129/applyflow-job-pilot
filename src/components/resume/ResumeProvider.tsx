
import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

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

interface ResumeContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resumeData: ResumeData;
  updateResumeData: (section: keyof ResumeData, data: any) => void;
  saveResumeData: () => Promise<void>;
  handleNext: () => void;
  handlePrevious: () => void;
  loading: boolean;
  user: User | null;
  isAuthChecking: boolean;
  totalSteps: number;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};

interface ResumeProviderProps {
  children: React.ReactNode;
}

export const ResumeProvider = ({ children }: ResumeProviderProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
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

  const totalSteps = 5;

  useEffect(() => {
    // Check authentication and load existing resume data
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }

        setUser(session.user);
        await loadResumeData(session.user.id);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login');
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
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

  const value = {
    currentStep,
    setCurrentStep,
    resumeData,
    updateResumeData,
    saveResumeData,
    handleNext,
    handlePrevious,
    loading,
    user,
    isAuthChecking,
    totalSteps,
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};
