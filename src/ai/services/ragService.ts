import { VectorStore } from '@ai';
import { openai } from '@ai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class RAGService {
  private static detectLanguage(text: string): 'ru' | 'en' | 'uk' {
    const ukrainianChars = /[іїєґ]/gi;
    const russianChars = /[а-яё]/gi;

    if (ukrainianChars.test(text)) return 'uk';
    if (russianChars.test(text)) return 'ru';
    return 'en';
  }

  static async query(question: string, systemPrompt = null) {
    try {
      const userQuestion = question + '?';

      // 1. Найти релевантные документы
      const similarDocs = await VectorStore.searchSimilar(userQuestion, 20);

      // 2. Создать контекст из найденных документов
      const context = similarDocs.map((doc) => doc.text).join('\n\n---\n\n');

      const detectedLanguage = this.detectLanguage(userQuestion);

      // 3. Создать промпт
      const defaultSystemPrompt = `
Вы - юридический консультант для водителей грузовиков. 
Отвечайте на основе предоставленного контекста.
Если информации недостаточно, скажите об этом честно.
Всегда ссылайтесь на конкретные правила и нормы.
Не используйте Markdown или какую либо стилизацию.
Разбивайте текст пукнтуацией и абзацами.
Контекст:
${context}
`;

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: systemPrompt || defaultSystemPrompt,
        },
        {
          role: 'system',
          content: `Respond in the same language as the user's question. Probable language of user: ${detectedLanguage}`,
        },
        {
          role: 'user',
          content: userQuestion,
        },
      ];

      // 4. Получить ответ от GPT
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-2025-04-14',
        messages,
        temperature: 0.1,
        max_completion_tokens: 800,
      });
      console.log(completion);
      console.log(completion.choices[0].message);
      return {
        answer: completion.choices[0].message.content,
        sources: similarDocs.map((doc) => ({
          text: String(doc.text).substring(0, 200) + '...',
          score: doc.score,
        })),
      };
    } catch (error) {
      console.error('Ошибка RAG:', error);
      throw error;
    }
  }
}
