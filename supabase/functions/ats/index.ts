
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract text from PDF using pdfjs-dist (Fixed version for Deno compatibility)
async function extractPdfText(buffer: Uint8Array): Promise<string> {
  try {
    // Use stable pdfjs-dist version for better Deno compatibility
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.4.120');
    
    // Load PDF document with simplified approach
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(' ') + '\n';
    }
    
    console.log(`✅ PDF text extracted successfully, length: ${fullText.length}`);
    return fullText;
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    throw new Error('Failed to extract text from PDF file');
  }
}

// Extract text from DOCX using mammoth (Deno compatible version)
async function extractDocxText(buffer: Uint8Array): Promise<string> {
  try {
    const mammoth = await import('https://esm.sh/mammoth@1.8.0');
    const result = await mammoth.extractRawText({ arrayBuffer: buffer.buffer });
    console.log(`✅ DOCX text extracted successfully, length: ${result.value?.length || 0}`);
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
      console.error('❌ No file provided in request');
      return new Response(JSON.stringify({ error: 'Missing file' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📁 Processing file:', file.name, 'Size:', file.size);

    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not configured');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
      console.error('❌ Unsupported file type:', fileName);
      return new Response(JSON.stringify({ error: 'Unsupported file type. Please upload PDF or DOCX files only.' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Convert to Uint8Array once and validate
    const buffer = new Uint8Array(await file.arrayBuffer());
    
    if (!buffer || buffer.length < 100) {
      console.error('❌ Invalid or empty file buffer, length:', buffer.length);
      return new Response(JSON.stringify({
        error: 'Invalid or empty file. Please upload a valid PDF or DOCX.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ File uploaded successfully, buffer size:', buffer.length);

    let extractedText: string;

    // Extract text based on file type
    if (fileName.endsWith('.pdf')) {
      console.log('🔍 Extracting text from PDF...');
      extractedText = await extractPdfText(buffer);
    } else {
      console.log('🔍 Extracting text from DOCX...');
      extractedText = await extractDocxText(buffer);
    }

    // Validate extracted text
    if (extractedText.length < 100) {
      console.error('❌ Insufficient text extracted, length:', extractedText.length);
      return new Response(JSON.stringify({ 
        error: 'Unable to extract sufficient text from file. The document may be empty, corrupted, or contain only images.',
        extractedLength: extractedText.length
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Text extracted successfully (${extractedText.length} chars)`);
    console.log(`📄 First 500 chars: ${extractedText.slice(0, 500)}`);

    // Call OpenAI with updated model
    console.log('🤖 Calling OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Updated to use faster, more cost-effective model
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
      console.error('❌ OpenAI API error:', openaiResponse.status, errorText);
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

    console.log('🤖 OpenAI raw response:', rawResponse);

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
      console.log('✅ Successfully parsed ATS results:', parsedResult);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', rawResponse);
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
      console.error('❌ Missing required fields:', missingFields);
      return new Response(JSON.stringify({
        error: 'Incomplete analysis response from OpenAI',
        missingFields,
        receivedData: parsedResult
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ ATS analysis completed successfully');

    // Return the parsed result directly (no double JSON.stringify)
    return new Response(JSON.stringify({ 
      result: parsedResult
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ ATS analysis error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze resume', 
      details: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
