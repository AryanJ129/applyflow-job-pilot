
import React from 'react';
import { User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PersonalInfoSectionProps {
  fullName: string;
  jobTitle: string;
  email: string;
  onFullNameChange: (value: string) => void;
  onJobTitleChange: (value: string) => void;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  fullName,
  jobTitle,
  email,
  onFullNameChange,
  onJobTitleChange,
}) => {
  return (
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
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="email" className="text-[hsl(222.2_84%_4.9%)] font-medium">
            Email
          </Label>
          <Input
            id="email"
            value={email}
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
            value={jobTitle}
            onChange={(e) => onJobTitleChange(e.target.value)}
            placeholder="e.g., Software Engineer, Marketing Manager"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSection;
