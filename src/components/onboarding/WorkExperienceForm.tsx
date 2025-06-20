
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import DateSelector from './DateSelector';

interface WorkExperience {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface WorkExperienceFormProps {
  work: WorkExperience;
  index: number;
  canRemove: boolean;
  onUpdate: (field: keyof WorkExperience, value: string) => void;
  onRemove: () => void;
}

const WorkExperienceForm = ({ 
  work, 
  index, 
  canRemove, 
  onUpdate, 
  onRemove 
}: WorkExperienceFormProps) => {
  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    const [year, month] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  };

  return (
    <Card className="bg-white/50 dark:bg-[hsl(217.2_32.6%_17.5%)]/50 border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground">
            {work.jobTitle || `Experience ${index + 1}`}
            {work.company && ` - ${work.company}`}
          </CardTitle>
          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
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
            onChange={(e) => onUpdate('jobTitle', e.target.value)}
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
            onChange={(e) => onUpdate('company', e.target.value)}
            className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateSelector
            id={`startDate-${index}`}
            label="Start Date"
            value={work.startDate}
            onChange={(value) => onUpdate('startDate', value)}
            placeholder="Pick start date"
            required
            maxDate={new Date()}
          />
          
          <DateSelector
            id={`endDate-${index}`}
            label="End Date"
            value={work.endDate}
            onChange={(value) => onUpdate('endDate', value)}
            placeholder="Leave empty if current"
            minDate={parseDate(work.startDate)}
            maxDate={new Date()}
          />
        </div>

        <div>
          <Label htmlFor={`description-${index}`} className="text-foreground font-medium">
            Job Description *
          </Label>
          <Textarea
            id={`description-${index}`}
            placeholder="Describe your key responsibilities, achievements, and skills used in this role..."
            value={work.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            rows={4}
            className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
            required
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkExperienceForm;
