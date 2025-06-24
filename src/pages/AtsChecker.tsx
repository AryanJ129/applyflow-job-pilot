
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import FileUploadCard from '@/components/ats/FileUploadCard';
import ResultsSection from '@/components/ats/ResultsSection';
import BackButton from '@/components/auth/BackButton';
import { extractTextFromPDF } from '@/utils/pdfParser';

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

  const logError = async (name: string, error: string) => {
    try {
      await supabase
        .from('error_logs')
        .insert({
          name,
          error: error.substring(0, 1000) // Limit error message length
        });
    } catch (logErr) {
      console.error('Failed to log error to database:', logErr);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setShowResults(false);
  };

  const handleScan = async () => {
    if (!uploadedFile) return;
    
    setIsScanning(true);
    
    try {
      // Extract text from PDF
      console.log('Extracting text from PDF...');
      const resumeText = await extractTextFromPDF(uploadedFile);
      
      if (!resumeText || resumeText.length < 50) {
        const errorMsg = `Could not extract sufficient text from PDF. Extracted length: ${resumeText?.length || 0}`;
        await logError('PDF Text Extraction Error', errorMsg);
        
        toast({
          title: "Error",
          description: "Could not extract text from the PDF. Please ensure it's a valid resume with readable content.",
          variant: "destructive",
        });
        setIsScanning(false);
        return;
      }

      console.log(`Extracted ${resumeText.length} characters from PDF`);
      console.log('Sending to DeepSeek for analysis...');
      
      // Call the edge function for analysis
      const { data, error } = await supabase.functions.invoke('ats-scan', {
        body: { resumeText },
      });

      if (error) {
        await logError('Supabase Function Error', `${error.message || 'Unknown error'}\nDetails: ${JSON.stringify(error)}`);
        throw error;
      }

      if (data.error) {
        await logError('Analysis Response Error', data.error);
        toast({
          title: "Invalid Document",
          description: data.error,
          variant: "destructive",
        });
        setIsScanning(false);
        return;
      }

      // Validate response data
      if (!data || typeof data !== 'object') {
        await logError('Invalid Response Data', `Response is not an object: ${JSON.stringify(data)}`);
        throw new Error('Invalid response data structure');
      }

      // Transform the data to match the existing UI structure
      const transformedResults = {
        scores: {
          header: data.header || 0,
          bodyContent: data.content || 0,
          formatting: data.structure || 0,
          contact: data.header || 0, // Using header score for contact
          structure: data.workExperience || 0
        },
        whatWentWell: Array.isArray(data.whatWentWell) ? data.whatWentWell : [],
        improvements: Array.isArray(data.improvements) ? data.improvements : [],
        finalScore: data.finalScore || 0
      };

      setResults(transformedResults);
      setShowResults(true);
      
      toast({
        title: "Analysis Complete",
        description: "Your resume has been analyzed successfully!",
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      
      const errorMessage = error.message || 'Unknown error occurred';
      await logError('ATS Scan Error', `${errorMessage}\nStack: ${error.stack || 'No stack trace'}`);
      
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your resume. Please try again or contact support if the issue persists.",
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
            ATS Checker
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upload your resume and get instant AI-powered feedback on how ATS-friendly it is.
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
                Analyzing with AI...
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
