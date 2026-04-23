import { Controller, Get, Param, Query } from '@nestjs/common';
import { PageDto } from '../../common/dtos/page.dto';
import { AccommodationService } from './accommodation.service';
import { FindAllAccommodationsDto } from './dtos/accommodation.dto';
import { Accommodation } from './entities/accommodation.entity';

@Controller('accommodations')
export class AccommodationController {
  constructor(private readonly accommodationService: AccommodationService) {}

  @Get()
  findAll(
    @Query() { locationId, limit, cursor, sortBy }: FindAllAccommodationsDto,
  ): Promise<PageDto<Accommodation>> {
    return this.accommodationService.findAll(locationId, limit, cursor, sortBy);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Accommodation> {
    return this.accommodationService.findOne(id);
  }
}
