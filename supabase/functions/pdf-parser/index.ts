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

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    let extractedText = '';

    // Handle different file types
    if (file.type === 'application/pdf') {
      extractedText = await processPDF(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      extractedText = await processWordDocument(file);
    } else if (file.type === 'text/plain') {
      extractedText = await processTextFile(file);
    } else {
      return new Response(JSON.stringify({ error: "Unsupported file type. Please upload PDF, Word (.docx), or text (.txt) files." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate extracted text
    const cleanedText = cleanAndValidateText(extractedText);
    console.log(`Final extracted text length: ${cleanedText.length}`);
    console.log(`Text preview: ${cleanedText.substring(0, 300)}...`);

    if (cleanedText.length < 50) {
      return new Response(JSON.stringify({ 
        error: `Could not extract sufficient readable text from the file. ${getFileSpecificError(file.type)}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ text: cleanedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('File parsing error:', error);
    return new Response(JSON.stringify({ 
      error: `File parsing failed: ${error.message}. Please try a different file format or ensure your document contains selectable text.` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processPDF(file: File): Promise<string> {
  console.log('Processing PDF file...');
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  let extractedText = '';

  // Try multiple PDF parsing methods for LaTeX compatibility
  extractedText = await comprehensivePDFParse(uint8Array);

  if (extractedText.length < 100) {
    console.log('Trying LaTeX-specific extraction...');
    extractedText = await latexPDFExtraction(uint8Array);
  }

  if (extractedText.length < 100) {
    console.log('Trying simple text extraction...');
    extractedText = await simpleTextExtraction(uint8Array);
  }

  return extractedText;
}

async function processWordDocument(file: File): Promise<string> {
  console.log('Processing Word document...');
  
  try {
    // Read the Word document as a zip file (since .docx is a zip)
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder();
    
    // Try to extract text from the raw content
    // This is a simplified approach - for production, you'd want a proper DOCX parser
    const content = decoder.decode(arrayBuffer);
    
    // Look for readable text patterns in the document
    const textPatterns = [
      // XML text content
      /<w:t[^>]*>([^<]+)<\/w:t>/g,
      // Plain text sequences
      /[a-zA-Z][a-zA-Z0-9\s@.\-(),]{10,200}/g,
    ];
    
    let extractedText = '';
    
    for (const pattern of textPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          let text = match;
          // Clean XML tags if present
          text = text.replace(/<[^>]*>/g, ' ');
          // Clean up whitespace
          text = text.replace(/\s+/g, ' ').trim();
          
          if (text.length > 3 && /[a-zA-Z]/.test(text)) {
            extractedText += text + ' ';
          }
        }
      }
    }
    
    // If we didn't find much text, try a different approach
    if (extractedText.length < 100) {
      // Look for any readable sequences
      const readableText = content.match(/[a-zA-Z]{3,}[a-zA-Z0-9\s@.\-()]{5,}/g);
      if (readableText) {
        extractedText = readableText.join(' ');
      }
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Word document processing failed:', error);
    throw new Error('Failed to extract text from Word document. Please save as PDF or text file.');
  }
}

async function processTextFile(file: File): Promise<string> {
  console.log('Processing text file...');
  const text = await file.text();
  return text.trim();
}

function getFileSpecificError(fileType: string): string {
  switch (fileType) {
    case 'application/pdf':
      return 'This appears to be a LaTeX-generated or scanned PDF. Please try: 1) Converting to Word format, 2) Copying text and saving as .txt file, or 3) Using "Save as Text" from your PDF viewer.';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'Could not extract text from this Word document. Please try saving as PDF or copying the text to a .txt file.';
    case 'text/plain':
      return 'The text file appears to be empty or contains very little content.';
    default:
      return 'Please ensure your file contains readable text content.';
  }
}

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

async function simpleTextExtraction(buffer: Uint8Array): Promise<string> {
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
