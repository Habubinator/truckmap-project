const { PrismaClient } = require('@prisma/client');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mapping from Russian country name (as in CSV) to ISO 3166-1 alpha-2 code
const NAME_TO_ISO = {
  'Австрия': 'AT',
  'Бельгия': 'BE',
  'Болгария': 'BG',
  'Хорватия': 'HR',
  'Кипр': 'CY',
  'Чехия': 'CZ',
  'Дания': 'DK',
  'Эстония': 'EE',
  'Финляндия': 'FI',
  'Франция': 'FR',
  'Германия': 'DE',
  'Греция': 'GR',
  'Венгрия': 'HU',
  'Ирландия': 'IE',
  'Италия': 'IT',
  'Латвия': 'LV',
  'Лихтенштейн': 'LI',
  'Литва': 'LT',
  'Люксембург': 'LU',
  'Мальта': 'MT',
  'Нидерланды': 'NL',
  'Норвегия': 'NO',
  'Польша': 'PL',
  'Португалия': 'PT',
  'Румыния': 'RO',
  'Словакия': 'SK',
  'Словения': 'SI',
  'Испания': 'ES',
  'Швеция': 'SE',
  'Албания': 'AL',
  'Турция': 'TR',
  'Швейцария': 'CH',
  'Великобритания': 'GB',
  'Сербия': 'RS',
  'Босния и Герцеговина': 'BA',
  'Македония': 'MK',
  'Черногория': 'ME',
  'Молдова': 'MD',
  'Андорра': 'AD',
};

const TARGET_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'cs', name: 'Czech' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'hr', name: 'Croatian' },
  { code: 'it', name: 'Italian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'ro', name: 'Romanian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'uk', name: 'Ukrainian' },
];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field.trim());
        field = '';
      } else if (ch === '\r' && text[i + 1] === '\n') {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (ch === '\n') {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
    i++;
  }
  if (field || row.length) {
    row.push(field.trim());
    rows.push(row);
  }
  return rows;
}

function normalizeTachographCode(raw) {
  // Extract just the code part (e.g. "E + Регион" → "E", "AND\n..." → "AND")
  const first = raw.split(/[\s\n+]/)[0].trim();
  return first || raw.substring(0, 5).trim();
}

function rowToRuRules(row) {
  return {
    name:            row[0] || null,
    roadPayment:     row[2] || null,
    speedLimits:     row[3] || null,
    axleLoad:        row[4] || null,
    seatbelts:       row[5] || null,
    trafficLights:   row[6] || null,
    alcoholLimits:   row[7] || null,
    drugDriving:     row[8] || null,
    prohibitedLanes: row[9] || null,
    helmet:          row[10] || null,
    mobilePhone:     row[11] || null,
    specialRules:    row[12] || null,
  };
}

async function translateRules(rulesRu, langCode, langName) {
  const prompt = `Translate the following trucking regulation fields from Russian to ${langName}.
Return ONLY a valid JSON object with exactly these keys: name, roadPayment, speedLimits, axleLoad, seatbelts, trafficLights, alcoholLimits, drugDriving, prohibitedLanes, helmet, mobilePhone, specialRules.
Preserve all numbers, units of measurement, and technical terms accurately.
If a source field is null, return null for that field.

Source (Russian):
${JSON.stringify(rulesRu, null, 2)}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const csvPath = path.join(__dirname, 'country_info.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(content);
  const dataRows = rows.slice(1).filter((r) => r[0]); // skip header, skip empty

  console.log(`Parsed ${dataRows.length} countries from CSV`);

  // Step 1: Upsert Country records and insert Russian translations
  console.log('\n--- Step 1: Seeding Russian data ---');
  const countries = [];
  for (const row of dataRows) {
    const nameRu = row[0];
    const isoCode = NAME_TO_ISO[nameRu];
    if (!isoCode) {
      console.warn(`  [SKIP] No ISO mapping for: "${nameRu}"`);
      continue;
    }

    const tachographCode = normalizeTachographCode(row[1]);
    const ruRules = rowToRuRules(row);

    const country = await prisma.country.upsert({
      where: { isoCode },
      update: { tachographCode },
      create: { isoCode, tachographCode },
    });

    await prisma.countryRuleTranslation.upsert({
      where: { countryId_lang: { countryId: country.id, lang: 'ru' } },
      update: ruRules,
      create: { countryId: country.id, lang: 'ru', ...ruRules },
    });

    console.log(`  [RU] ${nameRu} (${isoCode})`);
    countries.push({ country, ruRules });
  }

  console.log(`\nSeeded ${countries.length} countries with Russian rules.`);

  // Step 2: AI translations for all other languages
  console.log('\n--- Step 2: AI translation to 18 languages ---');
  for (const { code: langCode, name: langName } of TARGET_LANGUAGES) {
    console.log(`\n[${langCode}] Translating to ${langName}...`);
    for (const { country, ruRules } of countries) {
      try {
        const translated = await translateRules(ruRules, langCode, langName);
        await prisma.countryRuleTranslation.upsert({
          where: { countryId_lang: { countryId: country.id, lang: langCode } },
          update: translated,
          create: { countryId: country.id, lang: langCode, ...translated },
        });
        process.stdout.write('.');
        // Small delay to respect rate limits
        await sleep(200);
      } catch (err) {
        console.error(`\n  [ERROR] ${country.isoCode} → ${langCode}: ${err.message}`);
      }
    }
    console.log(' done');
  }

  console.log('\n\nSeeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
