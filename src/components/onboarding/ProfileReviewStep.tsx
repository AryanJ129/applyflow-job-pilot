import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface ProfileData {
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
interface ProfileReviewStepProps {
  data: ProfileData;
  onSave: () => void;
  loading: boolean;
}
const ProfileReviewStep = ({
  data,
  onSave,
  loading
}: ProfileReviewStepProps) => {
  const navigate = useNavigate();
  const handleSaveAndContinue = async () => {
    await onSave();
    navigate('/dashboard');
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };
  return <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Review Your Profile
        </h2>
        <p className="text-muted-foreground">
          Take a moment to review your information before completing your onboarding
        </p>
      </div>

      <div className="bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border border-border rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b border-border">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {data.basic_info.fullName || 'Your Name'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {data.basic_info.jobTitle || 'Your Desired Job Title'}
          </p>
        </div>

        {/* Professional Summary */}
        {data.basic_info.summary && <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-3 border-b border-border pb-1">
              About Me
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {data.basic_info.summary}
            </p>
          </div>}

        {/* Work Experience */}
        {!data.isFresher && data.work_experience.length > 0 && <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-1">
              Work Experience
            </h3>
            <div className="space-y-6">
              {data.work_experience.map((exp, index) => <div key={index} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                  <h4 className="font-semibold text-foreground">{exp.jobTitle}</h4>
                  <p className="text-muted-foreground">{exp.company}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </p>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {exp.description}
                  </p>
                </div>)}
            </div>
          </div>}

        {/* Fresher Status */}
        {data.isFresher && <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-1">
              Career Status
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                Starting Career Journey - Ready to begin professional experience
              </p>
            </div>
          </div>}

        {/* Education */}
        {data.education.length > 0 && <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-1">
              Education
            </h3>
            <div className="space-y-4">
              {data.education.map((edu, index) => <div key={index}>
                  <h4 className="font-semibold text-foreground">{edu.degree}</h4>
                  <p className="text-muted-foreground">{edu.institution}</p>
                  <p className="text-sm text-muted-foreground">{edu.graduationYear}</p>
                </div>)}
            </div>
          </div>}

        {/* Skills */}
        {data.skills.length > 0 && <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-1">
              Skills & Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, index) => <Badge key={index} variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {skill}
                </Badge>)}
            </div>
          </div>}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleSaveAndContinue}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 rounded-full px-8 h-12 text-lg"
        >
          {loading ? 'Saving Profile...' : 'Complete Setup'}
        </Button>
      </div>
    </div>;
};
export default ProfileReviewStep;
