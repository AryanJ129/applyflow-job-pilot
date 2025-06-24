
export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Try multiple extraction methods
        let extractedText = '';
        
        // Method 1: Try to extract with improved PDF parsing
        extractedText = await parsePDFBuffer(uint8Array);
        
        // Method 2: If still not enough readable text, try alternative approach
        if (extractedText.length < 100 || !hasReadableContent(extractedText)) {
          extractedText = await alternativePDFParse(uint8Array);
        }
        
        // Clean and validate the extracted text
        const cleanedText = cleanExtractedText(extractedText);
        
        if (cleanedText.length < 50 || !hasReadableContent(cleanedText)) {
          reject(new Error(`Could not extract readable text from PDF. Extracted: "${cleanedText.substring(0, 200)}..."`));
          return;
        }
        
        resolve(cleanedText);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

function hasReadableContent(text: string): boolean {
  // Check if text contains meaningful words (at least 3 characters)
  const words = text.split(/\s+/).filter(word => 
    word.length >= 3 && /^[a-zA-Z0-9@.\-_()]+$/.test(word)
  );
  
  // Should have at least 20 meaningful words
  return words.length >= 20;
}

async function parsePDFBuffer(buffer: Uint8Array): Promise<string> {
  // Convert buffer to string with different encodings
  const decoders = [
    new TextDecoder('utf-8'),
    new TextDecoder('latin1'),
    new TextDecoder('windows-1252'),
    new TextDecoder('iso-8859-1')
  ];
  
  let bestText = '';
  let maxScore = 0;
  
  for (const decoder of decoders) {
    try {
      const pdfContent = decoder.decode(buffer);
      const extractedText = extractTextFromPDFContent(pdfContent);
      const score = scoreExtractedText(extractedText);
      
      if (score > maxScore) {
        maxScore = score;
        bestText = extractedText;
      }
    } catch (error) {
      continue;
    }
  }
  
  return bestText;
}

function extractTextFromPDFContent(pdfContent: string): string {
  let extractedText = '';
  
  // Method 1: Extract text between BT/ET markers with improved parsing
  const textBlocks = pdfContent.match(/BT\s*(.*?)\s*ET/gs);
  if (textBlocks) {
    textBlocks.forEach(block => {
      const cleanText = block
        .replace(/BT|ET/g, '')
        .replace(/\/\w+\s+\d+(\.\d+)?\s+Tf/g, '') // Remove font commands
        .replace(/\d+(\.\d+)?\s+\d+(\.\d+)?\s+Td/g, '') // Remove positioning
        .replace(/\d+(\.\d+)?\s+TL/g, '') // Remove leading
        .replace(/\[(.*?)\]\s*TJ/g, '$1') // Extract from TJ arrays
        .replace(/\((.*?)\)\s*Tj/g, '$1') // Extract from Tj commands
        .replace(/\((.*?)\)\s*'/g, '$1') // Extract from quote commands
        .replace(/\\(\d{3})/g, (match, octal) => {
          const charCode = parseInt(octal, 8);
          return charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : ' ';
        })
        .replace(/\\./g, ' ') // Replace other escape sequences
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Keep only printable ASCII
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanText.length > 2) {
        extractedText += cleanText + ' ';
      }
    });
  }
  
  // Method 2: Extract from stream objects
  const streamMatches = pdfContent.match(/stream\s*(.*?)\s*endstream/gs);
  if (streamMatches) {
    streamMatches.forEach(stream => {
      const streamContent = stream
        .replace(/stream|endstream/g, '')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Look for text patterns in stream
      const textPatterns = streamContent.match(/[a-zA-Z]{3,}[\w\s@.\-()]{10,}/g);
      if (textPatterns) {
        textPatterns.forEach(pattern => {
          if (pattern.length > 10) {
            extractedText += pattern + ' ';
          }
        });
      }
    });
  }
  
  // Method 3: Look for parenthetical text (common in PDFs)
  const parentheticalText = pdfContent.match(/\([^)]{3,100}\)/g);
  if (parentheticalText) {
    parentheticalText.forEach(text => {
      const cleaned = text
        .replace(/[()]/g, '')
        .replace(/[^\w\s@.\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleaned.length > 3 && /[a-zA-Z]/.test(cleaned)) {
        extractedText += cleaned + ' ';
      }
    });
  }
  
  return extractedText.trim();
}

async function alternativePDFParse(buffer: Uint8Array): Promise<string> {
  // Alternative method: look for common resume keywords and extract surrounding text
  const decoder = new TextDecoder('latin1');
  const content = decoder.decode(buffer);
  
  const resumeKeywords = [
    'experience', 'education', 'skills', 'work', 'job', 'company',
    'university', 'college', 'degree', 'bachelor', 'master',
    'email', 'phone', 'address', 'linkedin', 'github',
    'project', 'achievement', 'responsibility', '@'
  ];
  
  let extractedText = '';
  
  // Find text around resume keywords
  resumeKeywords.forEach(keyword => {
    const regex = new RegExp(`[\\w\\s@.\\-()]{0,50}${keyword}[\\w\\s@.\\-()]{0,50}`, 'gi');
    const matches = content.match(regex);
    
    if (matches) {
      matches.forEach(match => {
        const cleaned = match
          .replace(/[^\w\s@.\-()]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleaned.length > 10) {
          extractedText += cleaned + ' ';
        }
      });
    }
  });
  
  // Also try to extract email patterns
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = content.match(emailPattern);
  if (emails) {
    emails.forEach(email => {
      extractedText += email + ' ';
    });
  }
  
  // Extract phone patterns
  const phonePattern = /[\+]?[1-9]?[\-\s]?\(?[0-9]{3}\)?[\-\s]?[0-9]{3}[\-\s]?[0-9]{4}/g;
  const phones = content.match(phonePattern);
  if (phones) {
    phones.forEach(phone => {
      extractedText += phone + ' ';
    });
  }
  
  return extractedText.trim();
}

function scoreExtractedText(text: string): number {
  let score = 0;
  
  // Score based on length
  score += Math.min(text.length / 100, 10);
  
  // Score based on readable words
  const words = text.split(/\s+/).filter(word => 
    word.length >= 3 && /^[a-zA-Z0-9@.\-_()]+$/.test(word)
  );
  score += words.length;
  
  // Bonus for resume-related keywords
  const resumeKeywords = [
    'experience', 'education', 'skills', 'work', 'job',
    'university', 'college', 'degree', 'email', 'phone'
  ];
  
  resumeKeywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      score += 5;
    }
  });
  
  // Bonus for email
  if (/@/.test(text)) {
    score += 10;
  }
  
  return score;
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s@.\-()]/g, ' ') // Keep only safe characters
    .replace(/\b\w{1,2}\b/g, ' ') // Remove very short words (likely artifacts)
    .replace(/\s+/g, ' ') // Normalize whitespace again
    .trim();
}
