
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import FileUploadCard from '@/components/ats/FileUploadCard';
import ResultsSection from '@/components/ats/ResultsSection';
import BackButton from '@/components/auth/BackButton';
import * as mammoth from 'mammoth';

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
          error: error.substring(0, 1000)
        });
    } catch (logErr) {
      console.error('Failed to log error to database:', logErr);
    }
  };

  const saveDebugData = async (name: string, parsedData: string, sentData: string, receivedData: any) => {
    try {
      await supabase
        .from('ats_test')
        .insert({
          name,
          parsed_data: parsedData,
          sent_data: sentData,
          received_data: receivedData
        });
      console.log('Debug data saved successfully');
    } catch (err) {
      console.error('Failed to save debug data:', err);
    }
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    try {
      console.log('Processing DOCX file...');
      const arrayBuffer = await file.arrayBuffer();
      
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = result.value;
      
      console.log(`Extracted ${extractedText.length} characters from DOCX`);
      console.log('DOCX text preview:', extractedText.substring(0, 300));
      
      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error(`Could not extract sufficient text from DOCX. Extracted length: ${extractedText?.length || 0}`);
      }
      
      return extractedText.trim();
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (fileExtension === 'pdf') {
      // Use existing PDF parser edge function
      const formData = new FormData();
      formData.append('file', file);

      const { data: pdfData, error: pdfError } = await supabase.functions.invoke('pdf-parser', {
        body: formData,
      });

      if (pdfError) {
        await logError('PDF Parser Function Error', `${pdfError.message || 'Unknown error'}\nDetails: ${JSON.stringify(pdfError)}`);
        throw pdfError;
      }

      if (pdfData.error) {
        await logError('PDF Parsing Error', pdfData.error);
        throw new Error(pdfData.error);
      }

      return pdfData.text;
    } else if (fileExtension === 'docx') {
      // Extract text directly from DOCX using mammoth
      return await extractTextFromDocx(file);
    } else {
      throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
    }
  };

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

  const handleScan = async () => {
    if (!uploadedFile) return;
    
    setIsScanning(true);
    
    try {
      console.log('Starting ATS analysis...');
      
      // Extract text based on file type
      const extractedText = await extractTextFromFile(uploadedFile);
      
      console.log(`Successfully extracted ${extractedText.length} characters from file`);
      console.log('First 500 characters:', extractedText.substring(0, 500));
      
      if (!extractedText || extractedText.length < 50) {
        const errorMsg = `Could not extract sufficient text from file. Extracted length: ${extractedText?.length || 0}`;
        await logError('File Text Extraction Error', errorMsg);
        
        toast({
          title: "File Processing Failed",
          description: "We couldn't extract enough readable text from this file. Please try a different format or ensure your document contains selectable text.",
          variant: "destructive",
        });
        setIsScanning(false);
        return;
      }

      // Prepare data for DeepSeek
      const resumeText = extractedText.trim();
      console.log('Sending to DeepSeek for analysis...');
      
      // Call the ATS analysis function
      const { data, error } = await supabase.functions.invoke('ats-scan', {
        body: { resumeText },
      });

      // Save debug data
      await saveDebugData(
        uploadedFile.name,
        extractedText,
        resumeText,
        data || { error: error?.message }
      );

      if (error) {
        await logError('Supabase Function Error', `${error.message || 'Unknown error'}\nDetails: ${JSON.stringify(error)}`);
        throw error;
      }

      if (data.error) {
        await logError('Analysis Response Error', data.error);
        toast({
          title: "ATS Scan Failed",
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

      console.log('Analysis successful:', data);

      // Transform the data to match the ResultsSection component
      const transformedResults = {
        scores: {
          header: data.header || 0,
          body: data.body || 0,
          formatting: data.formatting || 0,
          contact: data.contact || 0,
          structure: data.structure || 0
        },
        whatWentWell: Array.isArray(data.good) ? data.good : [],
        improvements: Array.isArray(data.bad) ? data.bad : [],
        finalScore: data.final || 0
      };

      setResults(transformedResults);
      setShowResults(true);
      
      toast({
        title: "ATS Analysis Complete",
        description: "Your resume has been analyzed successfully!",
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      
      const errorMessage = error.message || 'Unknown error occurred';
      await logError('ATS Scan Error', `${errorMessage}\nStack: ${error.stack || 'No stack trace'}`);
      
      toast({
        title: "ATS Scan Failed",
        description: "ATS scan failed. Please try again later.",
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
                Running ATS Scan...
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
