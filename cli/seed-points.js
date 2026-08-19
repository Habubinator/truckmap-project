const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const prisma = new PrismaClient();
const { mesiboService } = require("../dist/mesibo/services/");

// ============================================================================
// Function 1: Delete Old Points and Chats
// ============================================================================

async function deleteOldPointsAndChats() {
    console.log('🗑️  Удаление старых точек и чатов...');

    // Find all Point chats (typeId = 1)
    const pointChats = await prisma.chat.findMany({
        where: { typeId: 1 },
        select: { mesiboId: true }
    });

    console.log(`Найдено ${pointChats.length} чатов для удаления`);

    // Delete each chat from Mesibo API
    for (const chat of pointChats) {
        try {
            await mesiboService.deleteChat(chat.mesiboId);
            console.log(`✅ Удален чат Mesibo: ${chat.mesiboId}`);
        } catch (error) {
            console.error(`❌ Ошибка удаления чата ${chat.mesiboId}:`, error.message);
        }
    }

    // Delete reviews (just in case, cascade should handle this)
    const reviewsDeleted = await prisma.pointReview.deleteMany({
        where: {
            point: {
                chat: { typeId: 1 }
            }
        }
    });
    console.log(`Удалено ${reviewsDeleted.count} отзывов`);

    // Delete points (cascade will remove relations)
    const pointsDeleted = await prisma.point.deleteMany({
        where: {
            chat: { typeId: 1 }
        }
    });
    console.log(`Удалено ${pointsDeleted.count} точек`);

    // Delete chats from database
    const chatsDeleted = await prisma.chat.deleteMany({
        where: { typeId: 1 }
    });
    console.log(`Удалено ${chatsDeleted.count} чатов из БД`);

    console.log('✅ Очистка завершена\n');
}

// ============================================================================
// Function 2: Read GeoJSON File
// ============================================================================

async function readGeoJsonFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const geoJson = JSON.parse(content);

    if (!geoJson.features || !Array.isArray(geoJson.features)) {
        throw new Error(`Invalid GeoJSON structure in ${filePath}`);
    }

    return geoJson;
}

// ============================================================================
// Function 3: Create Point from Feature
// ============================================================================

async function createPointFromFeature(feature) {
    const { coordinates } = feature.geometry;
    const props = feature.properties;

    // Check if Point already exists
    const existing = await prisma.point.findFirst({
        where: { origId: String(props.id) }
    });

    if (existing) {
        console.log(`⚠️  Point уже существует: ${props.name} (origId: ${props.id})`);
        return existing;
    }

    // Create Point
    const point = await prisma.point.create({
        data: {
            origId: String(props.id),
            type: props.type || null,
            name: props.name || null,
            address: props.address || null,
            longitude: String(coordinates[0]),
            latitude: String(coordinates[1]),
            number_of_parking_spots: props.number_of_parking_spots || null,
            rchat: props.rchat || undefined, // PostgreSQL will use default 50
            // All other fields default to null
        }
    });

    console.log(`✅ Создана точка: ${point.name} (id: ${point.id})`);
    return point;
}

// ============================================================================
// Function 4: Create Chat for Point
// ============================================================================

async function createChatForPoint(point, feature) {
    try {
        // Call existing Mesibo service method
        const mesiboId = await mesiboService.createChatForPoint(feature);

        console.log(`✅ Создан чат для "${point.name}" (mesiboId: ${mesiboId})`);
        return mesiboId;
    } catch (error) {
        console.error(`❌ Ошибка создания чата для "${point.name}":`, error.message);
        throw error;
    }
}

// ============================================================================
// Function 5: Process All Parking Files
// ============================================================================

async function processAllParkingFiles() {
    const parkingsDir = path.join(__dirname, 'parkings');
    const files = await fs.readdir(parkingsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    console.log(`📁 Найдено ${jsonFiles.length} файлов GeoJSON\n`);

    const stats = {
        totalPoints: 0,
        totalChats: 0,
        errors: 0
    };

    for (const fileName of jsonFiles) {
        const filePath = path.join(parkingsDir, fileName);
        console.log(`\n📄 Обработка файла: ${fileName}`);

        try {
            // Read GeoJSON
            const geoJson = await readGeoJsonFile(filePath);
            console.log(`   Features: ${geoJson.features.length}`);

            // Process each feature
            for (const feature of geoJson.features) {
                try {
                    // 1. Create Point
                    const point = await createPointFromFeature(feature);
                    stats.totalPoints++;

                    // 2. Create Chat for Point
                    const mesiboId = await createChatForPoint(point, feature);
                    stats.totalChats++;

                    // 3. Update feature with mesiboId
                    feature.properties.mesiboId = mesiboId;

                } catch (error) {
                    console.error(`   ❌ Ошибка обработки feature ${feature.properties.id}:`, error.message);
                    stats.errors++;
                }
            }

            // Write updated file
            await fs.writeFile(
                filePath,
                JSON.stringify(geoJson, null, 2),
                'utf-8'
            );
            console.log(`✅ Файл обновлен: ${fileName}`);

        } catch (error) {
            console.error(`❌ Ошибка обработки файла ${fileName}:`, error);
            stats.errors++;
        }
    }

    return stats;
}

// ============================================================================
// Function 6: Bootstrap Main Function
// ============================================================================

async function bootstrap() {
    console.log('🚀 Начало миграции точек парковок\n');
    console.log('='.repeat(50));

    try {
        // 1. Delete old points and chats
        await deleteOldPointsAndChats();

        // 2. Process all files
        console.log('📦 Создание новых точек из GeoJSON файлов...\n');
        const stats = await processAllParkingFiles();

        // 3. Display statistics
        console.log('\n' + '='.repeat(50));
        console.log('📊 Статистика миграции:');
        console.log(`   ✅ Создано точек: ${stats.totalPoints}`);
        console.log(`   ✅ Создано чатов: ${stats.totalChats}`);
        console.log(`   ❌ Ошибок: ${stats.errors}`);
        console.log('='.repeat(50));
        console.log('\n✅ Миграция завершена!');
        console.log('📁 Обновленные файлы находятся в: cli/parkings/');
        console.log('🔄 Передайте эти файлы фронтенду для обновления');

    } catch (error) {
        console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// ============================================================================
// Execute Bootstrap
// ============================================================================

bootstrap()
    .then(() => console.log('\n👋 Готово!'))
    .catch((e) => {
        console.error('\n💥 Фатальная ошибка:', e);
        process.exit(1);
    });
