
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;

    if (!file || !file.name) {
      return new Response(JSON.stringify({ error: 'Missing file' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing file:', file.name, 'Size:', file.size);

    const buffer = await file.arrayBuffer();
    let resumeText = '';

    if (file.name.toLowerCase().endsWith('.pdf')) {
      console.log('Processing PDF file...');
      try {
        // Use pdf-parse for better PDF text extraction
        const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
        const pdfData = await pdfParse.default(buffer);
        resumeText = pdfData.text || '';
        console.log('PDF text extracted, length:', resumeText.length);
        console.log('PDF text preview:', resumeText.substring(0, 500));
      } catch (pdfError) {
        console.error('PDF parsing failed:', pdfError);
        // Fallback to basic text extraction
        try {
          const uint8Array = new Uint8Array(buffer);
          const decoder = new TextDecoder('utf-8', { fatal: false });
          const rawContent = decoder.decode(uint8Array);
          
          // Extract text between stream markers
          const textMatches = rawContent.match(/\((.*?)\)/g);
          if (textMatches) {
            resumeText = textMatches
              .map(match => match.replace(/[()]/g, '').trim())
              .filter(text => text.length > 1 && /[a-zA-Z]/.test(text))
              .join(' ');
          }
          
          if (!resumeText) {
            // Try to extract any readable text patterns
            const readableMatches = rawContent.match(/[A-Za-z]{3,}[A-Za-z0-9\s@._-]*/g);
            if (readableMatches) {
              resumeText = readableMatches
                .filter(text => text.length > 2)
                .join(' ');
            }
          }
        } catch (fallbackError) {
          console.error('Fallback extraction failed:', fallbackError);
          return new Response(JSON.stringify({ 
            error: 'Unable to extract text from PDF. Please ensure the PDF contains selectable text or try converting to DOCX format.',
            details: pdfError.message
          }), { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
    } else if (file.name.toLowerCase().endsWith('.docx')) {
      console.log('Processing DOCX file...');
      try {
        const mammoth = await import('https://esm.sh/mammoth@1.8.0');
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        resumeText = result.value || '';
        console.log('DOCX text extracted, length:', resumeText.length);
      } catch (docxError) {
        console.error('DOCX parsing failed:', docxError);
        return new Response(JSON.stringify({ 
          error: 'Unable to extract text from DOCX file. Please ensure the file is not corrupted.',
          details: docxError.message
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported file type. Please upload PDF or DOCX files only.' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Clean up the extracted text
    resumeText = resumeText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s@._\-()]/g, ' ')
      .trim();

    console.log('Final extracted text length:', resumeText.length);
    console.log('Final text preview:', resumeText.substring(0, 300));

    if (resumeText.length < 100) {
      return new Response(JSON.stringify({ 
        error: 'Unable to extract sufficient readable text from the file. The document may be empty, corrupted, or contain only images. Please ensure your document contains readable text.',
        extractedLength: resumeText.length,
        extractedPreview: resumeText.substring(0, 200)
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call DeepSeek API with detailed prompt for ATS analysis
    console.log('Calling DeepSeek API for ATS analysis...');
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the provided resume text and return ONLY a valid JSON object with the following structure:

{
  "Header": [score 1-10],
  "Body Content": [score 1-10], 
  "Formatting": [score 1-10],
  "Contact Info": [score 1-10],
  "Structure": [score 1-10],
  "Final Score": [average score 1-10],
  "What You Did Well": [
    "specific positive point 1",
    "specific positive point 2"
  ],
  "What Needs Improvement": [
    "specific improvement suggestion 1", 
    "specific improvement suggestion 2"
  ]
}

Scoring criteria:
- Header: Professional title, clear positioning, relevant keywords
- Body Content: Relevant experience, achievements with metrics, skill descriptions
- Formatting: Consistency, readability, ATS-friendly structure
- Contact Info: Complete contact details, professional email, LinkedIn
- Structure: Logical flow, appropriate sections, easy to scan

Provide specific, actionable feedback based on the actual resume content. Return ONLY the JSON object, no markdown formatting or additional text.`
          },
          {
            role: 'user',
            content: `Please analyze this resume for ATS compatibility:\n\n${resumeText.slice(0, 8000)}`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: `DeepSeek API error: ${response.status}`,
        details: errorText
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    let rawResponse = data.choices[0].message.content.trim();

    console.log('DeepSeek raw response:', rawResponse);

    // Clean up markdown code blocks if present
    if (rawResponse.startsWith('```json') && rawResponse.endsWith('```')) {
      rawResponse = rawResponse.slice(7, -3).trim();
    } else if (rawResponse.startsWith('```') && rawResponse.endsWith('```')) {
      rawResponse = rawResponse.slice(3, -3).trim();
    }

    // Parse JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawResponse);
      console.log('Successfully parsed ATS results:', parsedResult);
    } catch (parseError) {
      console.error('Failed to parse DeepSeek response:', rawResponse);
      return new Response(JSON.stringify({
        error: 'AI returned malformed response',
        rawResponse: rawResponse.substring(0, 500),
        parseError: parseError.message
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate the response structure
    const requiredFields = ['Header', 'Body Content', 'Formatting', 'Contact Info', 'Structure', 'Final Score', 'What You Did Well', 'What Needs Improvement'];
    const missingFields = requiredFields.filter(field => !(field in parsedResult));
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return new Response(JSON.stringify({
        error: 'Incomplete analysis response',
        missingFields,
        receivedData: parsedResult
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      result: JSON.stringify(parsedResult),
      textLength: resumeText.length 
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('ATS scan error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to scan resume', 
      details: error.message,
      stack: error.stack
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
