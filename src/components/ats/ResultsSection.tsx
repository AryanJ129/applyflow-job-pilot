
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';
import CircularProgress from '@/components/ats/CircularProgress';

interface ResultsSectionProps {
  results: {
    scores: {
      header: number;
      body: number;
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
    body: 'Body',
    formatting: 'Formatting', 
    contact: 'Contact',
    structure: 'Structure'
  };

  return (
    <div className={`transition-all duration-700 transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    }`}>
      <Card className="p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-[hsl(222.2_84%_4.9%)] mb-8 text-center">
          ATS Analysis Results
        </h2>

        {/* Category Scores */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          {Object.entries(results.scores).map(([key, score]) => (
            <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-[hsl(222.2_84%_4.9%)] mb-1">
                {score}/10
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                {categoryLabels[key as keyof typeof categoryLabels]}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* What Went Well */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-green-700 flex items-center">
              <CheckCircle className="h-6 w-6 mr-2" />
              What You Did Well
            </h3>
            <div className="bg-green-50 rounded-lg p-4">
              <ul className="space-y-2">
                {results.whatWentWell.map((item, index) => (
                  <li key={index} className="text-green-700 text-sm flex items-start">
                    <span className="text-green-500 mr-2 font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Final Score */}
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-xl font-semibold text-[hsl(222.2_84%_4.9%)] mb-6">
              Overall ATS Score
            </h3>
            <CircularProgress score={results.finalScore} size={140} />
          </div>

          {/* What Needs Improvement */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-red-700 flex items-center">
              <AlertCircle className="h-6 w-6 mr-2" />
              What Needs Improvement
            </h3>
            <div className="bg-red-50 rounded-lg p-4">
              <ul className="space-y-2">
                {results.improvements.map((item, index) => (
                  <li key={index} className="text-red-700 text-sm flex items-start">
                    <span className="text-red-500 mr-2 font-bold">⚠</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResultsSection;
