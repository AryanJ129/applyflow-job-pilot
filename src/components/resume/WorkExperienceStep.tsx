
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, ChevronDown, Trash2, Sparkles } from 'lucide-react';

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
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const addExperience = () => {
    const newExperience: WorkExperience = {
      jobTitle: '',
      company: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    const newData = [...data, newExperience];
    onUpdate(newData);
    setOpenItems([...openItems, newData.length - 1]);
  };

  const updateExperience = (index: number, field: keyof WorkExperience, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onUpdate(newData);
  };

  const removeExperience = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onUpdate(newData);
    setOpenItems(openItems.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const generateAIDescription = (index: number) => {
    const experience = data[index];
    const sampleDescription = `• Led and managed ${experience.jobTitle || 'professional'} responsibilities at ${experience.company || 'the company'}\n• Collaborated with cross-functional teams to deliver high-quality solutions\n• Implemented best practices and improved operational efficiency\n• Mentored team members and contributed to positive team culture`;
    
    updateExperience(index, 'description', sampleDescription);
  };

  // Initialize with one empty experience if none exist
  if (data.length === 0) {
    React.useEffect(() => {
      addExperience();
    }, []);
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Work Experience
        </h2>
        <p className="text-muted-foreground">
          Add your professional experience and achievements
        </p>
      </div>

      <div className="space-y-4">
        {data.map((experience, index) => (
          <Card key={index} className="bg-white/50 dark:bg-[hsl(217.2_32.6%_17.5%)]/50 border-border">
            <Collapsible 
              open={openItems.includes(index)}
              onOpenChange={() => toggleItem(index)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-foreground">
                      {experience.jobTitle || `Experience ${index + 1}`}
                      {experience.company && ` at ${experience.company}`}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {data.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeExperience(index);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <ChevronDown className={`w-4 h-4 transition-transform ${openItems.includes(index) ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`jobTitle-${index}`} className="text-foreground font-medium">
                        Job Title
                      </Label>
                      <Input
                        id={`jobTitle-${index}`}
                        type="text"
                        placeholder="e.g., Senior Software Engineer"
                        value={experience.jobTitle}
                        onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
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
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
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
                        onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
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
                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                        className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                        placeholder="Leave blank if current"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor={`description-${index}`} className="text-foreground font-medium">
                        Description
                      </Label>
                      <Button
                        type="button"
                        onClick={() => generateAIDescription(index)}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        AI Assist
                      </Button>
                    </div>
                    <Textarea
                      id={`description-${index}`}
                      placeholder="Describe your responsibilities and achievements..."
                      value={experience.description}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      rows={4}
                      className="bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}

        <Button
          onClick={addExperience}
          variant="outline"
          className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:border-border"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>
    </div>
  );
};

export default WorkExperienceStep;
