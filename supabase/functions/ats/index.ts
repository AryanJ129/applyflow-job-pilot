
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract text from PDF using pdfjs-dist (Deno compatible)
async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    // Use pdfjs-dist via CDN for Deno compatibility
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@4.0.379/build/pdf.min.mjs');
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    throw new Error('Failed to extract text from PDF file');
  }
}

// Extract text from DOCX using mammoth (Deno compatible version)
async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  try {
    const mammoth = await import('https://esm.sh/mammoth@1.8.0');
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value || '';
  } catch (error) {
    console.error('DOCX text extraction failed:', error);
    throw new Error('Failed to extract text from DOCX file');
  }
}

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

    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
      return new Response(JSON.stringify({ error: 'Unsupported file type. Please upload PDF or DOCX files only.' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const buffer = await file.arrayBuffer();
    let extractedText: string;

    // Extract text based on file type
    if (fileName.endsWith('.pdf')) {
      console.log('Extracting text from PDF...');
      extractedText = await extractPdfText(buffer);
    } else {
      console.log('Extracting text from DOCX...');
      extractedText = await extractDocxText(buffer);
    }

    // Validate extracted text
    if (extractedText.length < 100) {
      return new Response(JSON.stringify({ 
        error: 'Unable to extract sufficient text from file. The document may be empty, corrupted, or contain only images.',
        extractedLength: extractedText.length
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Extracted text (first 500 chars): ${extractedText.slice(0, 500)}`);

    // Call OpenAI GPT-4
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: `You are an ATS (Applicant Tracking System) evaluator.

Given the resume content below, analyze and return this JSON structure only:

{
"Header": 0–10,
"Body Content": 0–10,
"Formatting": 0–10,
"Contact Info": 0–10,
"Structure": 0–10,
"Final Score": average of the above,
"What You Did Well": ["bullet", "bullet", ...],
"What Needs Improvement": ["bullet", "bullet", ...]
}

Only return this JSON object. No extra commentary or markdown.

Resume content:
${extractedText.slice(0, 8000)}`
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${openaiResponse.status}`,
        details: errorText
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await openaiResponse.json();
    let rawResponse = data.choices[0].message.content.trim();

    console.log('OpenAI raw response:', rawResponse);

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
      console.error('Failed to parse OpenAI response:', rawResponse);
      return new Response(JSON.stringify({
        error: 'OpenAI returned non-JSON output',
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
        error: 'Incomplete analysis response from OpenAI',
        missingFields,
        receivedData: parsedResult
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      result: JSON.stringify(parsedResult)
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('ATS analysis error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze resume', 
      details: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
