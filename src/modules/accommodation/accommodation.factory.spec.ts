import { AccommodationFactory } from './accommodation.factory';

describe('AccommodationFactory', () => {
  let factory: AccommodationFactory;

  beforeEach(() => {
    factory = new AccommodationFactory();
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  describe('generateFromSeed', () => {
    it('should generate an array of accommodations deterministically based on seed', () => {
      const locationId = '1111111';
      const result1 = factory.generateFromSeed(
        locationId,
        '40.7128',
        '-74.0060',
        'New York',
        'USA',
      );
      const result2 = factory.generateFromSeed(
        locationId,
        '40.7128',
        '-74.0060',
        'New York',
        'USA',
      );

      // Given the same seed, the random results should be strictly identical
      expect(result1).toEqual(result2);
    });

    it('should generate between 5 and 20 accommodations per execution', () => {
      // Loop with different seeds to ensure length falls strictly in range
      for (let i = 0; i < 50; i++) {
        const result = factory.generateFromSeed(
          `2222222${i}`,
          '0',
          '0',
          'City',
          'Country',
        );
        expect(result.length).toBeGreaterThanOrEqual(5);
        expect(result.length).toBeLessThanOrEqual(20);
      }
    });

    it('should map the payload into each generated accommodation structure correctly', () => {
      const locationId = '1111111';
      const lat = '40.7128';
      const lng = '-74.0060';
      const city = 'New York';
      const country = 'USA';

      const result = factory.generateFromSeed(
        locationId,
        lat,
        lng,
        city,
        country,
      );

      expect(result.length).toBeGreaterThan(0);

      result.forEach((acc, index) => {
        expect(acc.id).toBe(`${locationId}-${index}`);
        expect(acc.name).toContain(city); // Name should include the city

        expect(acc.location.id).toBe(locationId);
        expect(acc.location.city).toBe(city);
        expect(acc.location.country).toBe(country);

        // Coordinates should be generated with slight offsets from base (checked up to 1 decimal point variation)
        expect(acc.location.coordinates.lat).toBeCloseTo(parseFloat(lat), 1);
        expect(acc.location.coordinates.lng).toBeCloseTo(parseFloat(lng), 1);
      });
    });

    it('should map discount logic and percentages correctly when an old price is randomly present', () => {
      const result = factory.generateFromSeed(
        '1111111',
        '0',
        '0',
        'City',
        'Country',
      );

      // Depending on the random logic, some will have a discount. Filter them out to test their logic.
      const accommodationsWithDiscount = result.filter(
        (acc) => acc.price.oldPrice !== undefined,
      );

      accommodationsWithDiscount.forEach((acc) => {
        const { currentPrice, oldPrice, discount, discountPercentage } =
          acc.price;

        expect(oldPrice).toBeDefined();
        // Since oldPrice is defined, using non-null assertion
        expect(oldPrice!).toBeGreaterThan(currentPrice);
        expect(discount).toBe(oldPrice! - currentPrice);

        // Calculate the actual expected discount
        const expectedPercentage = Number(
          (((oldPrice! - currentPrice) / oldPrice!) * 100).toFixed(2),
        );
        expect(discountPercentage).toBe(expectedPercentage);
      });
    });
  });
});
