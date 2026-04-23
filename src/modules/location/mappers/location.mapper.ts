import { GeonamesDto } from '../dtos/geonames.dto';
import { Location } from '../entities/location.entity';

export class LocationMapper {
  static toEntity(raw: GeonamesDto): Location {
    return {
      id: raw.geonameId.toString(),
      city: raw.toponymName,
      country: raw.countryName,
      lat: raw.lat,
      lng: raw.lng,
    };
  }
}
