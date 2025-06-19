
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface SkillsSectionProps {
  skills: string[];
  newSkill: string;
  onNewSkillChange: (value: string) => void;
  onAddSkill: () => void;
  onRemoveSkill: (skill: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({
  skills,
  newSkill,
  onNewSkillChange,
  onAddSkill,
  onRemoveSkill,
  onKeyPress,
}) => {
  return (
    <div className="rounded-xl border border-[#e6e6e6] bg-white/70 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-[hsl(222.2_84%_4.9%)] mb-4">
        Skills
      </h2>
      
      <div className="space-y-4">
        <div>
          <Label className="text-[hsl(222.2_84%_4.9%)] font-medium">
            Add a skill
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={newSkill}
              onChange={(e) => onNewSkillChange(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="e.g., React, Python, Communication..."
              className="flex-1"
            />
            <Button
              onClick={onAddSkill}
              disabled={!newSkill.trim() || skills.includes(newSkill.trim())}
              className="bg-[#1f1f1f] text-white hover:bg-[#2a2a2a]"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {skills.length > 0 && (
          <div>
            <Label className="text-[hsl(222.2_84%_4.9%)] font-medium mb-3 block">
              Your Skills
            </Label>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 text-sm"
                >
                  {skill}
                  <button
                    onClick={() => onRemoveSkill(skill)}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsSection;
