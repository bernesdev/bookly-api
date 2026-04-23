import { Type } from 'class-transformer';
import {
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class FindOneLocationByCoordinatesDto {
  @IsNotEmpty()
  @IsLatitude({ message: 'Invalid latitude (must be between -90 and 90)' })
  @Type(() => Number)
  readonly lat!: number;

  @IsNotEmpty()
  @IsLongitude({ message: 'Invalid longitude (must be between -180 and 180)' })
  @Type(() => Number)
  readonly lng!: number;
}

export class FindAllLocationsByQueryDto {
  @IsNotEmpty()
  @Type(() => String)
  readonly query!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  readonly limit: number = 10;
}

export class FindTopDestinationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  readonly limit: number = 10;

  @IsOptional()
  @Type(() => String)
  @IsString()
  readonly cursor?: string;
}
