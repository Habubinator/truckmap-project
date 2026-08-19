import { openai, index } from '@ai';
import crypto from 'crypto';
export class VectorStore {
  // Создание embedding для текста
  static async createEmbedding(
    text: string | string[] | number[] | number[][],
  ) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1024,
    });

    return response.data[0].embedding;
  }

  // Загрузка документа в векторную БД
  static async upsertDocument(chunks, metadata = {}) {
    const vectors = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await this.createEmbedding(chunk.text);

      vectors.push({
        id: crypto.randomUUID(),
        values: embedding,
        metadata: {
          text: chunk.text,
          chunkIndex: i,
          startPos: chunk.start,
          endPos: chunk.end,
          ...metadata,
        },
      });

      // Загружаем батчами по 100
      if (vectors.length === 100 || i === chunks.length - 1) {
        await index.upsert(vectors);
        console.log(`Загружено ${vectors.length} векторов`);
        vectors.length = 0; // Очищаем массив
      }
    }
  }

  // Поиск похожих векторов
  static async searchSimilar(query, topK = 5) {
    const queryEmbedding = await this.createEmbedding(query);

    const searchResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      includeValues: false,
    });

    return searchResponse.matches.map((match) => ({
      text: match.metadata.text,
      score: match.score,
      metadata: match.metadata,
    }));
  }
}
