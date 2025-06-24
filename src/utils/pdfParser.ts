
export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Simple PDF text extraction using basic parsing
        // This is a simplified approach - for production, you'd want a more robust solution
        const text = await parsePDFBuffer(uint8Array);
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

async function parsePDFBuffer(buffer: Uint8Array): Promise<string> {
  // Convert buffer to string for basic text extraction
  const decoder = new TextDecoder('utf-8');
  let text = decoder.decode(buffer);
  
  // Basic PDF text extraction - look for text between specific markers
  const textRegex = /BT\s*(.*?)\s*ET/gs;
  const matches = text.match(textRegex);
  
  if (matches) {
    let extractedText = '';
    matches.forEach(match => {
      // Remove PDF commands and extract readable text
      const cleanText = match
        .replace(/BT|ET/g, '')
        .replace(/\/\w+\s+\d+(\.\d+)?\s+Tf/g, '')
        .replace(/Td|TD|Tm|TJ|Tj/g, '')
        .replace(/\[\s*\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanText.length > 2) {
        extractedText += cleanText + ' ';
      }
    });
    return extractedText.trim();
  }
  
  // Fallback: try to extract any readable text
  const readableText = text
    .replace(/[^\x20-\x7E\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return readableText.length > 50 ? readableText : 'Unable to extract text from PDF';
}
