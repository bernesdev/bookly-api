import { Injectable } from '@nestjs/common';
import {
  ACCOMMODATION_AMENITIES,
  ACCOMMODATION_DESCRIPTIONS,
  ACCOMMODATION_IMAGES,
  ACCOMMODATION_PREFIXES,
  ACCOMMODATION_SUFFIXES,
  ADDRESS_NAMES,
  ADDRESS_SUFFIXES,
} from './constants/accommodation.contants';
import {
  Accommodation,
  AccommodationAmenity,
} from './entities/accommodation.entity';

@Injectable()
export class AccommodationFactory {
  generateFromSeed(
    locationId: string,
    lat: string,
    lng: string,
    city: string,
    country: string,
  ): Accommodation[] {
    const seed = `loc:${locationId}`;

    // Initialize the generator with the city name
    const random = this.createSeededRandom(seed);

    // Number of accommodations (between 5 and 20)
    const numberOfAccommodations = Math.floor(random() * 16) + 5;

    const accommodationImages = [...ACCOMMODATION_IMAGES];

    const accommodations: Accommodation[] = [];

    for (let i = 0; i < numberOfAccommodations; i++) {
      const pre =
        ACCOMMODATION_PREFIXES[
          Math.floor(random() * ACCOMMODATION_PREFIXES.length)
        ];
      const suf =
        ACCOMMODATION_SUFFIXES[
          Math.floor(random() * ACCOMMODATION_SUFFIXES.length)
        ];

      // Small coordinate offset to spread on the map (approx 4km)
      const latOffset = (random() - 0.5) * 0.04;
      const lngOffset = (random() - 0.5) * 0.04;

      // Price between 100 and 800
      const basePrice = Math.floor(random() * 700) + 100;

      // Old price 30 to 230 more than current price
      const oldPrice = basePrice + Math.floor(random() * 200) + 30;

      // 50% chance to have an old price
      const hasOldPrice = random() <= 0.5;

      // Randomly select 2 to 4 amenities from the list
      const amenities = this.generateAmenities(random);

      accommodations.push({
        id: `${locationId}-${i}`,
        name: `${pre} ${city} ${suf}`,
        price: {
          oldPrice: hasOldPrice ? oldPrice : undefined,
          currentPrice: basePrice,
          discount: hasOldPrice ? oldPrice - basePrice : undefined,
          discountPercentage: hasOldPrice
            ? Number((((oldPrice - basePrice) / oldPrice) * 100).toFixed(2))
            : undefined,
        },
        // Rating between 3.5 and 5.0 with one decimal place
        rating: (random() * 1.5 + 3.5).toFixed(1),
        // Randomly select an image from the list
        image: this.getRandomImage(random, accommodationImages),
        details: {
          beds: Math.floor(random() * 5) + 1, // 1 to 5 beds
          bathrooms: Math.floor(random() * 2) + 1, // 1 to 2 bathrooms
          hasBreakfast: amenities.some(
            (amenity) => amenity.id === ACCOMMODATION_AMENITIES[0].id,
          ),
          amenities: amenities,
          description: this.generateDescription(random),
        },
        location: {
          id: locationId,
          city,
          country,
          coordinates: {
            lat: parseFloat(lat) + latOffset,
            lng: parseFloat(lng) + lngOffset,
          },
          // Distance to city center in meters, between 0 and 1000m
          distanceToCenter: Math.floor(random() * 1000),
          address: {
            street: this.generateStreetName(random),
            number: (Math.floor(random() * 1000) + 1).toString(),
          },
        },
      });
    }

    return accommodations;
  }

  private createSeededRandom(seedString: string) {
    let seed = 0;

    for (let i = 0; i < seedString.length; i++) {
      seed =
        (seed + seedString.charCodeAt(i) * 2654435761) ^
        seedString.charCodeAt(i);
    }

    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private generateStreetName(random: () => number): string {
    const streetName =
      ADDRESS_NAMES[Math.floor(random() * ADDRESS_NAMES.length)];
    const streetSuffix =
      ADDRESS_SUFFIXES[Math.floor(random() * ADDRESS_SUFFIXES.length)];

    return `${streetName} ${streetSuffix}`;
  }

  private generateDescription(random: () => number): string {
    const descriptionCount = Math.floor(random() * 2) + 2; // 2 to 3 descriptions

    const selectedDescriptionIndexes = new Set<number>();

    while (selectedDescriptionIndexes.size < descriptionCount) {
      selectedDescriptionIndexes.add(
        Math.floor(random() * ACCOMMODATION_DESCRIPTIONS.length),
      );
    }

    const mergedDescription = [...selectedDescriptionIndexes]
      .map((index) => ACCOMMODATION_DESCRIPTIONS[index])
      .join(' ');

    return mergedDescription;
  }

  private getRandomImage(
    random: () => number,
    accommodationImages: string[],
  ): string {
    const index = Math.floor(random() * accommodationImages.length);
    const image = accommodationImages[index];
    accommodationImages.splice(index, 1);
    return image;
  }

  private generateAmenities(random: () => number): AccommodationAmenity[] {
    const serviceCount = Math.floor(random() * 3) + 2; // 2 to 4 amenities

    const selectedServiceIndexes = new Set<number>();

    while (selectedServiceIndexes.size < serviceCount) {
      selectedServiceIndexes.add(
        Math.floor(random() * ACCOMMODATION_AMENITIES.length),
      );
    }

    return [...selectedServiceIndexes].map(
      (index) => ACCOMMODATION_AMENITIES[index],
    );
  }
}
