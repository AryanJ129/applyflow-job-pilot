
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CareerObjectivesSectionProps {
  summary: string;
  onSummaryChange: (value: string) => void;
}

const CareerObjectivesSection: React.FC<CareerObjectivesSectionProps> = ({
  summary,
  onSummaryChange,
}) => {
  return (
    <div className="rounded-xl border border-[#e6e6e6] bg-white/70 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-[hsl(222.2_84%_4.9%)] mb-4">
        Career Objectives
      </h2>
      
      <div>
        <Label htmlFor="summary" className="text-[hsl(222.2_84%_4.9%)] font-medium">
          Professional Summary *
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Tell us about your career goals and professional background
        </p>
        <Textarea
          id="summary"
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder="Describe your professional experience, career goals, and what you're looking for in your next role..."
          className="mt-1 min-h-[120px]"
        />
      </div>
    </div>
  );
};

export default CareerObjectivesSection;
