import { Module } from '@nestjs/common';
import { AccommodationModule } from '../accommodation/accommodation.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [AccommodationModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
