import { Router } from 'express';
import { aiController } from '@ai/controllers';
import { auth } from '@auth/middlewares';
import { uploadSingleFile } from '@common/middlewares';

export const aiRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatRequest:
 *       type: object
 *       required:
 *         - question
 *       properties:
 *         question:
 *           type: string
 *           description: Вопрос пользователя
 *           example: "Какие требования к рабочему времени водителя в ЕС?"
 *         systemPrompt:
 *           type: string
 *           description: Кастомный системный промпт (опционально)
 *           example: "Отвечай кратко и по делу"
 *
 *     ChatResponse:
 *       type: object
 *       properties:
 *         answer:
 *           type: string
 *           description: Ответ AI на вопрос
 *           example: "Согласно Регламенту ЕС 561/2006, водитель должен..."
 *         sources:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Фрагмент исходного документа
 *               score:
 *                 type: number
 *                 description: Показатель релевантности (0-1)
 *                 example: 0.85
 *
 *     SearchRequest:
 *       type: object
 *       required:
 *         - query
 *       properties:
 *         query:
 *           type: string
 *           description: Поисковый запрос
 *           example: "тахограф"
 *         limit:
 *           type: integer
 *           description: Максимальное количество результатов
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *           example: 5
 *
 *     SearchResult:
 *       type: object
 *       properties:
 *         text:
 *           type: string
 *           description: Найденный текст
 *         score:
 *           type: number
 *           description: Показатель релевантности
 *           example: 0.92
 *         metadata:
 *           type: object
 *           properties:
 *             filename:
 *               type: string
 *               example: "pdd_eu.pdf"
 *             documentType:
 *               type: string
 *               example: "pdf"
 *             chunkIndex:
 *               type: integer
 *               example: 15
 *
 *     UploadDocumentRequest:
 *       type: object
 *       properties:
 *         filePath:
 *           type: string
 *           description: Путь к файлу (если загружается по пути)
 *           example: "/uploads/documents/pdd_2024.pdf"
 *         documentType:
 *           type: string
 *           enum: [pdf, docx, txt]
 *           description: Тип документа
 *           example: "pdf"
 *         text:
 *           type: string
 *           description: Текст документа (если передается напрямую)
 *         metadata:
 *           type: object
 *           description: Дополнительные метаданные документа
 *           properties:
 *             category:
 *               type: string
 *               example: "ПДД"
 *             country:
 *               type: string
 *               example: "EU"
 *             version:
 *               type: string
 *               example: "2024"
 *
 *     UploadDocumentResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Документ успешно загружен"
 *         chunksCount:
 *           type: integer
 *           description: Количество фрагментов, на которые разбит документ
 *           example: 125
 *
 *     APIResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Статус выполнения запроса
 *         data:
 *           type: object
 *           description: Данные ответа
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Описание ошибки
 */

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Задать вопрос AI-консультанту
 *     description: Отправляет вопрос AI-системе с контекстом из базы знаний и получает экспертный ответ по юридическим вопросам для водителей
 *     tags:
 *       - AI Assistant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *           examples:
 *             basic_question:
 *               summary: Базовый вопрос
 *               value:
 *                 question: "Сколько часов может работать водитель без перерыва?"
 *             custom_prompt:
 *               summary: Вопрос с кастомным промптом
 *               value:
 *                 question: "Расскажи про штрафы за превышение рабочего времени"
 *                 systemPrompt: "Отвечай очень кратко, только цифры и суммы"
 *     responses:
 *       "200":
 *         description: Успешный ответ AI-консультанта
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ChatResponse'
 *             examples:
 *               success_response:
 *                 summary: Успешный ответ
 *                 value:
 *                   success: true
 *                   data:
 *                     answer: "Согласно Регламенту ЕС 561/2006, водитель может управлять транспортным средством не более 9 часов в день (можно увеличить до 10 часов не более 2 раз в неделю). После 4,5 часов непрерывного вождения обязателен перерыв не менее 45 минут."
 *                     sources:
 *                       - text: "Статья 7 Регламента 561/2006: Ежедневное время вождения не должно превышать 9 часов..."
 *                         score: 0.94
 *                       - text: "Перерывы в вождении: После периода вождения 4,5 часа водитель должен..."
 *                         score: 0.87
 *       "400":
 *         description: Неверный запрос
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Поле 'question' обязательно для заполнения"
 *       "401":
 *         description: Не авторизован
 *       "500":
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
aiRouter.post('/chat', aiController.chat);

/**
 * @swagger
 * /api/ai/search:
 *   post:
 *     summary: Поиск в базе знаний
 *     description: Выполняет семантический поиск по загруженным документам без генерации ответа
 *     tags:
 *       - AI Assistant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SearchRequest'
 *           examples:
 *             simple_search:
 *               summary: Простой поиск
 *               value:
 *                 query: "тахограф"
 *                 limit: 5
 *             detailed_search:
 *               summary: Детальный поиск
 *               value:
 *                 query: "правила перевозки опасных грузов"
 *                 limit: 10
 *     responses:
 *       "200":
 *         description: Результаты поиска
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SearchResult'
 *             examples:
 *               search_results:
 *                 summary: Результаты поиска
 *                 value:
 *                   success: true
 *                   data:
 *                     - text: "Тахограф - контрольное устройство, которое автоматически записывает..."
 *                       score: 0.95
 *                       metadata:
 *                         filename: "tachograph_manual.pdf"
 *                         documentType: "pdf"
 *                         chunkIndex: 3
 *                     - text: "Использование тахографа обязательно для всех коммерческих транспортных средств..."
 *                       score: 0.89
 *                       metadata:
 *                         filename: "eu_regulations.docx"
 *                         documentType: "docx"
 *                         chunkIndex: 12
 *       "400":
 *         description: Неверный запрос
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       "401":
 *         description: Не авторизован
 *       "500":
 *         description: Внутренняя ошибка сервера
 */
aiRouter.post('/search', auth, aiController.search);

/**
 * @swagger
 * /api/ai/upload-document:
 *   post:
 *     summary: Загрузить документ в базу знаний
 *     description: Загружает и обрабатывает документ (PDF, DOCX или текст) для добавления в базу знаний AI
 *     tags:
 *       - AI Assistant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Файл документа (PDF или DOCX)
 *               documentType:
 *                 type: string
 *                 enum: [pdf, docx, txt]
 *                 description: Тип документа
 *               metadata:
 *                 type: string
 *                 description: JSON строка с метаданными документа
 *                 example: '{"category": "ПДД", "country": "EU", "version": "2024"}'
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UploadDocumentRequest'
 *           examples:
 *             file_path_upload:
 *               summary: Загрузка по пути к файлу
 *               value:
 *                 filePath: "/uploads/pdd_eu_2024.pdf"
 *                 documentType: "pdf"
 *                 metadata:
 *                   category: "ПДД"
 *                   country: "EU"
 *                   version: "2024"
 *             text_upload:
 *               summary: Загрузка текста напрямую
 *               value:
 *                 text: "Статья 1. Общие положения..."
 *                 documentType: "txt"
 *                 metadata:
 *                   category: "Законодательство"
 *                   source: "manual_input"
 *     responses:
 *       "200":
 *         description: Документ успешно загружен и обработан
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UploadDocumentResponse'
 *             examples:
 *               upload_success:
 *                 summary: Успешная загрузка
 *                 value:
 *                   success: true
 *                   data:
 *                     message: "Документ успешно загружен"
 *                     chunksCount: 45
 *       "400":
 *         description: Неверный запрос или неподдерживаемый формат файла
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_file:
 *                 summary: Неподдерживаемый формат
 *                 value:
 *                   success: false
 *                   error: "Неподдерживаемый тип документа. Поддерживаются: PDF, DOCX, TXT"
 *               missing_content:
 *                 summary: Отсутствует контент
 *                 value:
 *                   success: false
 *                   error: "Необходимо указать либо filePath, либо text"
 *       "401":
 *         description: Не авторизован
 *       "413":
 *         description: Файл слишком большой
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Размер файла превышает допустимый лимит (10MB)"
 *       "500":
 *         description: Ошибка при обработке документа
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               processing_error:
 *                 summary: Ошибка обработки
 *                 value:
 *                   success: false
 *                   error: "Ошибка при обработке PDF файла: поврежденный файл"
 *               vector_db_error:
 *                 summary: Ошибка векторной БД
 *                 value:
 *                   success: false
 *                   error: "Ошибка при сохранении в векторную базу данных"
 */
aiRouter.post(
  '/upload-document',
  auth,
  uploadSingleFile('documents', 'document'),
  aiController.uploadDocument,
);
