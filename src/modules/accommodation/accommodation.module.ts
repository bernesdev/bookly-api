import { Module } from '@nestjs/common';
import { LocationModule } from '../location/location.module';
import { AccommodationController } from './accommodation.controller';
import { AccommodationFactory } from './accommodation.factory';
import { AccommodationService } from './accommodation.service';

@Module({
  imports: [LocationModule],
  controllers: [AccommodationController],
  providers: [AccommodationService, AccommodationFactory],
  exports: [AccommodationService],
})
export class AccommodationModule {}
