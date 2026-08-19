import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { Pinecone } from '@pinecone-database/pinecone';

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

async function clearDatabase() {
  try {
    console.log('🗑️ Очищаем базу данных...');

    // Получаем статистику до очистки
    const statsBefore = await index.describeIndexStats();
    console.log(`📊 Векторов до очистки: ${statsBefore.totalRecordCount}`);

    if (statsBefore.totalRecordCount === 0) {
      console.log('✅ База уже пуста!');
      return;
    }

    // Удаляем все векторы
    await index.deleteAll();
    console.log('🧹 Команда удаления отправлена...');

    // Ждем завершения
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        const statsAfter = await index.describeIndexStats();

        if (statsAfter.totalRecordCount === 0) {
          console.log('✅ База данных успешно очищена!');
          return;
        }

        console.log(`⏳ Осталось векторов: ${statsAfter.totalRecordCount}`);
      } catch (error) {
        console.log('⏳ Проверяем статус...', error);
      }

      attempts++;
    }

    console.log('⚠️ Превышено время ожидания, но очистка может продолжаться');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

// Запуск
clearDatabase();
