import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { REQUEST } from '@nestjs/core';
import { firstValueFrom } from 'rxjs';
import { PageMetaDto } from '../../common/dtos/page-meta.dto';
import { PageDto } from '../../common/dtos/page.dto';
import { CacheService } from '../../common/services/cache.service';
import { parseCoordinates } from '../../common/utils/coordinates.util';
import { decodeCursor } from '../../common/utils/cursor.util';
import { isNonNegativeNumber } from '../../common/utils/validators.utils';
import { EnvService } from '../../config/env.service';
import { TOP_DESTINATIONS } from './constants/location.constants';
import { GeonamesDto, GeonamesResponse } from './dtos/geonames.dto';
import { Destination, Location } from './entities/location.entity';
import { LocationMapper } from './mappers/location.mapper';
import { isGeonamesError } from './utils/geonames.utils';

@Injectable()
export class LocationService {
  private static readonly LOCATION_CACHE_TTL = 86_400_000; // 24 hours

  private readonly baseUrl: string;
  private readonly username: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly envService: EnvService,
    private readonly cacheService: CacheService,
    @Inject(REQUEST) private request: Request,
  ) {
    this.baseUrl = this.envService.geonamesBaseUrl;
    this.username = this.envService.geonamesUsername;
  }

  findTopDestinations(
    limit: number = 10,
    cursor: string | undefined,
  ): PageDto<Destination> {
    const destinations = [...TOP_DESTINATIONS];

    const start = cursor
      ? decodeCursor({ cursor, schema: { start: isNonNegativeNumber } }).start
      : 0;

    const paginated = destinations.slice(start, start + limit);

    const nextIndex = start + limit;

    const nextCursor =
      nextIndex < destinations.length ? { start: nextIndex } : undefined;

    return new PageDto(
      paginated,
      new PageMetaDto({
        limit,
        itemCount: destinations.length,
        nextCursor,
      }),
    );
  }

  async findOne(id: string): Promise<Location> {
    try {
      const cacheKey = `loc:${id}`;

      const cached = await this.cacheService.get<Location>(cacheKey);

      if (cached) {
        this.request['isCacheHit'] = true;
        return cached;
      }

      const { data } = await firstValueFrom(
        this.httpService.get<GeonamesDto>(`${this.baseUrl}/getJSON`, {
          params: {
            geonameId: id,
            username: this.username,
          },
        }),
      );

      if (isGeonamesError(data)) {
        throw new UnprocessableEntityException({
          message: 'GeoNames rejected the request',
          externalMessage: data.status.message,
          externalCode: data.status.value,
        });
      }

      const location = LocationMapper.toEntity(data);

      await this.cacheService.set(
        cacheKey,
        location,
        LocationService.LOCATION_CACHE_TTL,
      );

      return location;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new ServiceUnavailableException(
        'Location service is temporarily unavailable',
      );
    }
  }

  async findOneByCoordinates(lat: number, lng: number): Promise<Location> {
    try {
      const { lat: parsedLat, lng: parsedLng } = parseCoordinates(lat, lng);

      const cacheKey = `loc:${parsedLat.toFixed(2)}:${parsedLng.toFixed(2)}`;

      const cached = await this.cacheService.get<Location>(cacheKey);

      if (cached) {
        this.request['isCacheHit'] = true;
        return cached;
      }

      const { data } = await firstValueFrom(
        this.httpService.get<GeonamesResponse>(
          `${this.baseUrl}/findNearbyPlaceNameJSON`,
          {
            params: {
              lat: parsedLat,
              lng: parsedLng,
              cities: 'cities1000',
              username: this.username,
            },
          },
        ),
      );

      if (isGeonamesError(data)) {
        throw new UnprocessableEntityException({
          message: 'GeoNames rejected the request',
          externalMessage: data.status.message,
          externalCode: data.status.value,
        });
      }

      const location = LocationMapper.toEntity(data.geonames[0]);

      await this.cacheService.set(
        cacheKey,
        location,
        LocationService.LOCATION_CACHE_TTL,
      );

      return location;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new ServiceUnavailableException(
        'Location service is temporarily unavailable',
      );
    }
  }

  async findAllByQuery(
    query: string,
    limit: number = 10,
  ): Promise<PageDto<Location>> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<GeonamesResponse>(`${this.baseUrl}/searchJSON`, {
          params: {
            name_startsWith: query,
            featureClass: 'P',
            cities: 'cities1000',
            maxRows: limit,
            username: this.username,
          },
        }),
      );

      if (isGeonamesError(data)) {
        throw new UnprocessableEntityException({
          message: 'GeoNames rejected the query',
          externalMessage: data.status.message,
          externalCode: data.status.value,
        });
      }

      const locations = data.geonames.map((item) =>
        LocationMapper.toEntity(item),
      );

      return new PageDto(
        locations,
        new PageMetaDto({
          itemCount: locations.length,
          limit,
        }),
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new ServiceUnavailableException(
        'Location service is temporarily unavailable',
      );
    }
  }
}
