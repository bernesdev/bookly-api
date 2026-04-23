import { Accommodation } from '../../accommodation/entities/accommodation.entity';

export interface Booking {
  id: string;
  orderId: string;
  accommodation: Accommodation;
  dates: BookingDates;
  occupancy: BookingOccupancy;
  price: BookingPrice;
  nights: number;
  createdAt: Date;
}

export interface BookingDates {
  checkIn: Date;
  checkInFormatted: string;
  checkOut: Date;
  checkOutFormatted: string;
}

export interface BookingOccupancy {
  rooms: number;
  adults: number;
  children: number;
}

export interface BookingPrice {
  oldTotalPrice: number | undefined;
  currentTotalPrice: number;
  totalDiscount: number | undefined;
  discountPercentage: number | undefined;
}
