import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  FindAllLocationsByQueryDto,
  FindOneLocationByCoordinatesDto,
  FindTopDestinationsDto,
} from './dtos/location.dto';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('coordinates')
  findOneByCoordinates(@Query() { lat, lng }: FindOneLocationByCoordinatesDto) {
    return this.locationService.findOneByCoordinates(lat, lng);
  }

  @Get('search')
  findAllByQuery(@Query() { query, limit }: FindAllLocationsByQueryDto) {
    return this.locationService.findAllByQuery(query, limit);
  }

  @Get('top-destinations')
  findTopDestinations(@Query() { limit, cursor }: FindTopDestinationsDto) {
    return this.locationService.findTopDestinations(limit, cursor);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationService.findOne(id);
  }
}
