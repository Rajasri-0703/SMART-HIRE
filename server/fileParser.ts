import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export interface ExtractedResumeFile {
  filename: string;
  fileType: string;
  fileSizeBytes: number;
  text: string;
  error?: string;
}

export async function parseResumeFile(
  filename: string,
  buffer: Buffer,
  mimetype?: string
): Promise<string> {
  const lowerName = filename.toLowerCase();

  if (!buffer || buffer.length === 0) {
    throw new Error('Uploaded file is completely empty (0 bytes).');
  }

  // 1. Text or Markdown files
  if (
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.md') ||
    lowerName.endsWith('.rtf') ||
    mimetype === 'text/plain'
  ) {
    const raw = buffer.toString('utf-8').trim();
    if (raw.length < 20) {
      throw new Error('File contains insufficient textual content (under 20 characters).');
    }
    return raw;
  }

  // 2. Word documents (.docx)
  if (
    lowerName.endsWith('.docx') ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      if (!text || text.length < 20) {
        throw new Error('DOCX document contains no readable text content.');
      }
      return text;
    } catch (err: any) {
      throw new Error(`Failed to read DOCX resume: ${err.message || 'Corrupted DOCX document'}`);
    }
  }

  // 3. PDF documents (.pdf)
  if (lowerName.endsWith('.pdf') || mimetype === 'application/pdf') {
    try {
      const parser = new PDFParse({ data: buffer });
      const parsedDoc = await parser.getText();
      const text = (typeof parsedDoc === 'string' ? parsedDoc : parsedDoc?.text || '').trim();
      if (!text || text.length < 20) {
        // Fallback: try regex scanning in raw buffer for ascii strings if stream decompression is empty
        const asciiMatches = buffer.toString('latin1').match(/[A-Za-z0-9@.\s]{4,}/g) || [];
        const rawExtracted = asciiMatches.join(' ').trim();
        if (rawExtracted.length > 50) {
          return rawExtracted;
        }
        throw new Error('PDF file appears empty, encrypted, or contains only scanned images without OCR text.');
      }
      return text;
    } catch (err: any) {
      // In case of parser error, check if it's text embedded
      throw new Error(`Failed to parse PDF document: ${err.message || 'Corrupted PDF file'}`);
    }
  }

  // Unsupported format
  throw new Error(`Unsupported file format "${filename}". Allowed formats: PDF (.pdf), Word (.docx), Plain Text (.txt).`);
}
