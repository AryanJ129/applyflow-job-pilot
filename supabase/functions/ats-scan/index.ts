
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

    // Call DeepSeek API
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
            content: `You are an ATS scoring assistant. Review the resume text and give a score out of 10 in these categories: Header, Body Content, Formatting, Contact Info, Structure. For each, give reasons in bullet points. Then give an overall Final Score (0–10), list "What You Did Well" (✅), and "What Needs Improvement" (❌). 

Respond in this EXACT JSON format:
{
  "Header": 8,
  "Body Content": 7,
  "Formatting": 6,
  "Contact Info": 9,
  "Structure": 7,
  "Final Score": 7,
  "What You Did Well": [
    "Clear contact information",
    "Relevant work experience",
    "Professional email address"
  ],
  "What Needs Improvement": [
    "Add more quantified achievements",
    "Include relevant keywords",
    "Improve formatting consistency"
  ]
}`
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
    const reply = data.choices[0].message.content;

    console.log('DeepSeek response:', reply);

    return new Response(JSON.stringify({ result: reply }), { 
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
