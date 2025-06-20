
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import WorkExperienceForm from './WorkExperienceForm';
import FresherToggle from './FresherToggle';
import FresherDisplay from './FresherDisplay';

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

      <FresherToggle isFresher={isFresher} onToggle={handleFresherToggle} />

      {!isFresher && (
        <div className="space-y-4">
          {data.map((work, index) => (
            <WorkExperienceForm
              key={index}
              work={work}
              index={index}
              canRemove={data.length > 1}
              onUpdate={(field, value) => updateWorkExperience(index, field, value)}
              onRemove={() => removeWorkExperience(index)}
            />
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

      {isFresher && <FresherDisplay />}
    </div>
  );
};

export default WorkExperienceStep;
