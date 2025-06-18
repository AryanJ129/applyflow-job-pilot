
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

interface BasicInfo {
  fullName: string;
  jobTitle: string;
  summary: string;
}

interface BasicInfoStepProps {
  data: BasicInfo;
  onUpdate: (data: BasicInfo) => void;
}

const BasicInfoStep = ({ data, onUpdate }: BasicInfoStepProps) => {
  const handleChange = (field: keyof BasicInfo, value: string) => {
    onUpdate({
      ...data,
      [field]: value
    });
  };

  const generateAISummary = () => {
    // Placeholder for AI generation
    const sampleSummary = `Experienced ${data.jobTitle || 'professional'} with a proven track record of delivering high-quality results. Passionate about leveraging technology to solve complex problems and drive business growth. Strong communication skills and ability to work effectively in team environments.`;
    
    handleChange('summary', sampleSummary);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Let's start with your basic information
        </h2>
        <p className="text-muted-foreground">
          Tell us about yourself to get started
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-foreground font-medium">
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="e.g., John Doe"
            value={data.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(222.2_84%_4.9%)] dark:text-white border-border"
          />
        </div>

        <div>
          <Label htmlFor="jobTitle" className="text-foreground font-medium">
            Job Title
          </Label>
          <Input
            id="jobTitle"
            type="text"
            placeholder="e.g., Software Engineer"
            value={data.jobTitle}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(222.2_84%_4.9%)] dark:text-white border-border"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="summary" className="text-foreground font-medium">
              Professional Summary
            </Label>
            <Button
              type="button"
              onClick={generateAISummary}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Generate with AI
            </Button>
          </div>
          <Textarea
            id="summary"
            placeholder="Write a brief summary of your professional background and key achievements..."
            value={data.summary}
            onChange={(e) => handleChange('summary', e.target.value)}
            rows={4}
            className="bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(222.2_84%_4.9%)] dark:text-white border-border"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
