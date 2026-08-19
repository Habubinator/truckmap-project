import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export class DocumentProcessor {
  // Чтение PDF файлов
  static async readPDF(filePath) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);
    return data.text;
  }

  // Чтение DOCX файлов
  static async readDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  // Разбивка текста на чанки
  static chunkText(text, maxLength = 1000, overlap = 100) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxLength;

      // Найти конец предложения в пределах чанка
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const cutPoint = Math.max(lastPeriod, lastNewline);

        if (cutPoint > start + maxLength * 0.5) {
          end = cutPoint + 1;
        }
      }

      chunks.push({
        text: text.slice(start, end).trim(),
        start,
        end: Math.min(end, text.length),
      });

      start = end - overlap;
    }

    return chunks;
  }
}
