
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
      console.log('Processing PDF file with improved extraction...');
      try {
        resumeText = await extractTextFromPDFImproved(buffer);
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
            content: `You are an ATS assistant. Given the resume text, return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, no additional text):

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

Return ONLY this JSON object and nothing else.`
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
    let raw = data.choices[0].message.content.trim();

    console.log('DeepSeek raw reply:', raw);

    // Clean up markdown code blocks if present
    if (raw.startsWith('```json') && raw.endsWith('```')) {
      raw = raw.slice(7, -3).trim();
    } else if (raw.startsWith('```') && raw.endsWith('```')) {
      raw = raw.slice(3, -3).trim();
    }

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

// Improved PDF text extraction using multiple strategies
async function extractTextFromPDFImproved(buffer: ArrayBuffer): Promise<string> {
  try {
    // Try method 1: Using pdf2json approach with better text extraction
    const uint8Array = new Uint8Array(buffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let content = decoder.decode(uint8Array);
    
    // Strategy 1: Extract text from PDF stream objects
    let extractedText = '';
    
    // Look for text streams with better patterns
    const streamPattern = /stream\s*\r?\n([\s\S]*?)\r?\nendstream/gi;
    const streamMatches = content.match(streamPattern);
    
    if (streamMatches) {
      for (const stream of streamMatches) {
        const streamContent = stream.replace(/^stream\s*\r?\n/, '').replace(/\r?\nendstream$/, '');
        
        // Extract readable text from streams
        const textPattern = /\((.*?)\)/g;
        const textMatches = streamContent.match(textPattern);
        
        if (textMatches) {
          for (const match of textMatches) {
            const cleanText = match
              .replace(/[()]/g, '')
              .replace(/\\[rnt]/g, ' ')
              .replace(/\\\\/g, '\\')
              .trim();
            
            if (cleanText.length > 1 && /[a-zA-Z]/.test(cleanText)) {
              extractedText += cleanText + ' ';
            }
          }
        }
      }
    }
    
    // Strategy 2: Look for text objects with BT/ET markers
    const textObjectPattern = /BT\s*(.*?)\s*ET/gs;
    const textObjects = content.match(textObjectPattern);
    
    if (textObjects) {
      for (const textObj of textObjects) {
        const lines = textObj.split(/\r?\n/);
        for (const line of lines) {
          const textMatch = line.match(/\((.*?)\)\s*Tj/);
          if (textMatch && textMatch[1]) {
            const cleanText = textMatch[1]
              .replace(/\\[rnt]/g, ' ')
              .replace(/\\\\/g, '\\')
              .trim();
            
            if (cleanText.length > 1) {
              extractedText += cleanText + ' ';
            }
          }
        }
      }
    }
    
    // Strategy 3: Extract any remaining readable text patterns
    const readablePattern = /[A-Za-z][A-Za-z0-9\s@._-]{2,}/g;
    const readableMatches = content.match(readablePattern);
    
    if (readableMatches) {
      for (const match of readableMatches) {
        const cleaned = match.trim();
        if (cleaned.length > 2 && !extractedText.includes(cleaned)) {
          extractedText += cleaned + ' ';
        }
      }
    }
    
    // Clean up the final text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s@._-]/g, ' ')
      .trim();
    
    console.log('Improved extraction result length:', extractedText.length);
    console.log('Improved extraction preview:', extractedText.substring(0, 300));
    
    if (extractedText.length < 50) {
      throw new Error('Could not extract sufficient readable text from PDF. The document may be scanned or contain non-text content.');
    }
    
    return extractedText;
    
  } catch (error) {
    console.error('Improved PDF extraction error:', error);
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}
