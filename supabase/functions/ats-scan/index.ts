
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
      console.log('Processing PDF file with pdfjs...');
      try {
        resumeText = await extractTextFromPDFWithPdfjs(buffer);
      } catch (pdfError) {
        console.error('PDF parsing failed:', pdfError);
        return new Response(JSON.stringify({ 
          error: 'Unable to extract text from PDF. Please ensure the PDF contains selectable text and is not a scanned image, or try converting to DOCX format.',
          details: pdfError.message
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
    } else if (file.name.toLowerCase().endsWith('.docx')) {
      console.log('Processing DOCX file...');
      try {
        const mammoth = await import('https://esm.sh/mammoth@1.8.0');
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        resumeText = result.value || '';
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

    console.log('Extracted text length:', resumeText.length);
    console.log('Text preview:', resumeText.substring(0, 200));

    if (resumeText.length < 50) {
      return new Response(JSON.stringify({ 
        error: 'Unable to extract sufficient text from the file. The document may be empty, corrupted, or contain only images. Please ensure your document contains readable text.',
        extractedLength: resumeText.length
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call DeepSeek API
    console.log('Calling DeepSeek API...');
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
            content: `You are an ATS assistant. Given the resume text, return a JSON object with this structure:

{
  "Header": 7,
  "Body Content": 5,
  "Formatting": 8,
  "Contact Info": 9,
  "Structure": 6,
  "Final Score": 7,
  "What You Did Well": [
    "Clear contact information is present",
    "Professional formatting with consistent spacing"
  ],
  "What Needs Improvement": [
    "Missing keywords for target role",
    "Skills section could be more specific"
  ]
}

Only return this JSON object and nothing else.`
          },
          {
            role: 'user',
            content: resumeText.slice(0, 6000) // Limit text to avoid token limits
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      console.error('DeepSeek API error:', response.status, await response.text());
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices[0].message.content.trim();

    console.log('DeepSeek raw reply:', raw);

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse DeepSeek response:', raw);
      return new Response(JSON.stringify({
        error: 'AI returned malformed response',
        raw: raw.substring(0, 500)
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Parsed ATS results:', parsed);

    return new Response(JSON.stringify({ result: JSON.stringify(parsed) }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('ATS scan error:', err);
    return new Response(JSON.stringify({ 
      error: 'Failed to scan resume', 
      details: err.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Robust PDF text extraction using pdfjs-dist for Deno
async function extractTextFromPDFWithPdfjs(buffer: ArrayBuffer): Promise<string> {
  try {
    // Import pdfjs-dist for Deno
    const pdfjs = await import('https://esm.sh/pdfjs-dist@4.4.168');
    
    // Configure worker for Deno environment
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
    
    console.log('Loading PDF document...');
    const loadingTask = pdfjs.getDocument({ 
      data: new Uint8Array(buffer),
      // Disable worker for edge function compatibility
      disableWorker: true,
      isEvalSupported: false,
    });
    
    const pdf = await loadingTask.promise;
    console.log('PDF loaded, pages:', pdf.numPages);
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Processing page ${pageNum}...`);
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (pageText) {
        fullText += pageText + ' ';
      }
    }
    
    fullText = fullText.trim();
    
    if (fullText.length < 50) {
      throw new Error('PDF appears to contain no readable text. This may be a scanned document or image-based PDF.');
    }
    
    console.log('Successfully extracted text from PDF, length:', fullText.length);
    return fullText;
    
  } catch (error) {
    console.error('PDF.js extraction error:', error);
    
    // If pdfjs fails, try a simpler fallback approach
    console.log('Falling back to basic PDF parsing...');
    return await extractTextFromPDFSimple(buffer);
  }
}

// Fallback PDF text extraction
async function extractTextFromPDFSimple(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  let text = '';
  
  try {
    const decoder = new TextDecoder('latin1', { fatal: false });
    const content = decoder.decode(uint8Array);
    
    // Extract text using improved patterns
    const textPatterns = [
      // Text in parentheses
      /\(([^)]{2,100})\)/g,
      // Text objects with BT/ET markers
      /BT\s*((?:[^E]|E(?!T))*?)\s*ET/gs,
      // Direct text strings
      /\/F\d+\s+\d+\s+Tf\s*\(([^)]+)\)/g,
    ];
    
    for (const pattern of textPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          let cleanText = match
            .replace(/[()]/g, '')
            .replace(/BT|ET|Tj|TJ/g, '')
            .replace(/\/F\d+\s+\d+\s+Tf\s*/g, '')
            .replace(/[^\w\s@.\-+]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (cleanText.length > 2 && /[a-zA-Z]{2,}/.test(cleanText)) {
            text += cleanText + ' ';
          }
        }
      }
    }
    
    // Extract emails and phone numbers
    const emailMatches = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches) {
      text += emailMatches.join(' ') + ' ';
    }
    
    const phoneMatches = content.match(/[\+]?[1-9]?[\-\s]?\(?[0-9]{3}\)?[\-\s]?[0-9]{3}[\-\s]?[0-9]{4}/g);
    if (phoneMatches) {
      text += phoneMatches.join(' ') + ' ';
    }
    
    text = text.trim();
    
    if (text.length < 50) {
      throw new Error('Could not extract sufficient readable text from PDF using fallback method.');
    }
    
    return text;
    
  } catch (error) {
    console.error('Simple PDF extraction error:', error);
    throw new Error(`PDF parsing completely failed: ${error.message}`);
  }
}
