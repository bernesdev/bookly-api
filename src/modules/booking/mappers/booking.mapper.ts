import { BadRequestException, Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Accommodation } from '../../accommodation/entities/accommodation.entity';
import { BookingDto, CreateBookingDto } from '../dtos/booking.dto';

dayjs.extend(customParseFormat);

@Injectable()
export class BookingMapper {
  static toEntity(
    dto: CreateBookingDto,
    accommodation: Accommodation,
  ): BookingDto {
    const checkIn = dayjs(dto.checkIn, 'YYYY-MM-DD', true);
    const checkOut = dayjs(dto.checkOut, 'YYYY-MM-DD', true);

    if (!checkIn.isValid() || !checkOut.isValid())
      throw new BadRequestException('Invalid dates');

    const nights = checkOut.startOf('day').diff(checkIn.startOf('day'), 'day');

    const totalPrice = accommodation.price.currentPrice * nights;
    const totalOldPrice = accommodation.price.oldPrice
      ? accommodation.price.oldPrice * nights
      : undefined;
    const totalDiscount = accommodation.price.discount
      ? accommodation.price.discount * nights
      : undefined;

    return {
      orderId: this.generateOrderId(),
      accommodation,
      nights,
      dates: {
        checkIn: checkIn.toDate(),
        checkInFormatted: checkIn.format('ddd, D MMM'),
        checkOut: checkOut.toDate(),
        checkOutFormatted: checkOut.format('ddd, D MMM'),
      },
      occupancy: {
        rooms: dto.rooms,
        adults: dto.adults,
        children: dto.children,
      },
      price: {
        oldTotalPrice: totalOldPrice,
        currentTotalPrice: totalPrice,
        totalDiscount: totalDiscount,
        discountPercentage: accommodation.price.discountPercentage,
      },
      createdAt: new Date(),
    };
  }

  private static generateOrderId() {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
  }
}
