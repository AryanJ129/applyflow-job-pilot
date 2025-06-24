import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import FileUploadCard from '@/components/ats/FileUploadCard';
import ResultsSection from '@/components/ats/ResultsSection';
import BackButton from '@/components/auth/BackButton';

const AtsChecker = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // Mock data for results
  const mockResults = {
    scores: {
      header: 7,
      bodyContent: 5,
      formatting: 8,
      contact: 9,
      structure: 6
    },
    whatWentWell: [
      "Clear contact information is present",
      "Professional formatting with consistent spacing",
      "Good use of bullet points for readability",
      "Proper section headers and structure"
    ],
    improvements: [
      "Missing relevant keywords for target role",
      "Work experience descriptions could be more quantified",
      "Skills section needs better organization",
      "Consider adding more industry-specific terminology"
    ],
    finalScore: 7.0
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setShowResults(false);
  };

  const handleScan = async () => {
    if (!uploadedFile) return;
    
    setIsScanning(true);
    
    // Simulate API call
    setTimeout(() => {
      setResults(mockResults);
      setShowResults(true);
      setIsScanning(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white relative">
      <BackButton />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[hsl(222.2_84%_4.9%)] mb-4">
            ATS Checker
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upload your resume and get instant feedback on how ATS-friendly it is.
          </p>
        </div>

        {/* Upload Card */}
        <div className="mb-8">
          <FileUploadCard 
            onFileUpload={handleFileUpload}
            uploadedFile={uploadedFile}
          />
        </div>

        {/* Scan Button */}
        <div className="text-center mb-12">
          <Button
            onClick={handleScan}
            disabled={!uploadedFile || isScanning}
            className="bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] rounded-full px-8 py-3 h-12 text-lg font-semibold min-w-48 transition-all duration-200 hover:scale-105"
          >
            {isScanning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Scanning...
              </>
            ) : (
              'Run ATS Scan'
            )}
          </Button>
        </div>

        {/* Results Section */}
        {showResults && results && (
          <ResultsSection results={results} />
        )}
      </div>
    </div>
  );
};

export default AtsChecker;
