
import React from 'react';
import { Button } from '@/components/ui/button';

interface ChecklistSectionProps {
  selectedChecks: string[];
  onToggleCheck: (checkId: string) => void;
}

const ChecklistSection = ({ selectedChecks, onToggleCheck }: ChecklistSectionProps) => {
  const checklistItems = [
    { id: 'jobTitle', label: 'Job Title Match' },
    { id: 'keywords', label: 'Keyword Density' },
    { id: 'formatting', label: 'Formatting' },
    { id: 'contact', label: 'Contact Info' },
    { id: 'structure', label: 'Section Structure' }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[hsl(222.2_84%_4.9%)]">
        Select what to check:
      </h3>
      <div className="flex flex-wrap gap-3">
        {checklistItems.map((item) => (
          <Button
            key={item.id}
            variant={selectedChecks.includes(item.id) ? "default" : "outline"}
            onClick={() => onToggleCheck(item.id)}
            className={`rounded-full px-4 py-2 h-10 transition-all duration-200 ${
              selectedChecks.includes(item.id)
                ? 'bg-[#1f1f1f] text-white hover:bg-[#2a2a2a]'
                : 'border-gray-300 text-[hsl(222.2_84%_4.9%)] hover:bg-gray-50'
            }`}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ChecklistSection;
