
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
        resumeText = await extractTextFromPDF(buffer);
      } catch (pdfError) {
        console.error('PDF parsing failed:', pdfError);
        return new Response(JSON.stringify({ 
          error: 'Unable to extract text from PDF. Please try converting your PDF to a Word document (.docx) or ensure it contains selectable text (not scanned images).',
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
        raw: raw.substring(0, 500) // Limit error output
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

// Simple PDF text extraction that works in Deno
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  let text = '';
  
  try {
    // Convert to string and look for text patterns
    const decoder = new TextDecoder('latin1', { fatal: false });
    const content = decoder.decode(uint8Array);
    
    // Extract text from PDF streams and objects
    const textPatterns = [
      // Text in parentheses (common in PDF)
      /\(([^)]{3,200})\)/g,
      // Text in brackets
      /\[([^\]]{3,200})\]/g,
      // BT...ET text objects
      /BT\s*((?:[^E]|E(?!T))*?)\s*ET/gs,
    ];
    
    for (const pattern of textPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          let cleanText = match
            .replace(/[()[\]]/g, '') // Remove brackets/parentheses
            .replace(/BT|ET/g, '') // Remove BT/ET markers
            .replace(/Tj|TJ/g, '') // Remove text operators
            .replace(/[^\w\s@.\-+()]/g, ' ') // Clean special chars
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          // Only add if it looks like real text (has letters and reasonable length)
          if (cleanText.length > 2 && /[a-zA-Z]{2,}/.test(cleanText)) {
            text += cleanText + ' ';
          }
        }
      }
    }
    
    // Look for email addresses specifically
    const emailMatches = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches) {
      text += emailMatches.join(' ') + ' ';
    }
    
    // Look for phone numbers
    const phoneMatches = content.match(/[\+]?[1-9]?[\-\s]?\(?[0-9]{3}\)?[\-\s]?[0-9]{3}[\-\s]?[0-9]{4}/g);
    if (phoneMatches) {
      text += phoneMatches.join(' ') + ' ';
    }
    
    text = text.trim();
    
    if (text.length < 50) {
      throw new Error('Could not extract sufficient readable text from PDF. This might be a scanned document or have text encoding issues.');
    }
    
    return text;
    
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}
