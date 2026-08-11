import { extractText as extractPdfText } from 'unpdf';
import { createWorker } from 'tesseract.js';

export async function extractTextFromFile(buffer: Buffer, fileType: string): Promise<string> {
  let extractedText = '';

  if (fileType === 'application/pdf') {
    try {
      const pdfResult = await extractPdfText(buffer);
      if (pdfResult && pdfResult.text) {
        let textStr = '';
        if (Array.isArray(pdfResult.text)) {
          textStr = pdfResult.text.map((pageText, idx) => `[Page ${idx + 1}]\n${pageText}`).join('\n\n');
        } else {
          textStr = pdfResult.text;
        }
        if (textStr.trim().length > 50) {
          extractedText = textStr.trim();
          console.log(`[PDF Extraction] Extracted ${extractedText.length} characters via unpdf with page markers`);
          return cleanText(extractedText);
        }
      }
      console.log('[PDF Extraction] Digital text scarce (<50 chars), falling back to Tesseract OCR...');
    } catch (err) {
      console.warn('[PDF Extraction] unpdf failed, falling back to Tesseract OCR:', err);
    }
  }

  // Fallback / direct OCR for images and scanned PDFs using Tesseract.js
  console.log('[OCR] Initializing Tesseract.js worker...');
  const worker = await createWorker('eng');
  try {
    const ret = await worker.recognize(buffer);
    extractedText = ret.data.text || '';
    console.log(`[OCR Extraction] Extracted ${extractedText.length} characters via Tesseract OCR`);
  } finally {
    await worker.terminate();
  }

  return cleanText(extractedText);
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}
