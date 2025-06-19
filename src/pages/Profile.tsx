
import React from 'react';
import { Button } from '@/components/ui/button';
import { useProfileData } from '@/hooks/useProfileData';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PersonalInfoSection from '@/components/profile/PersonalInfoSection';
import CareerObjectivesSection from '@/components/profile/CareerObjectivesSection';
import EducationSection from '@/components/profile/EducationSection';
import SkillsSection from '@/components/profile/SkillsSection';
import AccountSecuritySection from '@/components/profile/AccountSecuritySection';

const Profile = () => {
  const {
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
  } = useProfileData();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1f1f1f] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <ProfileHeader />

        <PersonalInfoSection
          fullName={profile.full_name}
          jobTitle={profile.job_title}
          email={userInfo?.email || ''}
          onFullNameChange={(value) => updateProfile('full_name', value)}
          onJobTitleChange={(value) => updateProfile('job_title', value)}
        />

        <CareerObjectivesSection
          summary={profile.summary}
          onSummaryChange={(value) => updateProfile('summary', value)}
        />

        <EducationSection
          education={profile.education}
          onAddEducation={addEducation}
          onUpdateEducation={updateEducation}
          onRemoveEducation={removeEducation}
        />

        <SkillsSection
          skills={profile.skills}
          newSkill={newSkill}
          onNewSkillChange={setNewSkill}
          onAddSkill={addSkill}
          onRemoveSkill={removeSkill}
          onKeyPress={handleKeyPress}
        />

        <AccountSecuritySection
          email={userInfo?.email || ''}
          onLogout={handleLogout}
        />

        {/* Save Button */}
        <div className="flex justify-center">
          <Button
            onClick={saveProfile}
            disabled={saving}
            className="bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] rounded-full px-8 py-3 font-semibold w-full sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
