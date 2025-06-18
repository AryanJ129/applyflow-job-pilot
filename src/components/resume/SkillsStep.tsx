
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface SkillsStepProps {
  data: string[];
  onUpdate: (data: string[]) => void;
}

const SkillsStep = ({ data, onUpdate }: SkillsStepProps) => {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill.trim() && !data.includes(newSkill.trim())) {
      onUpdate([...data, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onUpdate(data.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const suggestedSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'SQL',
    'HTML/CSS', 'Git', 'AWS', 'Docker', 'MongoDB', 'Express.js',
    'Communication', 'Leadership', 'Problem Solving', 'Team Collaboration'
  ];

  const availableSuggestions = suggestedSkills.filter(skill => !data.includes(skill));

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Skills & Expertise
        </h2>
        <p className="text-muted-foreground">
          Add your technical and soft skills to showcase your capabilities
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="newSkill" className="text-foreground font-medium">
            Add a skill
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="newSkill"
              type="text"
              placeholder="e.g., React, Python, Communication..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
            />
            <Button
              onClick={addSkill}
              disabled={!newSkill.trim() || data.includes(newSkill.trim())}
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 rounded-full px-6"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {data.length > 0 && (
          <div>
            <Label className="text-foreground font-medium mb-3 block">
              Your Skills
            </Label>
            <div className="flex flex-wrap gap-2">
              {data.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 px-3 py-1 text-sm"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-2 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {availableSuggestions.length > 0 && (
          <div>
            <Label className="text-foreground font-medium mb-3 block">
              Suggested Skills
            </Label>
            <div className="flex flex-wrap gap-2">
              {availableSuggestions.slice(0, 12).map((skill, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdate([...data, skill])}
                  className="text-muted-foreground hover:text-foreground border-dashed hover:border-solid"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {skill}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsStep;
