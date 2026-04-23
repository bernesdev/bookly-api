export interface GeonamesDto {
  geonameId: number;
  toponymName: string;
  countryCode: string;
  name: string;
  countryName: string;
  lat: string;
  lng: string;
}

export interface GeonamesResultDto {
  totalResultsCount: number | null;
  geonames: GeonamesDto[];
}

export interface GeonamesErrorDto {
  status: {
    message: string;
    value: number;
  };
}

export type GeonamesResponse = GeonamesResultDto | GeonamesErrorDto;
