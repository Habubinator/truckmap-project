import fs from 'fs';
import path from 'path';
import { DocumentProcessor } from '@ai';
import { VectorStore } from '@ai';
import { isPrimaryProcess } from '@onlynices/utils';

async function loadDocumentsFromFolder(folderPath) {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const ext = path.extname(file).toLowerCase();

    console.log(`Обрабатываем файл: ${file}`);

    try {
      let text: string;
      let documentType: string;

      if (ext === '.pdf') {
        text = await DocumentProcessor.readPDF(filePath);
        documentType = 'pdf';
      } else if (ext === '.docx') {
        text = await DocumentProcessor.readDOCX(filePath);
        documentType = 'docx';
      } else if (ext === '.txt') {
        text = fs.readFileSync(filePath, 'utf8');
        documentType = 'txt';
      } else {
        console.log(`Пропускаем файл ${file} - неподдерживаемый формат`);
        continue;
      }

      const chunks = DocumentProcessor.chunkText(text);

      await VectorStore.upsertDocument(chunks, {
        filename: file,
        documentType,
        uploadDate: new Date().toISOString(),
      });

      console.log(`✅ Загружен ${file} (${chunks.length} чанков)`);
    } catch (error) {
      console.error(`❌ Ошибка при обработке ${file}:`, error.message);
    }
  }
}

// Запуск скрипта
if (isPrimaryProcess()) {
  console.log('Подгружаем новые файлы в модель');
  loadDocumentsFromFolder('./documents')
    .then(() => console.log('Все документы загружены!'))
    .catch(console.error);
} else {
  console.log('Пропускаем загрузку файлов в модель ии');
}
