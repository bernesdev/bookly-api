import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum AccommodationSort {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  DISTANCE = 'distance',
}

export class FindAllAccommodationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  readonly limit: number = 10;

  @IsOptional()
  @IsEnum(AccommodationSort)
  readonly sortBy?: AccommodationSort;

  @IsOptional()
  @Type(() => String)
  @IsString()
  readonly cursor?: string;

  @IsNotEmpty()
  @Type(() => String)
  readonly locationId!: string;
}
