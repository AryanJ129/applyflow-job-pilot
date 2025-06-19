
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Profile {
  full_name: string;
  job_title: string;
  summary: string;
}

export const useDashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, [navigate]);

  const checkAuthAndFetchProfile = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUser(session.user);

      // Fetch user profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('full_name, job_title, summary')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If no profile exists, redirect to onboarding
        if (error.code === 'PGRST116') {
          navigate('/onboarding');
          return;
        }
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  return {
    profile,
    loading,
    user,
    getFirstName
  };
};
