
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert PDF to images using pdf-parse
async function pdfToImages(buffer: ArrayBuffer): Promise<string[]> {
  try {
    const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
    const pdfData = await pdfParse.default(buffer);
    
    // For now, we'll convert the PDF to a single base64 image representation
    // This is a simplified approach - in production you might want to use a more sophisticated PDF-to-image converter
    const uint8Array = new Uint8Array(buffer);
    const base64 = btoa(String.fromCharCode(...uint8Array));
    
    return [`data:application/pdf;base64,${base64}`];
  } catch (error) {
    console.error('PDF to image conversion failed:', error);
    throw error;
  }
}

// Extract text from DOCX
async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  try {
    const mammoth = await import('https://esm.sh/mammoth@1.8.0');
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value || '';
  } catch (error) {
    console.error('DOCX text extraction failed:', error);
    throw error;
  }
}

// Create comprehensive ATS analysis prompt
function createATSPrompt(isPdf: boolean): string {
  const basePrompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. ${isPdf ? 'Analyze the resume document shown in the image' : 'Analyze the provided resume text'} and return ONLY a valid JSON object with this exact structure:

{
  "Header": [score 1-10],
  "Body Content": [score 1-10], 
  "Formatting": [score 1-10],
  "Contact Info": [score 1-10],
  "Structure": [score 1-10],
  "Final Score": [average score 1-10],
  "What You Did Well": [
    "specific positive point 1",
    "specific positive point 2",
    "specific positive point 3"
  ],
  "What Needs Improvement": [
    "specific improvement suggestion 1", 
    "specific improvement suggestion 2",
    "specific improvement suggestion 3"
  ]
}

DETAILED SCORING CRITERIA:

**Header (1-10):**
- Professional title/headline present and relevant
- Name clearly visible and prominent
- Positioning statement or summary
- Relevant keywords for target role

**Body Content (1-10):**
- Relevant work experience with specific achievements
- Quantified results and metrics where possible
- Skills section with job-relevant technologies/competencies
- Education appropriate for role level
- Content demonstrates clear career progression

**Formatting (1-10):**
- Clean, professional layout
- Consistent fonts and spacing
- Appropriate use of bullet points and sections
- Easy to scan and read
- ATS-friendly formatting (no complex graphics/tables)

**Contact Info (1-10):**
- Phone number present and properly formatted
- Professional email address
- LinkedIn profile URL
- Location/city mentioned
- No missing critical contact details

**Structure (1-10):**
- Logical flow of information
- Appropriate section ordering
- Clear section headers
- Proper length (1-2 pages)
- Professional organization

Provide specific, actionable feedback based on what you observe. Focus on both strengths and concrete improvement areas. Return ONLY the JSON object, no markdown formatting or additional text.`;

  return basePrompt;
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

    const buffer = await file.arrayBuffer();
    let chatGPTResponse;

    if (file.name.toLowerCase().endsWith('.pdf')) {
      console.log('Processing PDF with ChatGPT Vision...');
      
      // Convert PDF to base64 for ChatGPT Vision
      const uint8Array = new Uint8Array(buffer);
      const base64 = btoa(String.fromCharCode(...uint8Array));
      
      chatGPTResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: createATSPrompt(true)
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/pdf;base64,${base64}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          temperature: 0.2,
          max_tokens: 1500
        }),
      });

    } else if (file.name.toLowerCase().endsWith('.docx')) {
      console.log('Processing DOCX with ChatGPT Text API...');
      
      const extractedText = await extractDocxText(buffer);
      
      if (extractedText.length < 100) {
        return new Response(JSON.stringify({ 
          error: 'Unable to extract sufficient text from DOCX file. The document may be empty or corrupted.',
          extractedLength: extractedText.length
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      chatGPTResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: `${createATSPrompt(false)}\n\nResume text to analyze:\n\n${extractedText.slice(0, 8000)}`
            }
          ],
          temperature: 0.2,
          max_tokens: 1500
        }),
      });

    } else {
      return new Response(JSON.stringify({ error: 'Unsupported file type. Please upload PDF or DOCX files only.' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!chatGPTResponse.ok) {
      const errorText = await chatGPTResponse.text();
      console.error('ChatGPT API error:', chatGPTResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: `ChatGPT API error: ${chatGPTResponse.status}`,
        details: errorText
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await chatGPTResponse.json();
    let rawResponse = data.choices[0].message.content.trim();

    console.log('ChatGPT raw response:', rawResponse);

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
      console.error('Failed to parse ChatGPT response:', rawResponse);
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
      textLength: file.name.toLowerCase().endsWith('.docx') ? 'DOCX processed' : 'PDF analyzed visually'
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
