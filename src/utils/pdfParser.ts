
export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Improved PDF text extraction
        const text = await parsePDFBuffer(uint8Array);
        
        // Clean and validate the extracted text
        const cleanedText = cleanExtractedText(text);
        
        if (cleanedText.length < 100) {
          reject(new Error('Could not extract sufficient readable text from PDF'));
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

async function parsePDFBuffer(buffer: Uint8Array): Promise<string> {
  // Convert buffer to string for text extraction
  const decoder = new TextDecoder('latin1'); // Use latin1 for better PDF compatibility
  let pdfContent = decoder.decode(buffer);
  
  let extractedText = '';
  
  // Method 1: Extract text between BT/ET (BeginText/EndText) markers
  const textRegex = /BT\s*(.*?)\s*ET/gs;
  const textMatches = pdfContent.match(textRegex);
  
  if (textMatches) {
    textMatches.forEach(match => {
      // Clean up PDF commands and extract readable text
      let cleanText = match
        .replace(/BT|ET/g, '')
        .replace(/\/\w+\s+\d+(\.\d+)?\s+Tf/g, '') // Remove font commands
        .replace(/\d+(\.\d+)?\s+\d+(\.\d+)?\s+Td/g, '') // Remove positioning commands
        .replace(/\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?\s+Tm/g, '') // Remove matrix commands
        .replace(/\[(.*?)\]\s*TJ/g, '$1') // Extract text from TJ commands
        .replace(/\((.*?)\)\s*Tj/g, '$1') // Extract text from Tj commands
        .replace(/\\(\d{3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8))) // Convert octal chars
        .replace(/\\\\/g, '\\')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .trim();
      
      if (cleanText.length > 2) {
        extractedText += cleanText + ' ';
      }
    });
  }
  
  // Method 2: Look for stream objects containing text
  const streamRegex = /stream\s*(.*?)\s*endstream/gs;
  const streamMatches = pdfContent.match(streamRegex);
  
  if (streamMatches) {
    streamMatches.forEach(stream => {
      const streamContent = stream.replace(/stream|endstream/g, '').trim();
      
      // Try to extract readable text from streams
      const readableText = streamContent
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Keep only printable ASCII
        .replace(/\s+/g, ' ')
        .trim();
      
      if (readableText.length > 10 && /[a-zA-Z]{3,}/.test(readableText)) {
        extractedText += readableText + ' ';
      }
    });
  }
  
  // Method 3: Fallback - extract any readable text patterns
  if (extractedText.length < 100) {
    const fallbackText = pdfContent
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Keep only printable ASCII
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(word => word.length > 2 && /^[a-zA-Z0-9@.\-_]+$/.test(word))
      .join(' ');
    
    if (fallbackText.length > extractedText.length) {
      extractedText = fallbackText;
    }
  }
  
  return extractedText.trim();
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s@.\-()]/g, ' ') // Keep only word chars, spaces, email chars, and common punctuation
    .replace(/\b\w{1,2}\b/g, ' ') // Remove very short words (likely artifacts)
    .replace(/\s+/g, ' ') // Normalize whitespace again
    .trim();
}
