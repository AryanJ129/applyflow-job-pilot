
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, BarChart3, FolderOpen, User } from 'lucide-react';

interface Profile {
  full_name: string;
  job_title: string;
  summary: string;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
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

    checkAuthAndFetchProfile();
  }, [navigate]);

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const dashboardCards = [
    {
      icon: <FileText className="h-8 w-8 text-[#1f1f1f]" />,
      title: "Build Resume",
      description: "Tailor your resume for any job role",
      ctaText: "Open Resume Builder",
      ctaLink: "/resume",
      bgColor: "bg-blue-50"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-[#1f1f1f]" />,
      title: "Check Resume Score",
      description: "See how your resume performs against hiring algorithms",
      ctaText: "Try ATS Checker",
      ctaLink: "/ats",
      bgColor: "bg-green-50"
    },
    {
      icon: <FolderOpen className="h-8 w-8 text-[#1f1f1f]" />,
      title: "Track Applications",
      description: "Log and manage where you've applied",
      ctaText: "Go to Tracker",
      ctaLink: "/tracker",
      bgColor: "bg-purple-50"
    },
    {
      icon: <User className="h-8 w-8 text-[#1f1f1f]" />,
      title: "Update Profile",
      description: "Make changes to your personal information or career goals",
      ctaText: "Edit Profile",
      ctaLink: "/onboarding",
      bgColor: "bg-orange-50"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-12">
            <Skeleton className="h-12 w-80 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/70 border border-[#e6e6e6] backdrop-blur-md rounded-xl shadow-md p-6">
                <Skeleton className="h-8 w-8 mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-[hsl(222.2_84%_4.9%)] mb-4">
            Welcome back, {profile ? getFirstName(profile.full_name) : 'there'} 👋
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your personalized job search dashboard. Access all your tools and track your progress in one place.
          </p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              className="bg-white/70 border border-[#e6e6e6] backdrop-blur-md rounded-xl shadow-md p-6 hover:scale-[1.02] transition-transform duration-200 cursor-pointer group"
              onClick={() => navigate(card.ctaLink)}
            >
              <div className={`w-16 h-16 ${card.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                {card.icon}
              </div>
              
              <h3 className="text-xl font-semibold text-[hsl(222.2_84%_4.9%)] mb-2">
                {card.title}
              </h3>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {card.description}
              </p>
              
              <button
                className="bg-[#1f1f1f] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#2a2a2a] transition-all w-full sm:w-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(card.ctaLink);
                }}
              >
                {card.ctaText}
              </button>
            </div>
          ))}
        </div>

        {/* Quick Stats Section */}
        {profile && (
          <div className="mt-12 bg-white/70 border border-[#e6e6e6] backdrop-blur-md rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-semibold text-[hsl(222.2_84%_4.9%)] mb-4">
              Your Profile Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Role</p>
                <p className="text-lg font-medium text-[hsl(222.2_84%_4.9%)]">
                  {profile.job_title}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Profile Status</p>
                <p className="text-lg font-medium text-green-600">
                  ✓ Complete
                </p>
              </div>
            </div>
            {profile.summary && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">Professional Summary</p>
                <p className="text-[hsl(222.2_84%_4.9%)] leading-relaxed">
                  {profile.summary}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
