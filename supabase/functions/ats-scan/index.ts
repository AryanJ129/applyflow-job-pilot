
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
    const bytes = new Uint8Array(buffer);
    let resumeText = '';

    if (file.name.toLowerCase().endsWith('.pdf')) {
      // Use pdf.js worker for PDF parsing
      const pdfLib = await import('https://esm.sh/pdfjs-dist@4.0.379');
      
      // Set worker source
      pdfLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.js';
      
      const pdf = await pdfLib.getDocument({ data: bytes }).promise;
      let extractedText = '';
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        extractedText += pageText + ' ';
      }
      
      resumeText = extractedText.trim();
      
    } else if (file.name.toLowerCase().endsWith('.docx')) {
      // Use mammoth for DOCX parsing
      const mammoth = await import('https://esm.sh/mammoth@1.8.0');
      
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      resumeText = result.value || '';
      
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported file type. Please upload PDF or DOCX files only.' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Extracted text length:', resumeText.length);
    console.log('Text preview:', resumeText.substring(0, 200));

    if (resumeText.length < 50) {
      return new Response(JSON.stringify({ error: 'Unable to extract valid text from the file. Please ensure your document contains readable text.' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call DeepSeek API with improved prompt
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
            content: resumeText.slice(0, 6000)
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices[0].message.content.trim();

    console.log('DeepSeek raw reply:', raw);

    // Robust JSON parsing with error handling
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse DeepSeek response:', raw);
      return new Response(JSON.stringify({
        error: 'AI returned malformed JSON',
        raw: raw
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
