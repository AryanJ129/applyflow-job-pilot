export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        let extractedText = '';
        
        // Method 1: Try different PDF text extraction approaches
        extractedText = await comprehensivePDFParse(uint8Array);
        
        // Method 2: If not enough text, try OCR-like approach
        if (extractedText.length < 100) {
          console.log('Trying character pattern extraction...');
          extractedText = await characterPatternExtraction(uint8Array);
        }
        
        // Method 3: Try simple string extraction
        if (extractedText.length < 100) {
          console.log('Trying simple string extraction...');
          extractedText = await simpleStringExtraction(uint8Array);
        }
        
        // Clean and validate the extracted text
        const cleanedText = cleanAndValidateText(extractedText);
        
        console.log(`Final extracted text length: ${cleanedText.length}`);
        console.log(`Text preview: ${cleanedText.substring(0, 300)}...`);
        
        if (cleanedText.length < 50) {
          reject(new Error(`Could not extract sufficient readable text from PDF. This might be a scanned document or have encoding issues. Please try converting your PDF to text format first. Extracted: "${cleanedText.substring(0, 100)}..."`));
          return;
        }
        
        resolve(cleanedText);
      } catch (error) {
        console.error('PDF parsing error:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

async function comprehensivePDFParse(buffer: Uint8Array): Promise<string> {
  let extractedText = '';
  
  // Try multiple encodings
  const encodings = ['utf-8', 'latin1', 'windows-1252'];
  
  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding, { fatal: false });
      const content = decoder.decode(buffer);
      
      // Look for text objects and streams
      const textPatterns = [
        // Standard text objects
        /BT\s*((?:[^E]|E(?!T))*?)\s*ET/gs,
        // Text in parentheses
        /\(([^)]{10,200})\)/g,
        // Text in brackets
        /\[([^\]]{10,200})\]/g,
        // Stream content
        /stream\s*([\s\S]*?)\s*endstream/g
      ];
      
      for (const pattern of textPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          for (const match of matches) {
            let text = match;
            
            // Clean text objects
            if (text.includes('BT') && text.includes('ET')) {
              text = text.replace(/BT|ET/g, '');
              
              // Extract from Tj and TJ commands
              const textCommands = text.match(/\(([^)]+)\)\s*Tj|\[([^\]]+)\]\s*TJ/g);
              if (textCommands) {
                for (const cmd of textCommands) {
                  const cleanCmd = cmd.replace(/\(|\)|\[|\]|Tj|TJ/g, '').trim();
                  if (cleanCmd.length > 2 && /[a-zA-Z]/.test(cleanCmd)) {
                    extractedText += cleanCmd + ' ';
                  }
                }
              }
            } else {
              // Clean parentheses and brackets content
              text = text.replace(/[()[\]]/g, '');
              if (text.length > 5 && /[a-zA-Z]{3,}/.test(text)) {
                extractedText += text + ' ';
              }
            }
          }
        }
      }
      
      if (extractedText.length > 100) break; // Found good content
    } catch (e) {
      continue;
    }
  }
  
  return extractedText.trim();
}

async function characterPatternExtraction(buffer: Uint8Array): Promise<string> {
  let extractedText = '';
  
  // Convert to different character encodings and look for readable patterns
  const encodings = ['utf-8', 'latin1', 'windows-1252', 'ascii'];
  
  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding, { fatal: false });
      const content = decoder.decode(buffer);
      
      // Look for sequences of readable characters
      const readableChunks = content.match(/[A-Za-z][A-Za-z0-9\s@.\-()]{5,100}/g);
      
      if (readableChunks) {
        for (const chunk of readableChunks) {
          const cleaned = chunk.replace(/[^\w\s@.\-()]/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleaned.length > 5 && /[a-zA-Z]{3,}/.test(cleaned)) {
            extractedText += cleaned + ' ';
          }
        }
      }
      
      // Look for email patterns
      const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emails) {
        extractedText += emails.join(' ') + ' ';
      }
      
      // Look for common resume keywords with surrounding context
      const keywords = ['experience', 'education', 'skills', 'work', 'university', 'college', 'company', 'project', 'manager', 'developer', 'engineer'];
      
      for (const keyword of keywords) {
        const regex = new RegExp(`[\\w\\s@.\\-()]{0,30}${keyword}[\\w\\s@.\\-()]{0,30}`, 'gi');
        const matches = content.match(regex);
        
        if (matches) {
          for (const match of matches) {
            const cleaned = match.replace(/[^\w\s@.\-()]/g, ' ').replace(/\s+/g, ' ').trim();
            if (cleaned.length > 10) {
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

async function simpleStringExtraction(buffer: Uint8Array): Promise<string> {
  let extractedText = '';
  
  try {
    // Convert to string and look for any readable text
    const decoder = new TextDecoder('latin1', { fatal: false });
    const content = decoder.decode(buffer);
    
    // Remove non-printable characters but keep spaces and common punctuation
    const cleanContent = content.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
    
    // Extract words that look like real text
    const words = cleanContent.match(/[a-zA-Z]{3,}[a-zA-Z0-9\s@.\-()]*[a-zA-Z0-9]/g);
    
    if (words) {
      // Filter and clean words
      const validWords = words.filter(word => {
        const cleaned = word.trim();
        return cleaned.length >= 3 && 
               /[a-zA-Z]/.test(cleaned) && 
               !cleaned.match(/^[A-Z]{5,}$/) && // Not all caps gibberish
               cleaned.split(/\s+/).length <= 20; // Not too long
      });
      
      extractedText = validWords.join(' ');
    }
    
    // Try to find structured data like phone numbers, emails with context
    const phoneContext = content.match(/[a-zA-Z\s]{0,20}[\+]?[1-9]?[\-\s]?\(?[0-9]{3}\)?[\-\s]?[0-9]{3}[\-\s]?[0-9]{4}[a-zA-Z\s]{0,20}/g);
    const emailContext = content.match(/[a-zA-Z\s]{0,30}[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[a-zA-Z\s]{0,30}/g);
    
    if (phoneContext) {
      extractedText += ' ' + phoneContext.join(' ');
    }
    
    if (emailContext) {
      extractedText += ' ' + emailContext.join(' ');
    }
  } catch (e) {
    console.error('Simple extraction failed:', e);
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
    if (word.match(/^[0-9]+$/)) return word.length >= 4; // Keep longer numbers
    return true;
  });
  
  cleaned = words.join(' ');
  
  // Basic resume content validation
  const resumeIndicators = [
    'experience', 'education', 'skills', 'work', 'job',
    'university', 'college', 'school', 'degree', 'bachelor', 'master',
    'company', 'project', 'manager', 'developer', 'engineer', 'analyst',
    'email', 'phone', '@', 'linkedin', 'github'
  ];
  
  const lowerText = cleaned.toLowerCase();
  const indicatorCount = resumeIndicators.filter(indicator => 
    lowerText.includes(indicator)
  ).length;
  
  // If we have very few resume indicators, this might not be a good extraction
  if (indicatorCount < 2 && cleaned.length < 200) {
    console.log(`Warning: Only ${indicatorCount} resume indicators found in text`);
  }
  
  return cleaned;
}
