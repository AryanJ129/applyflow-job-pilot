
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface WorkExperience {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface WorkExperienceStepProps {
  data: WorkExperience[];
  onUpdate: (data: WorkExperience[]) => void;
}

const WorkExperienceStep = ({ data, onUpdate }: WorkExperienceStepProps) => {
  // All hooks must be called at the top level - no conditional hooks
  const addWorkExperience = () => {
    const newExperience: WorkExperience = {
      jobTitle: '',
      company: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    onUpdate([...data, newExperience]);
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onUpdate(newData);
  };

  const removeWorkExperience = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onUpdate(newData);
  };

  // Initialize with one empty experience if none exist
  React.useEffect(() => {
    if (data.length === 0) {
      addWorkExperience();
    }
  }, [data.length]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Work Experience
        </h2>
        <p className="text-muted-foreground">
          Add your professional work experience and achievements
        </p>
      </div>

      <div className="space-y-4">
        {data.map((experience, index) => (
          <Card key={index} className="bg-white/50 dark:bg-[hsl(217.2_32.6%_17.5%)]/50 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-foreground">
                  {experience.jobTitle || `Experience ${index + 1}`}
                  {experience.company && ` - ${experience.company}`}
                </CardTitle>
                {data.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWorkExperience(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`jobTitle-${index}`} className="text-foreground font-medium">
                    Job Title
                  </Label>
                  <Input
                    id={`jobTitle-${index}`}
                    type="text"
                    placeholder="e.g., Software Engineer"
                    value={experience.jobTitle}
                    onChange={(e) => updateWorkExperience(index, 'jobTitle', e.target.value)}
                    className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`company-${index}`} className="text-foreground font-medium">
                    Company
                  </Label>
                  <Input
                    id={`company-${index}`}
                    type="text"
                    placeholder="e.g., Tech Corp"
                    value={experience.company}
                    onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                    className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`startDate-${index}`} className="text-foreground font-medium">
                    Start Date
                  </Label>
                  <Input
                    id={`startDate-${index}`}
                    type="month"
                    value={experience.startDate}
                    onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                    className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                  />
                </div>

                <div>
                  <Label htmlFor={`endDate-${index}`} className="text-foreground font-medium">
                    End Date
                  </Label>
                  <Input
                    id={`endDate-${index}`}
                    type="month"
                    value={experience.endDate}
                    onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                    placeholder="Leave empty if current job"
                    className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`description-${index}`} className="text-foreground font-medium">
                  Job Description
                </Label>
                <Textarea
                  id={`description-${index}`}
                  placeholder="Describe your responsibilities, achievements, and key projects..."
                  value={experience.description}
                  onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                  rows={4}
                  className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          onClick={addWorkExperience}
          variant="outline"
          className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:border-border"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Work Experience
        </Button>
      </div>
    </div>
  );
};

export default WorkExperienceStep;
