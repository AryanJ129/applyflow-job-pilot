
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { User, Plus, X, LogOut } from 'lucide-react';

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

const Profile = () => {
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

      // Fetch user profile
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
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[hsl(222.2_84%_4.9%)] mb-2">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your personal information and career details
          </p>
        </div>

        {/* User Info Section */}
        <div className="rounded-xl border border-[#e6e6e6] bg-white/70 shadow-sm p-6">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-[#1f1f1f] mr-2" />
            <h2 className="text-lg font-semibold text-[hsl(222.2_84%_4.9%)]">
              Personal Information
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-[hsl(222.2_84%_4.9%)] font-medium">
                Full Name *
              </Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) => updateProfile('full_name', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-[hsl(222.2_84%_4.9%)] font-medium">
                Email
              </Label>
              <Input
                id="email"
                value={userInfo?.email || ''}
                disabled
                className="mt-1 bg-gray-50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed from this page
              </p>
            </div>
            
            <div>
              <Label htmlFor="jobTitle" className="text-[hsl(222.2_84%_4.9%)] font-medium">
                Job Title *
              </Label>
              <Input
                id="jobTitle"
                value={profile.job_title}
                onChange={(e) => updateProfile('job_title', e.target.value)}
                placeholder="e.g., Software Engineer, Marketing Manager"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Career Objectives Section */}
        <div className="rounded-xl border border-[#e6e6e6] bg-white/70 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[hsl(222.2_84%_4.9%)] mb-4">
            Career Objectives
          </h2>
          
          <div>
            <Label htmlFor="summary" className="text-[hsl(222.2_84%_4.9%)] font-medium">
              Professional Summary *
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Tell us about your career goals and professional background
            </p>
            <Textarea
              id="summary"
              value={profile.summary}
              onChange={(e) => updateProfile('summary', e.target.value)}
              placeholder="Describe your professional experience, career goals, and what you're looking for in your next role..."
              className="mt-1 min-h-[120px]"
            />
          </div>
        </div>

        {/* Education History Section */}
        <div className="rounded-xl border border-[#e6e6e6] bg-white/70 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[hsl(222.2_84%_4.9%)]">
              Education History
            </h2>
            <Button
              onClick={addEducation}
              variant="outline"
              size="sm"
              className="text-[#1f1f1f] border-[#1f1f1f] hover:bg-[#1f1f1f] hover:text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Education
            </Button>
          </div>
          
          <div className="space-y-4">
            {profile.education.map((edu, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-[hsl(222.2_84%_4.9%)]">
                    Education {index + 1}
                  </h3>
                  <Button
                    onClick={() => removeEducation(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[hsl(222.2_84%_4.9%)] font-medium">
                      Degree *
                    </Label>
                    <Input
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      placeholder="e.g., Bachelor of Science"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-[hsl(222.2_84%_4.9%)] font-medium">
                      Institution *
                    </Label>
                    <Input
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      placeholder="e.g., University of California"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-[hsl(222.2_84%_4.9%)] font-medium">
                      Graduation Year *
                    </Label>
                    <Input
                      value={edu.graduationYear}
                      onChange={(e) => updateEducation(index, 'graduationYear', e.target.value)}
                      placeholder="e.g., 2023"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {profile.education.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No education entries yet. Click "Add Education" to get started.
              </p>
            )}
          </div>
        </div>

        {/* Skills Section */}
        <div className="rounded-xl border border-[#e6e6e6] bg-white/70 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[hsl(222.2_84%_4.9%)] mb-4">
            Skills
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label className="text-[hsl(222.2_84%_4.9%)] font-medium">
                Add a skill
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., React, Python, Communication..."
                  className="flex-1"
                />
                <Button
                  onClick={addSkill}
                  disabled={!newSkill.trim() || profile.skills.includes(newSkill.trim())}
                  className="bg-[#1f1f1f] text-white hover:bg-[#2a2a2a]"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {profile.skills.length > 0 && (
              <div>
                <Label className="text-[hsl(222.2_84%_4.9%)] font-medium mb-3 block">
                  Your Skills
                </Label>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account & Security Section */}
        <div className="rounded-xl border border-[#e6e6e6] bg-white/70 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[hsl(222.2_84%_4.9%)] mb-4">
            Account & Security
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label className="text-[hsl(222.2_84%_4.9%)] font-medium">
                Email Address
              </Label>
              <Input
                value={userInfo?.email || ''}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>
            
            <div>
              <Label className="text-[hsl(222.2_84%_4.9%)] font-medium">
                Password
              </Label>
              <div className="mt-1">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    toast({
                      title: "Feature Coming Soon",
                      description: "Password change functionality will be available soon.",
                    });
                  }}
                >
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </div>

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

        {/* Logout Button */}
        <div className="pt-8 border-t border-[#e6e6e6]">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] rounded-full w-full py-3 font-semibold border-[#1f1f1f]"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
