
import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface ProfileData {
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

interface OnboardingContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  profileData: ProfileData;
  updateProfileData: (section: keyof ProfileData, data: any) => void;
  saveProfileData: () => Promise<void>;
  handleNext: () => void;
  handlePrevious: () => void;
  loading: boolean;
  user: User | null;
  isAuthChecking: boolean;
  totalSteps: number;
  canProceed: () => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within a OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState<ProfileData>({
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
        // Map the profiles table data to our ProfileData structure
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

        setProfileData({
          id: data.id,
          basic_info: {
            fullName: data.full_name || '',
            jobTitle: data.job_title || '',
            summary: data.summary || '',
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
        full_name: profileData.basic_info.fullName,
        job_title: profileData.basic_info.jobTitle,
        summary: profileData.basic_info.summary,
        work_experience: profileData.isFresher ? [] : profileData.work_experience,
        education: profileData.education,
        skills: profileData.skills,
      };

      if (profileData.id) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update(profilePayload)
          .eq('id', profileData.id);

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
          setProfileData(prev => ({ ...prev, id: data.id }));
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
        return profileData.basic_info.fullName.trim() !== '' && 
               profileData.basic_info.jobTitle.trim() !== '' && 
               profileData.basic_info.summary.trim() !== '';
      
      case 2: // Work Experience
        // Allow proceed if fresher or if all work experiences are complete
        if (profileData.isFresher) return true;
        if (profileData.work_experience.length === 0) return false;
        return profileData.work_experience.every(exp => 
          exp.jobTitle.trim() !== '' && 
          exp.company.trim() !== '' && 
          exp.startDate.trim() !== '' && 
          exp.description.trim() !== ''
        );
      
      case 3: // Education
        return profileData.education.length > 0 && 
               profileData.education.every(edu => 
                 edu.degree.trim() !== '' && 
                 edu.institution.trim() !== '' && 
                 edu.graduationYear.trim() !== ''
               );
      
      case 4: // Skills
        return profileData.skills.length > 0;
      
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

  const updateProfileData = (section: keyof ProfileData, data: any) => {
    setProfileData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const value = {
    currentStep,
    setCurrentStep,
    profileData,
    updateProfileData,
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
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
