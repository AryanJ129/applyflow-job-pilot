
import React from 'react';

interface Profile {
  full_name: string;
  job_title: string;
  summary: string;
}

interface ProfileSummaryProps {
  profile: Profile;
}

const ProfileSummary: React.FC<ProfileSummaryProps> = ({ profile }) => {
  return (
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
  );
};

export default ProfileSummary;
