
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';
import CircularProgress from '@/components/ats/CircularProgress';

interface ResultsSectionProps {
  results: {
    scores: {
      header: number;
      bodyContent: number;
      formatting: number;
      contact: number;
      structure: number;
    };
    whatWentWell: string[];
    improvements: string[];
    finalScore: number;
  };
}

const ResultsSection = ({ results }: ResultsSectionProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const categoryLabels = {
    header: 'Header',
    bodyContent: 'Content',
    formatting: 'Formatting', 
    contact: 'Contact Info',
    structure: 'Work Experience'
  };

  return (
    <div className={`transition-all duration-700 transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    }`}>
      <Card className="p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-[hsl(222.2_84%_4.9%)] mb-8 text-center">
          ATS Analysis Results
        </h2>

        {/* Category Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          {Object.entries(results.scores).map(([key, score]) => (
            <div key={key} className="text-center">
              <div className="text-2xl font-bold text-[hsl(222.2_84%_4.9%)] mb-1">
                {score}/10
              </div>
              <div className="text-sm text-muted-foreground">
                {categoryLabels[key as keyof typeof categoryLabels]}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* What Went Well */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-700 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              What You Did Well
            </h3>
            <ul className="space-y-2">
              {results.whatWentWell.map((item, index) => (
                <li key={index} className="text-green-600 text-sm flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Final Score */}
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-[hsl(222.2_84%_4.9%)] mb-4">
              Final Score
            </h3>
            <CircularProgress score={results.finalScore} />
          </div>

          {/* What Needs Improvement */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-700 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              What Needs Improvement
            </h3>
            <ul className="space-y-2">
              {results.improvements.map((item, index) => (
                <li key={index} className="text-red-600 text-sm flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResultsSection;
