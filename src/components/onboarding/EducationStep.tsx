
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface Education {
  degree: string;
  institution: string;
  graduationYear: string;
}

interface EducationStepProps {
  data: Education[];
  onUpdate: (data: Education[]) => void;
}

const EducationStep = ({ data, onUpdate }: EducationStepProps) => {
  const addEducation = () => {
    const newEducation: Education = {
      degree: '',
      institution: '',
      graduationYear: ''
    };
    onUpdate([...data, newEducation]);
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onUpdate(newData);
  };

  const removeEducation = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onUpdate(newData);
  };

  // Initialize with one empty education if none exist
  React.useEffect(() => {
    if (data.length === 0) {
      addEducation();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Education Background
        </h2>
        <p className="text-muted-foreground">
          Share your educational qualifications and achievements
        </p>
      </div>

      <div className="space-y-4">
        {data.map((education, index) => (
          <Card key={index} className="bg-white/50 dark:bg-[hsl(217.2_32.6%_17.5%)]/50 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-foreground">
                  {education.degree || `Education ${index + 1}`}
                  {education.institution && ` - ${education.institution}`}
                </CardTitle>
                {data.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEducation(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor={`degree-${index}`} className="text-foreground font-medium">
                  Degree *
                </Label>
                <Input
                  id={`degree-${index}`}
                  type="text"
                  placeholder="e.g., Bachelor of Science in Computer Science"
                  value={education.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor={`institution-${index}`} className="text-foreground font-medium">
                  Institution *
                </Label>
                <Input
                  id={`institution-${index}`}
                  type="text"
                  placeholder="e.g., University of Technology"
                  value={education.institution}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                  required
                />
              </div>

              <div>
                <Label htmlFor={`graduationYear-${index}`} className="text-foreground font-medium">
                  Graduation Year *
                </Label>
                <Input
                  id={`graduationYear-${index}`}
                  type="number"
                  placeholder="e.g., 2023"
                  value={education.graduationYear}
                  onChange={(e) => updateEducation(index, 'graduationYear', e.target.value)}
                  className="mt-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
                  min="1950"
                  max="2030"
                  required
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          onClick={addEducation}
          variant="outline"
          className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:border-border"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </Button>
      </div>
    </div>
  );
};

export default EducationStep;
