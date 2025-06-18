
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GraduationCap } from 'lucide-react';

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
  isFresher: boolean;
  onFresherChange: (isFresher: boolean) => void;
}

const WorkExperienceStep = ({ data, onUpdate, isFresher, onFresherChange }: WorkExperienceStepProps) => {
  const addWorkExperience = () => {
    const newWork: WorkExperience = {
      jobTitle: '',
      company: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    onUpdate([...data, newWork]);
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

  const handleFresherToggle = () => {
    const newFresherStatus = !isFresher;
    onFresherChange(newFresherStatus);
    
    if (newFresherStatus) {
      // Clear work experience when marking as fresher
      onUpdate([]);
    } else if (data.length === 0) {
      // Add one empty work experience when not fresher
      addWorkExperience();
    }
  };

  // Initialize with one empty work experience if not fresher and no data
  React.useEffect(() => {
    if (!isFresher && data.length === 0) {
      addWorkExperience();
    }
  }, [isFresher]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Work Experience
        </h2>
        <p className="text-muted-foreground">
          Tell us about your professional background or let us know if you're just starting out
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <Button
          onClick={handleFresherToggle}
          variant={isFresher ? "default" : "outline"}
          className={`flex items-center gap-2 h-12 px-6 rounded-full transition-all duration-300 ${
            isFresher 
              ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 shadow-lg' 
              : 'border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          {isFresher ? "I'm just starting my career" : "I'm just starting my career"}
        </Button>
      </div>

      {!isFresher && (
        <div className="space-y-4">
          {data.map((work, index) => (
            <Card key={index} className="bg-white/50 dark:bg-[hsl(217.2_32.6%_17.5%)]/50 border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-foreground">
                    {work.jobTitle || `Experience ${index + 1}`}
                    {work.company && ` - ${work.company}`}
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
                <div>
                  <Label htmlFor={`jobTitle-${index}`} className="text-foreground font-medium">
                    Job Title *
                  </Label>
                  <Input
                    id={`jobTitle-${index}`}
                    type="text"
                    placeholder="e.g., Software Engineer"
                    value={work.jobTitle}
                    onChange={(e) => updateWorkExperience(index, 'jobTitle', e.target.value)}
                    className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor={`company-${index}`} className="text-foreground font-medium">
                    Company *
                  </Label>
                  <Input
                    id={`company-${index}`}
                    type="text"
                    placeholder="e.g., Google Inc."
                    value={work.company}
                    onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                    className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`startDate-${index}`} className="text-foreground font-medium">
                      Start Date *
                    </Label>
                    <Input
                      id={`startDate-${index}`}
                      type="month"
                      value={work.startDate}
                      onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                      className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`endDate-${index}`} className="text-foreground font-medium">
                      End Date
                    </Label>
                    <Input
                      id={`endDate-${index}`}
                      type="month"
                      value={work.endDate}
                      onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                      className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                      placeholder="Leave empty if current"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`description-${index}`} className="text-foreground font-medium">
                    Job Description *
                  </Label>
                  <Textarea
                    id={`description-${index}`}
                    placeholder="Describe your key responsibilities, achievements, and skills used in this role..."
                    value={work.description}
                    onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                    rows={4}
                    className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                    required
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
      )}

      {isFresher && (
        <div className="text-center py-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 max-w-md mx-auto">
            <GraduationCap className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Starting Your Career Journey
            </h3>
            <p className="text-blue-600 dark:text-blue-300 text-sm">
              That's perfectly fine! We'll help you highlight your education, skills, and potential to employers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkExperienceStep;
