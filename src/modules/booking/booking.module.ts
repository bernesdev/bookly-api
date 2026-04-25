import { Module } from '@nestjs/common';
import { AccommodationModule } from '../accommodation/accommodation.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingErrorHandler } from './exceptions/booking-error.handler';

@Module({
  imports: [AccommodationModule],
  controllers: [BookingController],
  providers: [BookingService, BookingErrorHandler],
})
export class BookingModule {}
