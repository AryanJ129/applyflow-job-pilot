
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    'JavaScript', 'Python', 'React', 'Node.js', 'HTML', 'CSS', 'SQL', 'Git',
    'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Project Management',
    'Data Analysis', 'Marketing', 'Design', 'Customer Service', 'Sales'
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
        {/* Add new skill */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a skill and press Enter"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border-border"
          />
          <Button
            onClick={addSkill}
            disabled={!newSkill.trim() || data.includes(newSkill.trim())}
            className="px-4"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Current skills */}
        {data.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Your Skills</h3>
            <div className="flex flex-wrap gap-2">
              {data.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 flex items-center gap-1"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-1 hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggested skills */}
        {availableSuggestions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Suggested Skills</h3>
            <div className="flex flex-wrap gap-2">
              {availableSuggestions.slice(0, 12).map((skill) => (
                <button
                  key={skill}
                  onClick={() => onUpdate([...data, skill])}
                  className="px-3 py-1 text-sm border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        )}

        {data.length === 0 && (
          <div className="text-center text-muted-foreground text-sm">
            Add at least one skill to continue
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsStep;
