import {
  Accommodation,
  AccommodationDetails,
  AccommodationLocation,
  AccommodationPrice,
} from '../../src/modules/accommodation/entities/accommodation.entity';

export type AccommodationOverrides = Omit<
  Partial<Accommodation>,
  'price' | 'location' | 'details'
> & {
  price?: Partial<AccommodationPrice>;
  location?: Partial<AccommodationLocation>;
  details?: Partial<AccommodationDetails>;
};

export class AccommodationTestFactory {
  static create(overrides?: AccommodationOverrides): Accommodation {
    const defaultPrice: AccommodationPrice = {
      currentPrice: 500,
      oldPrice: undefined,
      discount: undefined,
      discountPercentage: undefined,
      ...(overrides?.price || {}),
    };

    const defaultLocation: AccommodationLocation = {
      id: '1111111',
      city: 'City',
      country: 'Country',
      coordinates: { lat: 0, lng: 0 },
      address: { street: 'Street', number: '123' },
      distanceToCenter: 200,
      ...(overrides?.location || {}),
    };

    const defaultDetails: AccommodationDetails = {
      beds: 2,
      bathrooms: 1,
      hasBreakfast: true,
      amenities: [],
      description: 'Mock description',
      ...(overrides?.details || {}),
    };

    return {
      id: '1111111-0',
      name: 'Mock Accommodation',
      rating: '4.5',
      image: 'https://example.com/image.jpg',
      ...overrides,
      price: defaultPrice,
      details: defaultDetails,
      location: defaultLocation,
    };
  }

  static createMany(overridesList: AccommodationOverrides[]): Accommodation[] {
    return overridesList.map((overrides, index) =>
      this.create({
        id: `1111111-${index}`,
        ...overrides,
      }),
    );
  }
}
