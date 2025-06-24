
export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Try multiple extraction methods in order of sophistication
        let extractedText = '';
        
        // Method 1: Advanced PDF parsing with better text extraction
        extractedText = await advancedPDFParse(uint8Array);
        
        // Method 2: If still not enough readable text, try stream-based parsing
        if (extractedText.length < 100 || !hasValidResumeContent(extractedText)) {
          console.log('Trying stream-based parsing...');
          extractedText = await streamBasedPDFParse(uint8Array);
        }
        
        // Method 3: Last resort - keyword-based extraction
        if (extractedText.length < 100 || !hasValidResumeContent(extractedText)) {
          console.log('Trying keyword-based extraction...');
          extractedText = await keywordBasedExtraction(uint8Array);
        }
        
        // Clean and validate the extracted text
        const cleanedText = cleanExtractedText(extractedText);
        
        console.log(`Final extracted text length: ${cleanedText.length}`);
        console.log(`Text preview: ${cleanedText.substring(0, 200)}...`);
        
        if (cleanedText.length < 50 || !hasValidResumeContent(cleanedText)) {
          reject(new Error(`Could not extract readable resume content. Please ensure your PDF contains selectable text and try again. Extracted: "${cleanedText.substring(0, 200)}..."`));
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

function hasValidResumeContent(text: string): boolean {
  // Check for common resume indicators
  const resumeIndicators = [
    'experience', 'education', 'skills', 'work', 'employment',
    'university', 'college', 'degree', 'bachelor', 'master',
    'phone', 'email', '@', 'linkedin', 'github',
    'project', 'achievement', 'responsibility', 'company'
  ];
  
  const textLower = text.toLowerCase();
  const indicatorCount = resumeIndicators.filter(indicator => 
    textLower.includes(indicator)
  ).length;
  
  // Need at least 3 resume indicators and meaningful word count
  const words = text.split(/\s+/).filter(word => 
    word.length >= 3 && /^[a-zA-Z0-9@.\-_()]+$/.test(word)
  );
  
  return indicatorCount >= 3 && words.length >= 30;
}

async function advancedPDFParse(buffer: Uint8Array): Promise<string> {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const pdfContent = decoder.decode(buffer);
  
  let extractedText = '';
  
  // Extract from text objects with improved parsing
  const textObjectRegex = /BT\s*((?:[^E]|E(?!T))*)\s*ET/gs;
  const matches = pdfContent.match(textObjectRegex);
  
  if (matches) {
    for (const match of matches) {
      const content = match.replace(/BT|ET/g, '').trim();
      
      // Extract text from various PDF text commands
      const textCommands = [
        /\[(.*?)\]\s*TJ/g,  // Array text positioning
        /\((.*?)\)\s*Tj/g,  // Simple text
        /\((.*?)\)\s*'/g,   // Quote positioning
        /\((.*?)\)\s*"/g    // Double quote positioning
      ];
      
      for (const regex of textCommands) {
        let commandMatch;
        while ((commandMatch = regex.exec(content)) !== null) {
          let text = commandMatch[1];
          
          // Handle escape sequences
          text = text
            .replace(/\\(\d{3})/g, (_, octal) => {
              const charCode = parseInt(octal, 8);
              return charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : ' ';
            })
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\(.)/g, '$1');
          
          if (text.length > 2 && /[a-zA-Z]/.test(text)) {
            extractedText += text + ' ';
          }
        }
      }
    }
  }
  
  return extractedText.trim();
}

async function streamBasedPDFParse(buffer: Uint8Array): Promise<string> {
  const decoder = new TextDecoder('latin1');
  const content = decoder.decode(buffer);
  
  let extractedText = '';
  
  // Look for stream objects and try to extract text
  const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
  let streamMatch;
  
  while ((streamMatch = streamRegex.exec(content)) !== null) {
    const streamContent = streamMatch[1];
    
    // Try to find readable text in streams
    const readableText = streamContent.match(/[a-zA-Z\s]{4,}/g);
    if (readableText) {
      for (const text of readableText) {
        const cleaned = text.replace(/\s+/g, ' ').trim();
        if (cleaned.length > 5 && /[a-zA-Z]{3,}/.test(cleaned)) {
          extractedText += cleaned + ' ';
        }
      }
    }
  }
  
  // Also look for parenthetical text which often contains readable content
  const parentheticalRegex = /\([^)]{5,100}\)/g;
  let parentMatch;
  
  while ((parentMatch = parentheticalRegex.exec(content)) !== null) {
    const text = parentMatch[0]
      .replace(/[()]/g, '')
      .replace(/[^\w\s@.\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (text.length > 5 && /[a-zA-Z]/.test(text)) {
      extractedText += text + ' ';
    }
  }
  
  return extractedText.trim();
}

async function keywordBasedExtraction(buffer: Uint8Array): Promise<string> {
  // Try different encodings
  const encodings = ['utf-8', 'latin1', 'ascii'];
  let bestText = '';
  let maxScore = 0;
  
  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding, { fatal: false });
      const content = decoder.decode(buffer);
      
      let extractedText = '';
      
      // Look for email addresses
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = content.match(emailRegex);
      if (emails) {
        extractedText += emails.join(' ') + ' ';
      }
      
      // Look for phone numbers
      const phoneRegex = /[\+]?[1-9]?[\-\s]?\(?[0-9]{3}\)?[\-\s]?[0-9]{3}[\-\s]?[0-9]{4}/g;
      const phones = content.match(phoneRegex);
      if (phones) {
        extractedText += phones.join(' ') + ' ';
      }
      
      // Look for common resume words with context
      const resumeWords = [
        'experience', 'education', 'skills', 'work', 'employment',
        'university', 'college', 'degree', 'bachelor', 'master', 'phd',
        'manager', 'developer', 'engineer', 'analyst', 'consultant',
        'project', 'responsible', 'achieved', 'managed', 'developed'
      ];
      
      for (const word of resumeWords) {
        const contextRegex = new RegExp(`[\\w\\s@.\\-()]{0,50}${word}[\\w\\s@.\\-()]{0,50}`, 'gi');
        const matches = content.match(contextRegex);
        
        if (matches) {
          for (const match of matches) {
            const cleaned = match
              .replace(/[^\w\s@.\-()]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            if (cleaned.length > 10) {
              extractedText += cleaned + ' ';
            }
          }
        }
      }
      
      const score = scoreExtractedText(extractedText);
      if (score > maxScore) {
        maxScore = score;
        bestText = extractedText;
      }
    } catch (error) {
      continue;
    }
  }
  
  return bestText.trim();
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
