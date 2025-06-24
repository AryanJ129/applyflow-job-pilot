
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (file.type !== 'application/pdf') {
      return new Response(JSON.stringify({ error: "Only PDF files are supported" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing PDF: ${file.name}, size: ${file.size} bytes`);

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Try to extract text using multiple methods
    let extractedText = '';

    // Method 1: Try comprehensive PDF parsing
    extractedText = await comprehensivePDFParse(uint8Array);

    // Method 2: If not enough text, try LaTeX-specific extraction
    if (extractedText.length < 100) {
      console.log('Trying LaTeX-specific extraction...');
      extractedText = await latexPDFExtraction(uint8Array);
    }

    // Method 3: Try character pattern extraction
    if (extractedText.length < 100) {
      console.log('Trying character pattern extraction...');
      extractedText = await characterPatternExtraction(uint8Array);
    }

    // Clean and validate the extracted text
    const cleanedText = cleanAndValidateText(extractedText);

    console.log(`Final extracted text length: ${cleanedText.length}`);
    console.log(`Text preview: ${cleanedText.substring(0, 300)}...`);

    if (cleanedText.length < 50) {
      return new Response(JSON.stringify({ 
        error: `Could not extract sufficient readable text from PDF. This appears to be a LaTeX-generated or scanned PDF. Please try:
1. Exporting your LaTeX resume as a different PDF format
2. Converting to Word format first, then to PDF
3. Using "Save as Text" from your PDF viewer
4. Uploading a Word document instead

Extracted preview: "${cleanedText.substring(0, 100)}..."` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ text: cleanedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('PDF parsing error:', error);
    return new Response(JSON.stringify({ 
      error: `PDF parsing failed: ${error.message}. This might be a LaTeX-generated PDF with complex encoding. Please try uploading a Word document or plain text version of your resume.` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function comprehensivePDFParse(buffer: Uint8Array): Promise<string> {
  let extractedText = '';
  
  // Try multiple encodings for LaTeX PDFs
  const encodings = ['utf-8', 'latin1', 'windows-1252', 'iso-8859-1'];
  
  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding, { fatal: false });
      const content = decoder.decode(buffer);
      
      // Look for text objects and streams - LaTeX often uses specific patterns
      const textPatterns = [
        // Standard text objects
        /BT\s*((?:[^E]|E(?!T))*?)\s*ET/gs,
        // Text in parentheses (common in LaTeX PDFs)
        /\(([^)]{5,500})\)/g,
        // Text in brackets
        /\[([^\]]{5,500})\]/g,
        // Stream content
        /stream\s*([\s\S]*?)\s*endstream/g,
        // LaTeX-specific font mappings
        /\/F\d+\s+\d+\s+Tf\s*\(([^)]+)\)/g,
      ];
      
      for (const pattern of textPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          for (const match of matches) {
            let text = match;
            
            // Clean text objects
            if (text.includes('BT') && text.includes('ET')) {
              text = text.replace(/BT|ET/g, '');
              
              // Extract from Tj and TJ commands (common in LaTeX)
              const textCommands = text.match(/\(([^)]+)\)\s*Tj|\[([^\]]+)\]\s*TJ|\/F\d+.*?\(([^)]+)\)/g);
              if (textCommands) {
                for (const cmd of textCommands) {
                  const cleanCmd = cmd.replace(/\(|\)|\[|\]|Tj|TJ|\/F\d+.*?\(/g, '').trim();
                  if (cleanCmd.length > 2 && /[a-zA-Z]/.test(cleanCmd)) {
                    extractedText += cleanCmd + ' ';
                  }
                }
              }
            } else {
              // Clean parentheses and brackets content
              text = text.replace(/[()[\]]/g, '');
              if (text.length > 3 && /[a-zA-Z]{2,}/.test(text)) {
                extractedText += text + ' ';
              }
            }
          }
        }
      }
      
      if (extractedText.length > 100) break;
    } catch (e) {
      continue;
    }
  }
  
  return extractedText.trim();
}

async function latexPDFExtraction(buffer: Uint8Array): Promise<string> {
  let extractedText = '';
  
  try {
    // LaTeX PDFs often use specific character encodings
    const decoder = new TextDecoder('latin1', { fatal: false });
    const content = decoder.decode(buffer);
    
    // Look for LaTeX-specific patterns
    const latexPatterns = [
      // Font declarations followed by text
      /\/F\d+\s+[\d.]+\s+Tf\s*\(([^)]+)\)/g,
      // Text positioning commands
      /Td\s*\(([^)]+)\)/g,
      // Simple text showing
      /Tj\s*\(([^)]+)\)/g,
      // Text arrays
      /TJ\s*\[([^\]]+)\]/g,
    ];
    
    for (const pattern of latexPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Extract text from LaTeX commands
          const textMatch = match.match(/\(([^)]+)\)/);
          if (textMatch && textMatch[1]) {
            const text = textMatch[1].trim();
            if (text.length > 2 && /[a-zA-Z]/.test(text)) {
              extractedText += text + ' ';
            }
          }
        }
      }
    }
    
    // Also try to find readable text sequences
    const readableChunks = content.match(/[A-Za-z][A-Za-z0-9\s@.\-(),]{10,200}/g);
    if (readableChunks) {
      for (const chunk of readableChunks) {
        const cleaned = chunk.replace(/[^\w\s@.\-(),]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleaned.length > 10 && /[a-zA-Z]{3,}/.test(cleaned)) {
          extractedText += cleaned + ' ';
        }
      }
    }
    
  } catch (e) {
    console.error('LaTeX extraction failed:', e);
  }
  
  return extractedText.trim();
}

async function characterPatternExtraction(buffer: Uint8Array): Promise<string> {
  let extractedText = '';
  
  const encodings = ['utf-8', 'latin1', 'windows-1252', 'ascii'];
  
  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding, { fatal: false });
      const content = decoder.decode(buffer);
      
      // Look for sequences of readable characters
      const readableChunks = content.match(/[A-Za-z][A-Za-z0-9\s@.\-()]{8,150}/g);
      
      if (readableChunks) {
        for (const chunk of readableChunks) {
          const cleaned = chunk.replace(/[^\w\s@.\-()]/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleaned.length > 8 && /[a-zA-Z]{3,}/.test(cleaned)) {
            extractedText += cleaned + ' ';
          }
        }
      }
      
      // Look for common resume patterns
      const resumePatterns = [
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // emails
        /\b(?:experience|education|skills|work|university|college|degree|bachelor|master|phd|company|project|manager|developer|engineer|analyst)\b[^.!?]{0,100}/gi,
      ];
      
      for (const pattern of resumePatterns) {
        const matches = content.match(pattern);
        if (matches) {
          for (const match of matches) {
            const cleaned = match.replace(/[^\w\s@.\-()]/g, ' ').replace(/\s+/g, ' ').trim();
            if (cleaned.length > 5) {
              extractedText += cleaned + ' ';
            }
          }
        }
      }
      
      if (extractedText.length > 100) break;
    } catch (e) {
      continue;
    }
  }
  
  return extractedText.trim();
}

function cleanAndValidateText(text: string): string {
  if (!text) return '';
  
  // Remove excessive whitespace and clean up
  let cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s@.\-()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove very short isolated words that are likely artifacts
  const words = cleaned.split(' ').filter(word => {
    if (word.length <= 2) return false;
    if (word.match(/^[0-9]+$/)) return word.length >= 4;
    if (word.match(/^[A-Z]{3,}$/)) return false; // Remove all-caps gibberish
    return true;
  });
  
  cleaned = words.join(' ');
  
  // Basic resume content validation
  const resumeIndicators = [
    'experience', 'education', 'skills', 'work', 'job',
    'university', 'college', 'school', 'degree', 'bachelor', 'master',
    'company', 'project', 'manager', 'developer', 'engineer', 'analyst',
    'email', 'phone', '@', 'linkedin', 'github', 'resume', 'cv'
  ];
  
  const lowerText = cleaned.toLowerCase();
  const indicatorCount = resumeIndicators.filter(indicator => 
    lowerText.includes(indicator)
  ).length;
  
  console.log(`Found ${indicatorCount} resume indicators in cleaned text`);
  
  return cleaned;
}
