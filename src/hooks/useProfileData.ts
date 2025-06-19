
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  id: string;
  full_name: string;
  job_title: string;
  summary: string;
  education: Array<{
    degree: string;
    institution: string;
    graduationYear: string;
  }>;
  skills: string[];
}

interface UserInfo {
  email: string;
}

export const useProfileData = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, []);

  const checkAuthAndFetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUserInfo({ email: session.user.email || '' });

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        if (error.code === 'PGRST116') {
          navigate('/onboarding');
          return;
        }
      } else {
        const education = Array.isArray(profileData.education) ? profileData.education : [];
        const skills = Array.isArray(profileData.skills) ? profileData.skills : [];

        setProfile({
          id: profileData.id,
          full_name: profileData.full_name || '',
          job_title: profileData.job_title || '',
          summary: profileData.summary || '',
          education: education.map((edu: any) => ({
            degree: edu.degree || '',
            institution: edu.institution || '',
            graduationYear: edu.graduationYear || '',
          })),
          skills: skills.filter((skill: any) => typeof skill === 'string'),
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (field: keyof ProfileData, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const addEducation = () => {
    if (!profile) return;
    const newEducation = {
      degree: '',
      institution: '',
      graduationYear: '',
    };
    updateProfile('education', [...profile.education, newEducation]);
  };

  const updateEducation = (index: number, field: string, value: string) => {
    if (!profile) return;
    const updatedEducation = [...profile.education];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    updateProfile('education', updatedEducation);
  };

  const removeEducation = (index: number) => {
    if (!profile) return;
    const updatedEducation = profile.education.filter((_, i) => i !== index);
    updateProfile('education', updatedEducation);
  };

  const addSkill = () => {
    if (!profile || !newSkill.trim() || profile.skills.includes(newSkill.trim())) return;
    updateProfile('skills', [...profile.skills, newSkill.trim()]);
    setNewSkill('');
  };

  const removeSkill = (skillToRemove: string) => {
    if (!profile) return;
    updateProfile('skills', profile.skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          job_title: profile.job_title,
          summary: profile.summary,
          education: profile.education,
          skills: profile.skills,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return {
    profile,
    userInfo,
    loading,
    saving,
    newSkill,
    setNewSkill,
    updateProfile,
    addEducation,
    updateEducation,
    removeEducation,
    addSkill,
    removeSkill,
    handleKeyPress,
    saveProfile,
    handleLogout,
  };
};
