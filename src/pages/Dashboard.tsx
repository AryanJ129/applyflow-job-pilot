
import React from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import WelcomeSection from '@/components/dashboard/WelcomeSection';
import DashboardCards from '@/components/dashboard/DashboardCards';
import ProfileSummary from '@/components/dashboard/ProfileSummary';

const Dashboard = () => {
  const { profile, loading, getFirstName } = useDashboard();

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <WelcomeSection 
          firstName={profile ? getFirstName(profile.full_name) : 'there'} 
        />
        
        <DashboardCards />

        {profile && <ProfileSummary profile={profile} />}
      </div>
    </div>
  );
};

export default Dashboard;
