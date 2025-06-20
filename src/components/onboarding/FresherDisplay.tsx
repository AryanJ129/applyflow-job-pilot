
import React from 'react';
import { GraduationCap } from 'lucide-react';

const FresherDisplay = () => {
  return (
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
  );
};

export default FresherDisplay;
