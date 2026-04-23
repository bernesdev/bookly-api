import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PageMetaDto } from '../../common/dtos/page-meta.dto';
import { PageDto } from '../../common/dtos/page.dto';
import { CacheService } from '../../common/services/cache.service';
import { decodeCursor } from '../../common/utils/cursor.util';
import { isNonNegativeNumber } from '../../common/utils/validators.utils';
import { LocationService } from '../location/location.service';
import { AccommodationFactory } from './accommodation.factory';
import { AccommodationSort } from './dtos/accommodation.dto';
import { Accommodation } from './entities/accommodation.entity';

@Injectable()
export class AccommodationService {
  private static readonly ACCOMMODATION_CACHE_TTL = 86_400_000; // 24 hours

  constructor(
    private readonly locationService: LocationService,
    private readonly accommodationFactory: AccommodationFactory,
    private readonly cacheService: CacheService,
    @Inject(REQUEST) private request: Request,
  ) {}

  async findAll(
    locationId: string,
    limit: number = 10,
    cursor: string | undefined,
    sortBy: AccommodationSort | undefined,
  ): Promise<PageDto<Accommodation>> {
    const cacheKey = `acc:${locationId}`;

    let accommodations = await this.cacheService.get<Accommodation[]>(cacheKey);

    if (accommodations) {
      this.request['isCacheHit'] = true;
    } else {
      const { city, country, lat, lng } =
        await this.locationService.findOne(locationId);

      accommodations = this.accommodationFactory.generateFromSeed(
        locationId,
        lat,
        lng,
        city,
        country,
      );

      await this.cacheService.set(
        cacheKey,
        accommodations,
        AccommodationService.ACCOMMODATION_CACHE_TTL,
      );
    }

    if (sortBy) {
      accommodations.sort((a, b) => {
        if (sortBy === AccommodationSort.PRICE_ASC) {
          return a.price.currentPrice - b.price.currentPrice;
        } else if (sortBy === AccommodationSort.PRICE_DESC) {
          return b.price.currentPrice - a.price.currentPrice;
        } else if (sortBy === AccommodationSort.DISTANCE) {
          return a.location.distanceToCenter - b.location.distanceToCenter;
        }

        return 0;
      });
    }

    const start = cursor
      ? decodeCursor({ cursor, schema: { start: isNonNegativeNumber } }).start
      : 0;

    const paginated = accommodations.slice(start, start + limit);

    const nextIndex = start + limit;

    const nextCursor =
      nextIndex < accommodations.length ? { start: nextIndex } : undefined;

    return new PageDto(
      paginated,
      new PageMetaDto({
        limit,
        itemCount: accommodations.length,
        nextCursor,
      }),
    );
  }

  async findOne(id: string): Promise<Accommodation> {
    const [locationId] = id.split('-');

    const cacheKey = `acc:${locationId}`;

    let accommodations = await this.cacheService.get<Accommodation[]>(cacheKey);

    if (accommodations) {
      this.request['isCacheHit'] = true;
    } else {
      const { city, country, lat, lng } =
        await this.locationService.findOne(locationId);

      accommodations = this.accommodationFactory.generateFromSeed(
        locationId,
        lat,
        lng,
        city,
        country,
      );

      await this.cacheService.set(
        cacheKey,
        accommodations,
        AccommodationService.ACCOMMODATION_CACHE_TTL,
      );
    }

    const accommodation = accommodations.find((acc) => acc.id === id);

    if (!accommodation) {
      throw new BadRequestException('Accommodation not found');
    }

    return accommodation;
  }
}
