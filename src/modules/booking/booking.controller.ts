import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PageDto } from '../../common/dtos/page.dto';
import type { User } from '../../common/entities/user.entity';
import { FirebaseGuard } from '../../common/guards/firebase.guard';
import { BookingService } from './booking.service';
import { CreateBookingDto, FindAllBookingsDto } from './dtos/booking.dto';
import { Booking } from './entities/booking.entity';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(FirebaseGuard)
  create(
    @CurrentUser() user: User,
    @Body() body: CreateBookingDto,
  ): Promise<Booking> {
    return this.bookingService.create(user.uid, body);
  }

  @Get()
  @UseGuards(FirebaseGuard)
  findAll(
    @CurrentUser() user: User,
    @Query() { limit, status, cursor }: FindAllBookingsDto,
  ): Promise<PageDto<Booking>> {
    return this.bookingService.findAll(user.uid, limit, status, cursor);
  }

  @Get(':id')
  @UseGuards(FirebaseGuard)
  findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<Booking> {
    return this.bookingService.findOne(id, user.uid);
  }
}
