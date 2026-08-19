export class GetCountriesDto {
  public readonly lang: string;
  constructor({ lang }: { lang?: string }) {
    this.lang = lang ?? 'en';
  }
}

export class GetCountryRulesDto {
  public readonly isoCode: string;
  public readonly lang: string;
  constructor({ isoCode, lang }: { isoCode: string; lang?: string }) {
    this.isoCode = isoCode.toUpperCase();
    this.lang = lang ?? 'en';
  }
}
