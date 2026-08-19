import { prisma } from '@database';
import { HttpException } from '@common/exceptions';
import { ErrorCodes } from '@common/enums';
import axios from 'axios';

// ISO 3166-2 region code → regional tachograph alpha code
// Currently covers Spain (ES); extend for other countries as needed
const REGION_TACHOGRAPH_CODES: Record<string, string> = {
  'ES-AN': 'AN',  // Andalucía
  'ES-AR': 'AR',  // Aragón
  'ES-AS': 'AST', // Asturias
  'ES-CB': 'C',   // Cantabria
  'ES-CT': 'CAT', // Cataluña
  'ES-CL': 'CL',  // Castilla y León
  'ES-CM': 'CM',  // Castilla-La Mancha
  'ES-VC': 'CV',  // Valencia
  'ES-EX': 'EXT', // Extremadura
  'ES-GA': 'G',   // Galicia
  'ES-IB': 'IB',  // Baleares
  'ES-CN': 'IC',  // Canarias
  'ES-RI': 'LR',  // La Rioja
  'ES-MD': 'M',   // Madrid
  'ES-MC': 'MU',  // Murcia
  'ES-NC': 'NA',  // Navarra
  'ES-PV': 'PV',  // País Vasco
  'ES-CE': 'CE',  // Ceuta
  'ES-ML': 'ME',  // Melilla
};

class InfoService {
  async getCountries(lang: string) {
    const countries = await prisma.country.findMany({
      select: {
        isoCode: true,
        tachographCode: true,
        rules: {
          where: { lang },
          select: { name: true },
        },
      },
    });

    return countries
      .map((c) => ({
        isoCode: c.isoCode,
        tachographCode: c.tachographCode,
        name: c.rules[0]?.name ?? null,
      }))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }

  async getMyCountry(userId: number, lang: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { latitude: true, longitude: true },
    });

    if (!user?.latitude || !user?.longitude) {
      throw HttpException.BadRequest(ErrorCodes.BadRequest, 'User location is not set');
    }

    const lat = parseFloat(user.latitude);
    const lng = parseFloat(user.longitude);

    const { data } = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon: lng, format: 'json' },
      headers: { 'User-Agent': 'fleet-api' },
    });
    const address = data?.address ?? {};
    const isoCode = (address.country_code as string | undefined)?.toUpperCase();

    if (!isoCode) {
      throw HttpException.NotFound(ErrorCodes.NotFound, 'Could not determine country from location');
    }

    const country = await prisma.country.findUnique({
      where: { isoCode },
      include: {
        rules: {
          where: { lang },
          select: { name: true },
        },
      },
    });

    const regionCode: string | null = address['ISO3166-2-lvl4'] ?? null;

    return {
      isoCode,
      tachographCode: country?.tachographCode ?? null,
      regionTachographCode: regionCode ? (REGION_TACHOGRAPH_CODES[regionCode] ?? null) : null,
      name: country?.rules[0]?.name ?? null,
      country: address.country ?? null,
      state: address.state ?? null,
      regionCode,
    };
  }

  async getCountryRules(isoCode: string, lang: string) {
    const country = await prisma.country.findUnique({
      where: { isoCode },
      include: {
        rules: {
          where: { lang },
        },
      },
    });

    if (!country) {
      throw HttpException.NotFound(ErrorCodes.NotFound, `Country '${isoCode}' not found`);
    }

    let translation = country.rules[0] ?? null;

    // fallback to Russian if requested language is not available
    if (!translation && lang !== 'ru') {
      const fallback = await prisma.countryRuleTranslation.findUnique({
        where: { countryId_lang: { countryId: country.id, lang: 'ru' } },
      });
      translation = fallback ?? null;
    }

    return {
      isoCode: country.isoCode,
      tachographCode: country.tachographCode,
      name: translation?.name ?? null,
      lang: translation?.lang ?? null,
      rules: translation
        ? {
            roadPayment: translation.roadPayment,
            speedLimits: translation.speedLimits,
            axleLoad: translation.axleLoad,
            seatbelts: translation.seatbelts,
            trafficLights: translation.trafficLights,
            alcoholLimits: translation.alcoholLimits,
            drugDriving: translation.drugDriving,
            prohibitedLanes: translation.prohibitedLanes,
            helmet: translation.helmet,
            mobilePhone: translation.mobilePhone,
            specialRules: translation.specialRules,
          }
        : null,
    };
  }
}

export const infoService = new InfoService();
