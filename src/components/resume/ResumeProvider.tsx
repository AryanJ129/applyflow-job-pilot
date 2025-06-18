
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
  isFresher: boolean;
}

interface ResumeContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resumeData: ResumeData;
  updateResumeData: (section: keyof ResumeData, data: any) => void;
  saveProfileData: () => Promise<void>;
  handleNext: () => void;
  handlePrevious: () => void;
  loading: boolean;
  user: User | null;
  isAuthChecking: boolean;
  totalSteps: number;
  canProceed: () => boolean;
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
    isFresher: false,
  });

  const totalSteps = 5;

  useEffect(() => {
    // Check authentication and load existing profile data
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }

        setUser(session.user);
        await loadProfileData(session.user.id);
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

  const loadProfileData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      if (data) {
        // Safely cast JSONB data with proper type checking and fallbacks
        const basicInfo = data.basic_info && typeof data.basic_info === 'object' && !Array.isArray(data.basic_info)
          ? data.basic_info as { fullName?: string; jobTitle?: string; summary?: string }
          : {};

        const workExperience = Array.isArray(data.work_experience) 
          ? data.work_experience as Array<{
              jobTitle?: string;
              company?: string;
              startDate?: string;
              endDate?: string;
              description?: string;
            }>
          : [];

        const education = Array.isArray(data.education)
          ? data.education as Array<{
              degree?: string;
              institution?: string;
              graduationYear?: string;
            }>
          : [];

        const skills = Array.isArray(data.skills)
          ? data.skills.filter((skill): skill is string => typeof skill === 'string')
          : [];

        setResumeData({
          id: data.id,
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
          isFresher: workExperience.length === 0,
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    }
  };

  const saveProfileData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const profilePayload = {
        user_id: user.id,
        full_name: resumeData.basic_info.fullName,
        job_title: resumeData.basic_info.jobTitle,
        summary: resumeData.basic_info.summary,
        work_experience: resumeData.isFresher ? [] : resumeData.work_experience,
        education: resumeData.education,
        skills: resumeData.skills,
      };

      if (resumeData.id) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update(profilePayload)
          .eq('id', resumeData.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('profiles')
          .insert([profilePayload])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setResumeData(prev => ({ ...prev, id: data.id }));
        }
      }

      toast({
        title: "Success",
        description: "Profile saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Basic Info
        return resumeData.basic_info.fullName.trim() !== '' && 
               resumeData.basic_info.jobTitle.trim() !== '' && 
               resumeData.basic_info.summary.trim() !== '';
      
      case 2: // Work Experience
        // Allow proceed if fresher or if all work experiences are complete
        if (resumeData.isFresher) return true;
        if (resumeData.work_experience.length === 0) return false;
        return resumeData.work_experience.every(exp => 
          exp.jobTitle.trim() !== '' && 
          exp.company.trim() !== '' && 
          exp.startDate.trim() !== '' && 
          exp.description.trim() !== ''
        );
      
      case 3: // Education
        return resumeData.education.length > 0 && 
               resumeData.education.every(edu => 
                 edu.degree.trim() !== '' && 
                 edu.institution.trim() !== '' && 
                 edu.graduationYear.trim() !== ''
               );
      
      case 4: // Skills
        return resumeData.skills.length > 0;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast({
        title: "Please complete all required fields",
        description: "All fields marked with * are mandatory",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
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
    saveProfileData,
    handleNext,
    handlePrevious,
    loading,
    user,
    isAuthChecking,
    totalSteps,
    canProceed,
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};
