
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Save } from 'lucide-react';

interface ResumeData {
  basic_info: {
    fullName: string;
    jobTitle: string;
    summary: string;
  };
  work_experience: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationYear: string;
  }>;
  skills: string[];
}

interface ReviewStepProps {
  data: ResumeData;
  onSave: () => void;
  loading: boolean;
}

const ReviewStep = ({ data, onSave, loading }: ReviewStepProps) => {
  const generatePDF = () => {
    // Create a simple PDF generation - this is a basic implementation
    // In production, you'd want to use a library like jsPDF or react-to-pdf
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${data.basic_info.fullName} - Resume</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .name { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
            .title { font-size: 18px; color: #666; margin-bottom: 15px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
            .experience-item, .education-item { margin-bottom: 15px; }
            .job-title { font-weight: bold; }
            .company { color: #666; }
            .date { font-style: italic; color: #666; }
            .skills { display: flex; flex-wrap: wrap; gap: 8px; }
            .skill { background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 14px; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="name">${data.basic_info.fullName}</div>
            <div class="title">${data.basic_info.jobTitle}</div>
          </div>
          
          ${data.basic_info.summary ? `
            <div class="section">
              <div class="section-title">Professional Summary</div>
              <p>${data.basic_info.summary}</p>
            </div>
          ` : ''}
          
          ${data.work_experience.length > 0 ? `
            <div class="section">
              <div class="section-title">Work Experience</div>
              ${data.work_experience.map(exp => `
                <div class="experience-item">
                  <div class="job-title">${exp.jobTitle}</div>
                  <div class="company">${exp.company}</div>
                  <div class="date">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                  <div>${exp.description.replace(/\n/g, '<br>')}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${data.education.length > 0 ? `
            <div class="section">
              <div class="section-title">Education</div>
              ${data.education.map(edu => `
                <div class="education-item">
                  <div class="job-title">${edu.degree}</div>
                  <div class="company">${edu.institution}</div>
                  <div class="date">${edu.graduationYear}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${data.skills.length > 0 ? `
            <div class="section">
              <div class="section-title">Skills</div>
              <div class="skills">
                ${data.skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Review & Export
        </h2>
        <p className="text-muted-foreground">
          Review your resume and export it as PDF
        </p>
      </div>

      <div className="bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border border-border rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b border-border">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {data.basic_info.fullName || 'Your Name'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {data.basic_info.jobTitle || 'Your Job Title'}
          </p>
        </div>

        {/* Professional Summary */}
        {data.basic_info.summary && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-3 border-b border-border pb-1">
              Professional Summary
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {data.basic_info.summary}
            </p>
          </div>
        )}

        {/* Work Experience */}
        {data.work_experience.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-1">
              Work Experience
            </h3>
            <div className="space-y-6">
              {data.work_experience.map((exp, index) => (
                <div key={index} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                  <h4 className="font-semibold text-foreground">{exp.jobTitle}</h4>
                  <p className="text-muted-foreground">{exp.company}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </p>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-1">
              Education
            </h3>
            <div className="space-y-4">
              {data.education.map((edu, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-foreground">{edu.degree}</h4>
                  <p className="text-muted-foreground">{edu.institution}</p>
                  <p className="text-sm text-muted-foreground">{edu.graduationYear}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-1">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={onSave}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 rounded-full h-12"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Draft'}
        </Button>
        
        <Button
          onClick={generatePDF}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 rounded-full h-12"
        >
          <Download className="w-4 h-4 mr-2" />
          Generate PDF
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
