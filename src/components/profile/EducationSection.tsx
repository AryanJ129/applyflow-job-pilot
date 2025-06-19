
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

interface Education {
  degree: string;
  institution: string;
  graduationYear: string;
}

interface EducationSectionProps {
  education: Education[];
  onAddEducation: () => void;
  onUpdateEducation: (index: number, field: string, value: string) => void;
  onRemoveEducation: (index: number) => void;
}

const EducationSection: React.FC<EducationSectionProps> = ({
  education,
  onAddEducation,
  onUpdateEducation,
  onRemoveEducation,
}) => {
  return (
    <div className="rounded-xl border border-[#e6e6e6] bg-white/70 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[hsl(222.2_84%_4.9%)]">
          Education History
        </h2>
        <Button
          onClick={onAddEducation}
          variant="outline"
          size="sm"
          className="text-[#1f1f1f] border-[#1f1f1f] hover:bg-[#1f1f1f] hover:text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Education
        </Button>
      </div>
      
      <div className="space-y-4">
        {education.map((edu, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium text-[hsl(222.2_84%_4.9%)]">
                Education {index + 1}
              </h3>
              <Button
                onClick={() => onRemoveEducation(index)}
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
                  onChange={(e) => onUpdateEducation(index, 'degree', e.target.value)}
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
                  onChange={(e) => onUpdateEducation(index, 'institution', e.target.value)}
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
                  onChange={(e) => onUpdateEducation(index, 'graduationYear', e.target.value)}
                  placeholder="e.g., 2023"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        ))}
        
        {education.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            No education entries yet. Click "Add Education" to get started.
          </p>
        )}
      </div>
    </div>
  );
};

export default EducationSection;
