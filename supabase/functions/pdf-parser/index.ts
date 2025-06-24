
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

    // Clean and validate extracted text
    const cleanedText = cleanAndValidateText(extractedText);
    console.log(`Final extracted text length: ${cleanedText.length}`);
    console.log(`Text preview: ${cleanedText.substring(0, 500)}...`);

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

  // Try different PDF parsing approaches
  let extractedText = '';

  // Method 1: Advanced PDF parsing with better LaTeX support
  extractedText = await advancedPDFParse(uint8Array);

  if (extractedText.length < 100) {
    console.log('Trying character-by-character extraction...');
    extractedText = await characterBasedExtraction(uint8Array);
  }

  if (extractedText.length < 100) {
    console.log('Trying simple text extraction...');
    extractedText = await simpleTextExtraction(uint8Array);
  }

  return extractedText;
}

async function advancedPDFParse(buffer: Uint8Array): Promise<string> {
  let extractedText = '';
  
  // Try multiple encodings
  const encodings = ['utf-8', 'latin1', 'windows-1252', 'iso-8859-1'];
  
  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding, { fatal: false });
      const content = decoder.decode(buffer);
      
      // More comprehensive text extraction patterns
      const textPatterns = [
        // Standard PDF text objects
        /BT\s*((?:[^E]|E(?!T))*?)\s*ET/gs,
        // Text in parentheses with better matching
        /\(([^)]{3,1000})\)/g,
        // Text in square brackets
        /\[([^\]]{3,1000})\]/g,
        // Font and text commands
        /\/F\d+\s+[\d.]+\s+Tf\s*[^(]*\(([^)]+)\)/g,
        // Show text commands
        /Tj\s*\(([^)]+)\)/g,
        // Text positioning with show
        /Td\s*\(([^)]+)\)/g,
        // Text arrays
        /TJ\s*\[([^\]]+)\]/g,
      ];
      
      for (const pattern of textPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          for (const match of matches) {
            let text = match;
            
            // Extract text from PDF commands
            if (text.includes('BT') && text.includes('ET')) {
              // Clean BT/ET blocks
              text = text.replace(/BT|ET|\/F\d+\s+[\d.]+\s+Tf|Td|Tj|TJ/g, ' ');
              
              // Extract text from parentheses
              const textInParens = text.match(/\(([^)]+)\)/g);
              if (textInParens) {
                for (const parenText of textInParens) {
                  const cleaned = parenText.replace(/[()]/g, '').trim();
                  if (cleaned.length > 2 && /[a-zA-Z]/.test(cleaned)) {
                    extractedText += cleaned + ' ';
                  }
                }
              }
            } else {
              // Direct text extraction
              const directText = text.match(/\(([^)]+)\)/);
              if (directText && directText[1]) {
                const cleaned = directText[1].trim();
                if (cleaned.length > 2 && /[a-zA-Z]/.test(cleaned)) {
                  extractedText += cleaned + ' ';
                }
              } else {
                // Clean and add non-parentheses text
                const cleaned = text.replace(/[()[\]]/g, ' ').replace(/[^\w\s@.\-]/g, ' ').trim();
                if (cleaned.length > 3 && /[a-zA-Z]{2,}/.test(cleaned)) {
                  extractedText += cleaned + ' ';
                }
              }
            }
          }
        }
      }
      
      if (extractedText.length > 200) break; // Found substantial content
    } catch (e) {
      console.log(`Failed with encoding ${encoding}:`, e.message);
      continue;
    }
  }
  
  return extractedText.trim();
}

async function characterBasedExtraction(buffer: Uint8Array): Promise<string> {
  let extractedText = '';
  
  try {
    // Try different character encodings
    const encodings = ['utf-8', 'latin1', 'windows-1252', 'ascii'];
    
    for (const encoding of encodings) {
      try {
        const decoder = new TextDecoder(encoding, { fatal: false });
        const content = decoder.decode(buffer);
        
        // Look for readable character sequences
        const readableChunks = content.match(/[A-Za-z][A-Za-z0-9\s@.\-(),]{8,200}/g);
        
        if (readableChunks) {
          for (const chunk of readableChunks) {
            // Clean the chunk
            const cleaned = chunk
              .replace(/[^\w\s@.\-(),]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            // Only add if it looks like real text
            if (cleaned.length > 10 && /[a-zA-Z]{3,}/.test(cleaned)) {
              extractedText += cleaned + ' ';
            }
          }
        }
        
        // Look for email patterns
        const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (emails) {
          extractedText += ' ' + emails.join(' ') + ' ';
        }
        
        // Look for phone patterns
        const phones = content.match(/[\+]?[1-9]?[\-\s]?\(?[0-9]{3}\)?[\-\s]?[0-9]{3}[\-\s]?[0-9]{4}/g);
        if (phones) {
          extractedText += ' ' + phones.join(' ') + ' ';
        }
        
        if (extractedText.length > 200) break;
      } catch (e) {
        continue;
      }
    }
  } catch (e) {
    console.error('Character-based extraction failed:', e);
  }
  
  return extractedText.trim();
}

async function simpleTextExtraction(buffer: Uint8Array): Promise<string> {
  let extractedText = '';
  
  try {
    const decoder = new TextDecoder('latin1', { fatal: false });
    const content = decoder.decode(buffer);
    
    // Extract any readable text sequences
    const words = content.match(/[a-zA-Z]{3,}[a-zA-Z0-9\s@.\-()]*[a-zA-Z0-9]/g);
    
    if (words) {
      const validWords = words.filter(word => {
        const cleaned = word.trim();
        return cleaned.length >= 3 && 
               /[a-zA-Z]/.test(cleaned) && 
               !cleaned.match(/^[A-Z]{5,}$/); // Filter out gibberish
      });
      
      extractedText = validWords.join(' ');
    }
  } catch (e) {
    console.error('Simple extraction failed:', e);
  }
  
  return extractedText.trim();
}

async function processWordDocument(file: File): Promise<string> {
  console.log('Processing Word document...');
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    
    // Convert to string and look for XML content
    const content = decoder.decode(arrayBuffer);
    
    // Enhanced Word document parsing
    let extractedText = '';
    
    // Look for XML text content (Word documents are XML-based)
    const xmlPatterns = [
      /<w:t[^>]*>([^<]+)<\/w:t>/g,
      /<text[^>]*>([^<]+)<\/text>/g,
      />\s*([A-Za-z][A-Za-z0-9\s@.\-(),]{10,500})\s*</g,
    ];
    
    for (const pattern of xmlPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          let text = match;
          // Remove XML tags
          text = text.replace(/<[^>]*>/g, ' ');
          // Clean up
          text = text.replace(/[^\w\s@.\-(),]/g, ' ').replace(/\s+/g, ' ').trim();
          
          if (text.length > 5 && /[a-zA-Z]{3,}/.test(text)) {
            extractedText += text + ' ';
          }
        }
      }
    }
    
    // If XML parsing didn't work well, try raw text extraction
    if (extractedText.length < 100) {
      console.log('XML parsing insufficient, trying raw text extraction...');
      
      // Look for readable text sequences in the raw content
      const readableText = content.match(/[A-Za-z][A-Za-z0-9\s@.\-(),]{10,300}/g);
      if (readableText) {
        for (const text of readableText) {
          const cleaned = text.replace(/[^\w\s@.\-(),]/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleaned.length > 10 && /[a-zA-Z]{3,}/.test(cleaned)) {
            extractedText += cleaned + ' ';
          }
        }
      }
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Word document processing failed:', error);
    throw new Error('Failed to extract text from Word document. Please try saving as PDF or text file.');
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
      return 'This PDF might be image-based or have encoding issues. Please try: 1) Converting to Word format, 2) Copying text and saving as .txt file, or 3) Using "Save as Text" from your PDF viewer.';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'Could not extract text from this Word document. Please try saving as PDF or copying the text to a .txt file.';
    case 'text/plain':
      return 'The text file appears to be empty or contains very little content.';
    default:
      return 'Please ensure your file contains readable text content.';
  }
}

function cleanAndValidateText(text: string): string {
  if (!text) return '';
  
  // Remove problematic characters and clean up
  let cleaned = text
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/[^\w\s@.\-(),]/g, ' ') // Remove special characters except common ones
    .replace(/\s+/g, ' ') // Clean up spaces again
    .trim();
  
  // Remove very short words that are likely artifacts
  const words = cleaned.split(' ').filter(word => {
    if (word.length <= 2) return false;
    if (word.match(/^[0-9]+$/)) return word.length >= 4; // Keep longer numbers
    if (word.match(/^[A-Z]{3,}$/)) return false; // Remove all-caps gibberish
    return true;
  });
  
  cleaned = words.join(' ');
  
  // Validate that this looks like resume content
  const resumeIndicators = [
    'experience', 'education', 'skills', 'work', 'job', 'employment',
    'university', 'college', 'school', 'degree', 'bachelor', 'master', 'phd',
    'company', 'project', 'manager', 'developer', 'engineer', 'analyst',
    'email', 'phone', '@', 'linkedin', 'github', 'resume', 'cv',
    'qualification', 'certification', 'internship', 'position'
  ];
  
  const lowerText = cleaned.toLowerCase();
  const indicatorCount = resumeIndicators.filter(indicator => 
    lowerText.includes(indicator)
  ).length;
  
  console.log(`Found ${indicatorCount} resume indicators in cleaned text`);
  console.log(`Final text length: ${cleaned.length} characters`);
  
  return cleaned;
}
