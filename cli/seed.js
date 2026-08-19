const { PrismaClient } = require('@prisma/client');
const { genSaltSync, hashSync } = require('bcryptjs');
const path = require('path');
const fs = require('fs').promises;
const prisma = new PrismaClient();
const { mesiboService } = require("../dist/mesibo/services/")

async function extractCompanyNames(filePath) {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    return text.split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);
  } catch (error) {
    console.error("Ошибка чтения файла:", error);
    return [];
  }
}

async function insertCompanies(filePath) {
  const companyNames = await extractCompanyNames(filePath);

  if (companyNames.length === 0) {
    console.log("Нет данных для вставки.");
    return;
  }

  const data = companyNames.map(name => ({
    label: name,
    logo: null,
  }));

  try {
    await prisma.company.createMany({
      data,
      skipDuplicates: true,
    });
    console.log("Компании успешно добавлены!");
  } catch (error) {
    console.error("Ошибка при добавлении компаний в БД:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createChatsForCompanies() {
  try {
    const allCompanies = await prisma.company.findMany();
    for (const company of allCompanies) {
      await mesiboService.createChatForCompany(company)
    }
    console.log("Чаты для компаний успешно созданы!");
  } catch (error) {
    console.error("Ошибка при добавлении компаний в БД:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function exportDataToFile(fileName, data) {
  try {
    // const points = await prisma.point.findMany();

    const jsonData = JSON.stringify(data, null, 2);

    await fs.writeFile(`${fileName}.json`, jsonData, 'utf8');
    console.log('Data successfully exported to points.json');
  } catch (error) {
    console.error('Error exporting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function importPointsFromFile() {
  try {
    const fileContent = await fs.readFile('points.json', 'utf8');
    const points = JSON.parse(fileContent);

    if (!Array.isArray(points)) {
      throw new Error('Файл должен содержать массив точек.');
    }

    for (const point of points) {
      try {
        if ((await prisma.point.findFirst({ where: { origId: point.origId } }))) {
          continue;
        }
        await prisma.point.create({
          data: {
            origId: point.origId,
            type: point.type,
            name: point.name,
            address: point.address,
            longitude: point.longitude,
            latitude: point.latitude,
            number_of_parking_spots: point.number_of_parking_spots,
            number_of_bookable_spots: point.number_of_bookable_spots,
            verified: point.verified,
            reviews_count: point.reviews_count,
            reviews_rating: point.reviews_rating,
            icon_url: point.icon_url,
            slug: point.slug,
            bookable: point.bookable,
            price_per_night: point.price_per_night,
            security_rating: point.security_rating,
          },
        });

        // console.log(`Импортирован: ${point.name}`);
      } catch (e) {
        console.error(`Ошибка при импорте точки с origId=${point.origId}:`, e.message);
      }
    }

    console.log('✅ Импорт завершён');
  } catch (error) {
    console.error('❌ Ошибка при чтении файла или импорте:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function deletePoints() {
  const chatsToDelete = await prisma.chat.findMany({
    where: {
      typeId: 1
    },
    select: {
      mesiboId: true,
    },
  });

  const mesiboIds = chatsToDelete.map((chat) => chat.mesiboId);

  await prisma.pointReview.deleteMany({
    where: {
      point: {
        chatid: {
          in: mesiboIds,
        },
      },
    },
  });

  await prisma.point.deleteMany({
    where: {
      chatid: {
        in: mesiboIds,
      },
    },
  });

  return await prisma.chat.deleteMany({
    where: {
      mesiboId: {
        in: mesiboIds,
      },
    },
  });
}

async function createSectionsSubsections() {
  const sections = require("./sections.json");
  for (const section of sections) {
    const existingTranslation = await prisma.qSectionTranslation.findFirst({
      where: { title: { in: Object.values(section.name) } },
    });

    if (!existingTranslation) {
      const created = await prisma.qSection.create({
        data: {
          translations: {
            create: Object.entries(section.name).map(([lang, title]) => ({ lang, title })),
          },
          subsections: {
            create: section.subsections.map(sub => ({
              translations: {
                create: Object.entries(sub).map(([lang, title]) => ({ lang, title })),
              },
            })),
          },
        },
      });
      console.log(`Создана секция #${created.id}`);
    } else {
      for (const sub of section.subsections) {
        const subExists = await prisma.qSubsectionTranslation.findFirst({
          where: {
            title: { in: Object.values(sub) },
            subsection: { sectionId: existingTranslation.sectionId },
          },
        });
        if (!subExists) {
          await prisma.qSubsection.create({
            data: {
              sectionId: existingTranslation.sectionId,
              translations: {
                create: Object.entries(sub).map(([lang, title]) => ({ lang, title })),
              },
            },
          });
          console.log(`Создан подраздел "${Object.values(sub)[0]}" для секции #${existingTranslation.sectionId}`);
        }
      }
    }
  }
}

const bootstrap = async () => {
  // const companies = await prisma.company.findMany()
  // return await exportDataToFile("companies", companies)
  // await prisma.question.deleteMany()
  // await prisma.qSection.deleteMany()
  // await prisma.qSubsection.deleteMany()

  await createSectionsSubsections();

  await prisma.role.createMany({
    data: [
      { name: 'super_admin' },
      { name: 'admin' },
      { name: 'user' },
    ],
    skipDuplicates: true,
  });
  console.log("Роли созданы")

  await insertCompanies(path.join(process.cwd(), "cli", "Companys_list.txt"))
  await createChatsForCompanies();

};

bootstrap()
  .then(() => console.log('Seed done!'))
  .catch((e) => console.error(e));
