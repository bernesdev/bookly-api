import {
  Destination,
  Location,
} from '../../src/modules/location/entities/location.entity';

export class LocationTestFactory {
  static create(overrides?: Partial<Location>): Location {
    return {
      id: '1111111',
      city: 'City',
      country: 'Country',
      lat: '0',
      lng: '0',
      ...overrides,
    };
  }
}

export class DestinationTestFactory {
  static create(overrides?: Partial<Destination>): Destination {
    return {
      id: '2222222',
      city: 'Top City',
      country: 'Top Country',
      image: 'https://example.com/dest.jpg',
      ...overrides,
    };
  }
}
