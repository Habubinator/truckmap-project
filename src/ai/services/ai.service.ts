import { DocumentProcessor, VectorStore, RAGService } from '@ai';
import { AuthorizedRequest } from '@auth/types';
import '@ai/scripts';
class AIService {
  async loadDocument(req: AuthorizedRequest) {
    try {
      const { filePath, documentType, metadata } = req.body;

      let text;
      if (documentType === 'pdf') {
        text = await DocumentProcessor.readPDF(filePath);
      } else if (documentType === 'docx') {
        text = await DocumentProcessor.readDOCX(filePath);
      } else {
        text = req.body.text;
      }

      const chunks = DocumentProcessor.chunkText(text);
      await VectorStore.upsertDocument(chunks, metadata);

      return {
        message: 'Документ успешно загружен',
        chunksCount: chunks.length,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  async search(req: AuthorizedRequest) {
    try {
      const { query, limit = 5 } = req.body;

      const results = await VectorStore.searchSimilar(query, limit);

      return results;
    } catch (error) {
      throw new Error(error);
    }
  }

  async chat(req: AuthorizedRequest) {
    try {
      const { question, systemPrompt } = req.body;

      const result = await RAGService.query(question, systemPrompt);

      return result;
    } catch (error) {
      throw new Error(error);
    }
  }
}

export const aiService = new AIService();
