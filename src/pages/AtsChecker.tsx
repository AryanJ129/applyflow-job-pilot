
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RotateCcw } from 'lucide-react';
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

  const handleFileUpload = (file: File) => {
    // Validate file type
    const allowedExtensions = ['pdf', 'docx'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a PDF or DOCX file only.",
        variant: "destructive",
      });
      return;
    }
    
    setUploadedFile(file);
    setShowResults(false);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setShowResults(false);
    setResults(null);
    setIsScanning(false);
    toast({
      title: "Reset Complete",
      description: "Ready for a new file upload.",
    });
  };

  const handleScan = async () => {
    if (!uploadedFile) return;
    
    setIsScanning(true);
    setResults(null);
    
    try {
      console.log('🚀 Starting ATS scan for:', uploadedFile.name);
      
      const formData = new FormData();
      formData.append('resume', uploadedFile);

      const { data, error } = await supabase.functions.invoke('ats', {
        body: formData,
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(error.message || 'Failed to process file');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('✅ Raw result from API:', data.result);

      // The result should now be a parsed object, not a JSON string
      let parsed = data.result;
      
      // If it's still a string, parse it (backward compatibility)
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch (parseError) {
          console.error('❌ Failed to parse result:', data.result);
          throw new Error('Invalid response format from analysis service');
        }
      }

      console.log('✅ Parsed ATS results:', parsed);

      // Transform the data to match the ResultsSection component format
      const transformedResults = {
        scores: {
          header: parsed.Header || parsed.header || 0,
          body: parsed["Body Content"] || parsed.body || 0,
          formatting: parsed.Formatting || parsed.formatting || 0,
          contact: parsed["Contact Info"] || parsed.contact || 0,
          structure: parsed.Structure || parsed.structure || 0
        },
        whatWentWell: parsed["What You Did Well"] || parsed.good || [],
        improvements: parsed["What Needs Improvement"] || parsed.bad || [],
        finalScore: parsed["Final Score"] || parsed.final || 0
      };

      console.log('✅ Transformed results:', transformedResults);

      setResults(transformedResults);
      setShowResults(true);
      
      toast({
        title: "ATS Analysis Complete",
        description: "Your resume has been analyzed successfully!",
      });
      
    } catch (error) {
      console.error('❌ ATS scan error:', error);
      
      toast({
        title: "ATS Scan Failed",
        description: error.message || 'Something went wrong during the scan',
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      <BackButton />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[hsl(222.2_84%_4.9%)] mb-4">
            AI-Powered ATS Checker
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upload your resume and get instant AI feedback on how ATS-friendly it is. 
            Get detailed scoring and actionable improvement suggestions.
          </p>
        </div>

        {/* Upload Card */}
        <div className="mb-8">
          <FileUploadCard 
            onFileUpload={handleFileUpload}
            uploadedFile={uploadedFile}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-12">
          <Button
            onClick={handleScan}
            disabled={!uploadedFile || isScanning}
            className="bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] rounded-full px-8 py-3 h-12 text-lg font-semibold min-w-48 transition-all duration-200 hover:scale-105"
          >
            {isScanning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Running ATS Scan...
              </>
            ) : (
              'Run ATS Scan'
            )}
          </Button>

          {(uploadedFile || showResults) && (
            <Button
              onClick={handleReset}
              disabled={isScanning}
              variant="outline"
              className="rounded-full px-6 py-3 h-12 text-lg font-semibold transition-all duration-200 hover:scale-105"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </Button>
          )}
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
