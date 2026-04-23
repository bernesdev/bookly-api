import {
  Booking,
  BookingDates,
  BookingOccupancy,
  BookingPrice,
} from '../../src/modules/booking/entities/booking.entity';
import { AccommodationTestFactory } from './accommodation-test.factory';
import { Accommodation } from '../../src/modules/accommodation/entities/accommodation.entity';

export type BookingOverrides = Omit<
  Partial<Booking>,
  'dates' | 'occupancy' | 'price' | 'accommodation'
> & {
  dates?: Partial<BookingDates>;
  occupancy?: Partial<BookingOccupancy>;
  price?: Partial<BookingPrice>;
  accommodation?: Partial<Accommodation>;
};

export class BookingTestFactory {
  static create(overrides?: BookingOverrides): Booking {
    const defaultDates: BookingDates = {
      checkIn: new Date('2026-05-01T12:00:00Z'),
      checkInFormatted: '01 May 2026',
      checkOut: new Date('2026-05-05T12:00:00Z'),
      checkOutFormatted: '05 May 2026',
      ...(overrides?.dates || {}),
    };

    const defaultOccupancy: BookingOccupancy = {
      rooms: 1,
      adults: 2,
      children: 0,
      ...(overrides?.occupancy || {}),
    };

    const defaultPrice: BookingPrice = {
      currentTotalPrice: 800,
      oldTotalPrice: undefined,
      totalDiscount: undefined,
      discountPercentage: undefined,
      ...(overrides?.price || {}),
    };

    const defaultAccommodation = AccommodationTestFactory.create(
      overrides?.accommodation as any,
    );

    return {
      id: 'book-123',
      orderId: 'ORDER-123',
      nights: 4,
      createdAt: new Date('2026-04-20T10:00:00Z'),
      ...overrides,
      dates: defaultDates,
      occupancy: defaultOccupancy,
      price: defaultPrice,
      accommodation: defaultAccommodation,
    };
  }

  static createMany(overridesList: BookingOverrides[]): Booking[] {
    return overridesList.map((overrides, index) =>
      this.create({
        id: `book-${index}`,
        orderId: `ORDER-${index}`,
        ...overrides,
      }),
    );
  }
}
