import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Booking } from '../entities/booking.entity';

export enum BookingStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export class CreateBookingDto {
  @IsNotEmpty()
  @Type(() => String)
  readonly accommodationId!: string;

  @IsNotEmpty()
  @Type(() => String)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  readonly checkIn!: string;

  @IsNotEmpty()
  @Type(() => String)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  readonly checkOut!: string;

  @IsNotEmpty()
  @Type(() => Number)
  readonly rooms!: number;

  @IsNotEmpty()
  @Type(() => Number)
  readonly adults!: number;

  @IsNotEmpty()
  @Type(() => Number)
  readonly children!: number;
}

export type BookingDto = Omit<Booking, 'id'>;

export class FindAllBookingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  readonly limit: number = 10;

  @IsOptional()
  @IsEnum(BookingStatus)
  readonly status: BookingStatus = BookingStatus.ACTIVE;

  @IsOptional()
  @Type(() => String)
  @IsString()
  readonly cursor?: string;
}
