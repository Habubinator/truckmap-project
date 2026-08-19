import cron from 'node-cron';
import 'dotenv/config';
import { prisma } from '@database';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface TrafficBanData {
  date: Date;
  country: string;
  timeString: string;
  detailsUrl?: string;
  additionalInfo?: string;
}

class TrafficBanParser {
  private readonly requestDelay = 1000;

  /**
   * Задержка между запросами для избежания блокировки
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Декодирует обфусцированный текст (если применимо)
   */
  private decodeObfuscatedText(text: string): string {
    // Попробуем различные методы декодирования

    // Метод 1: Base64 декодирование
    try {
      const base64Decoded = Buffer.from(text, 'base64').toString('utf-8');
      if (base64Decoded && !base64Decoded.includes('�')) {
        return base64Decoded;
      }
    } catch (_e) {
      // Игнорируем ошибки Base64
    }

    // Метод 2: URL декодирование
    try {
      const urlDecoded = decodeURIComponent(text);
      if (urlDecoded !== text) {
        return urlDecoded;
      }
    } catch (_e) {
      // Игнорируем ошибки URL декодирования
    }

    // Метод 3: Простая замена символов (если есть паттерн)
    let decoded = text;

    // Попробуем убрать общие обфусцирующие символы
    decoded = decoded.replace(/[^\w\s\-:,.]/g, '');

    // Если результат пустой, возвращаем оригинал
    if (!decoded.trim()) {
      return text;
    }

    return decoded;
  }

  /**
   * Выполняет HTTP запрос с обработкой ошибок и дополнительными заголовками
   */
  private async makeRequest(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        },
        timeout: 15000,
        validateStatus: (status) => status < 500, // Accept redirects
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Извлекает дополнительную информацию со страницы деталей
   */
  private async fetchAdditionalInfo(
    detailsUrl: string,
  ): Promise<string | null> {
    try {
      await this.delay(this.requestDelay);

      const html = await this.makeRequest(detailsUrl);
      if (!cheerio || typeof cheerio.load !== 'function') {
        console.error('Cheerio is not properly loaded');
        return null;
      }

      const $ = cheerio.load(html);

      // Ищем блок с дополнительной информацией
      const additionalInfoBlock = $('.ui.segment').filter((_index, element) => {
        const $element = $(element);
        return (
          $element.find('h5:contains("Additional information")').length > 0
        );
      });

      if (additionalInfoBlock.length > 0) {
        const h3Element = additionalInfoBlock.find('h3');
        if (h3Element.length > 0) {
          const $h3Clone = h3Element.clone();
          $h3Clone.find('i').remove();

          return $h3Clone.text().trim();
        }
      }

      return null;
    } catch (error) {
      console.error(
        `Failed to fetch additional info from ${detailsUrl}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Парсит дату из строки формата "2025-06-17, Вторник"
   */
  parseDate(dateString: string): Date {
    const dateMatch = dateString.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return new Date(dateMatch[1]);
    }
    throw new Error(`Cannot parse date from: ${dateString}`);
  }

  /**
   * Отладочная функция для сохранения HTML
   */
  private async saveHtmlForDebug(
    html: string,
    filename: string = 'debug.html',
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs').promises;
    try {
      await fs.writeFile(filename, html, 'utf-8');
      console.log(`HTML saved to ${filename} for debugging`);
    } catch (error) {
      console.error('Failed to save HTML for debugging:', error);
    }
  }

  /**
   * Парсит HTML и извлекает данные о транспортных ограничениях
   */
  async parseTrafficBans(
    html: string,
    fetchDetails: boolean = true,
  ): Promise<TrafficBanData[]> {
    if (!cheerio || typeof cheerio.load !== 'function') {
      throw new Error('Cheerio module is not loaded properly');
    }

    const $ = cheerio.load(html);
    const results: TrafficBanData[] = [];

    const dayBoxes = $('.onedaybox').toArray();

    for (let i = 0; i < dayBoxes.length; i++) {
      // Ограничиваем для отладки
      const dayBox = dayBoxes[i];
      const $dayBox = $(dayBox);

      // Отладка даты
      const dateElement = $dayBox.find('.bandate a');
      const dateText = dateElement.text().trim();

      if (!dateText) {
        console.log('No date found, skipping...');
        continue;
      }

      let date: Date;
      try {
        date = this.parseDate(dateText);
      } catch (error) {
        console.log('Date parsing failed:', error.message);
        continue;
      }

      // Отладка банбоксов
      const banBoxes = $dayBox.find('.banbox').toArray();

      for (let j = 0; j < banBoxes.length; j++) {
        // Ограничиваем для отладки
        const banBox = banBoxes[j];
        const $banBox = $(banBox);

        // Пробуем разные способы извлечения текста
        const allText = $banBox.text();

        // Попробуем извлечь страну и время различными способами
        const textNodes = $banBox
          .contents()
          .filter((_, elem) => elem.nodeType === 3);

        // Извлекаем данные (используем первый текстовый узел как страну, последний как время)
        let country = '';
        let timeString = '';

        if (textNodes.length >= 2) {
          country = textNodes.first().text().trim();
          timeString = textNodes.last().text().trim();
        } else if (textNodes.length === 1) {
          const fullText = textNodes.first().text().trim();
          // Попробуем разделить по пробелам или другим разделителям
          const parts = fullText.split(/\s+/);
          if (parts.length >= 2) {
            country = parts[0];
            timeString = parts[parts.length - 1];
          }
        } else {
          // Fallback: используем весь текст
          const parts = allText.trim().split(/\s+/);
          if (parts.length >= 2) {
            country = parts[0];
            timeString = parts[parts.length - 1];
          }
        }

        // Извлекаем URL деталей
        const detailsUrl = $banBox.attr('alt');

        const banData: TrafficBanData = {
          date: date,
          country: country,
          timeString: timeString,
          detailsUrl: detailsUrl || undefined,
        };

        if (fetchDetails && detailsUrl) {
          const additionalInfo = await this.fetchAdditionalInfo(detailsUrl);
          if (additionalInfo) {
            banData.additionalInfo = additionalInfo;
          }
        }

        if (banData.timeString.includes(';')) {
          for (const time of banData.timeString.split(';')) {
            results.push({
              ...banData,
              timeString: time.trim(),
            });
          }
        } else {
          results.push(banData);
        }
      }
    }

    return results;
  }

  /**
   * Загружает данные с URL, парсит их и сохраняет в базу данных
   */
  async fetchAndParse(url: string, fetchDetails: boolean = true): Promise<any> {
    try {
      console.log(`Fetching data from: ${url}`);
      const html = await this.makeRequest(url);

      console.log('Parsing traffic bans...');
      const parsedTrafficBans = await this.parseTrafficBans(html, fetchDetails);

      console.log(`Parsed ${parsedTrafficBans.length} traffic bans`);

      if (parsedTrafficBans.length === 0) {
        console.log('No traffic bans parsed. Check the HTML structure.');
        return { count: 0 };
      }

      // Выводим первые несколько результатов для проверки
      console.log('Sample results:');
      parsedTrafficBans.slice(0, 3).forEach((ban, idx) => {
        console.log(
          `${idx + 1}. ${ban.country} - ${ban.timeString} (${ban.date.toISOString().split('T')[0]})`,
        );
      });

      // Подготавливаем данные для вставки в базу
      const dataForDb = parsedTrafficBans.map((ban) => ({
        date: ban.date,
        country: ban.country,
        timeString: ban.timeString,
        detailsUrl: ban.detailsUrl,
        additionalInfo: ban.additionalInfo,
      }));

      // Вставляем новые данные
      const result = await prisma.traficBans.createMany({
        data: dataForDb,
        skipDuplicates: true,
      });

      console.log(`Saved ${result.count} records to database`);
      return result;
    } catch (error) {
      console.error('Error in fetchAndParse:', error);
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  }

  async parseFromString(
    htmlString: string,
    fetchDetails: boolean = true,
  ): Promise<TrafficBanData[]> {
    return this.parseTrafficBans(htmlString, fetchDetails);
  }

  async updateAdditionalInfo(): Promise<void> {
    try {
      const recordsToUpdate = await prisma.traficBans.findMany({
        where: {
          detailsUrl: { not: null },
          additionalInfo: null,
        },
      });

      for (const record of recordsToUpdate) {
        if (record.detailsUrl) {
          console.log(`Updating additional info for record ID: ${record.id}`);
          const additionalInfo = await this.fetchAdditionalInfo(
            record.detailsUrl,
          );
          if (additionalInfo) {
            await prisma.traficBans.update({
              where: { id: record.id },
              data: { additionalInfo },
            });
          }
        }
      }

      console.log('Finished updating additional information');
    } catch (error) {
      console.error('Error updating additional info:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<any> {
    try {
      const total = await prisma.traficBans.count();
      const withAdditionalInfo = await prisma.traficBans.count({
        where: { additionalInfo: { not: null } },
      });

      const countriesCount = await prisma.traficBans.groupBy({
        by: ['country'],
        _count: { country: true },
      });

      return {
        total,
        withAdditionalInfo,
        withoutAdditionalInfo: total - withAdditionalInfo,
        countriesCount: countriesCount.map((item) => ({
          country: item.country,
          count: item._count.country,
        })),
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }
}

export const traficBanParser = new TrafficBanParser();

export async function run(fetchDetails: boolean = true): Promise<void> {
  try {
    console.log('Starting traffic ban parsing...');
    await traficBanParser.fetchAndParse(
      'https://trafficban.com/plugins/box.html?language=en',
      fetchDetails,
    );

    console.log('Traffic ban parsing completed successfully!');
  } catch (error) {
    console.error('Error in run function:', error);
    throw error;
  }
}

export async function updateAdditionalInfo(): Promise<void> {
  try {
    console.log('Updating additional information...');
    await traficBanParser.updateAdditionalInfo();
    console.log('Additional information update completed!');
  } catch (error) {
    console.error('Error updating additional info:', error);
    throw error;
  }
}

export async function runQuick(): Promise<void> {
  return run(false);
}

if (process.env.RUNPARSER === '1') {
  run().catch(console.error);
}

cron.schedule('0 3 * * *', () => {
  console.log('Scheduled daily run...');
  run().catch(console.error);
});
