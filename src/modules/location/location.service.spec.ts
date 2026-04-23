/* eslint-disable @typescript-eslint/unbound-method */

import { HttpService } from '@nestjs/axios';
import {
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { LocationTestFactory } from '../../../test/factories/location-test.factory';
import { CacheService } from '../../common/services/cache.service';
import { encodeCursor } from '../../common/utils/cursor.util';
import { EnvService } from '../../config/env.service';
import { TOP_DESTINATIONS } from './constants/location.constants';
import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;
  let httpService: jest.Mocked<HttpService>;
  let cacheService: jest.Mocked<CacheService>;
  let requestObj: Record<string, unknown>;

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    httpService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<CacheService>;

    const envServiceMock = {
      geonamesBaseUrl: 'http://api.geonames.org',
      geonamesUsername: 'testuser',
    } as unknown as jest.Mocked<EnvService>;

    requestObj = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        { provide: HttpService, useValue: httpService },
        { provide: CacheService, useValue: cacheService },
        { provide: EnvService, useValue: envServiceMock },
        { provide: 'REQUEST', useValue: requestObj },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findTopDestinations', () => {
    it('should return a paginated list of top destinations', () => {
      const result = service.findTopDestinations(2, undefined);

      expect(result.data.length).toBe(2);
      expect(result.data[0].id).toBe(TOP_DESTINATIONS[0].id);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.hasNextPage).toBe(true);
    });

    it('should decode cursor correctly for pagination', () => {
      // Simulate that the cursor points to start index 1
      const cursor = encodeCursor({ start: 1 });
      const result = service.findTopDestinations(1, cursor);

      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe(TOP_DESTINATIONS[1].id);
    });
  });

  describe('findOne', () => {
    it('should return cached location if available and flag request obj', async () => {
      const mockLocation = LocationTestFactory.create();
      cacheService.get.mockResolvedValue(mockLocation);

      const result = await service.findOne('loc-123');

      expect(cacheService.get).toHaveBeenCalledWith('loc:loc-123');
      expect(httpService.get).not.toHaveBeenCalled();
      expect(requestObj['isCacheHit']).toBe(true);
      expect(result).toEqual(mockLocation);
    });

    it('should fetch from geonames, format, and cache on miss', async () => {
      cacheService.get.mockResolvedValue(null);

      const mockApiResponse = {
        geonameId: 123,
        name: 'City',
        countryName: 'Country',
        lat: '0.000',
        lng: '0.000',
      };

      httpService.get.mockReturnValue(
        of({ data: mockApiResponse } as unknown as AxiosResponse),
      );

      const result = await service.findOne('123');

      expect(httpService.get).toHaveBeenCalledWith(
        'http://api.geonames.org/getJSON',
        expect.any(Object),
      );
      expect(cacheService.set).toHaveBeenCalledWith(
        'loc:123',
        expect.any(Object),
        86_400_000,
      );
      expect(result.id).toBe('123');
    });

    it('should throw UnprocessableEntityException if geonames returns its specific API error object', async () => {
      cacheService.get.mockResolvedValue(null);
      httpService.get.mockReturnValue(
        of({
          data: { status: { message: 'Invalid ID', value: 14 } },
        } as unknown as AxiosResponse),
      );

      await expect(service.findOne('123')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should catch generic HTTP errors and throw ServiceUnavailableException', async () => {
      cacheService.get.mockResolvedValue(null);
      httpService.get.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      await expect(service.findOne('123')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('findOneByCoordinates', () => {
    it('should parse coordinates, fetch, and set cache', async () => {
      cacheService.get.mockResolvedValue(null);

      const mockApiResponse = {
        geonames: [
          {
            geonameId: 999,
            name: 'City',
            countryName: 'Country',
            lat: '40.71',
            lng: '-74.01',
          },
        ],
      };

      httpService.get.mockReturnValue(
        of({ data: mockApiResponse } as unknown as AxiosResponse),
      );

      const result = await service.findOneByCoordinates(40.7128, -74.006);

      expect(httpService.get).toHaveBeenCalledWith(
        'http://api.geonames.org/findNearbyPlaceNameJSON',
        expect.any(Object),
      );
      expect(result.id).toBe('999');
      // Cache key uses .toFixed(2) inside parseCoordinates, 40.71 and -74.01
      expect(cacheService.set).toHaveBeenCalledWith(
        'loc:40.71:-74.01',
        expect.any(Object),
        86_400_000,
      );
    });

    it('should return cached location if available and flag request obj', async () => {
      const mockLocation = LocationTestFactory.create();
      cacheService.get.mockResolvedValue(mockLocation);

      const result = await service.findOneByCoordinates(40.71, -74.01);

      expect(cacheService.get).toHaveBeenCalledWith('loc:40.71:-74.01');
      expect(httpService.get).not.toHaveBeenCalled();
      expect(requestObj['isCacheHit']).toBe(true);
      expect(result).toEqual(mockLocation);
    });

    it('should throw UnprocessableEntityException if geonames returns its specific API error object', async () => {
      cacheService.get.mockResolvedValue(null);
      httpService.get.mockReturnValue(
        of({
          data: { status: { message: 'GeoNames error', value: 14 } },
        } as unknown as AxiosResponse),
      );

      await expect(service.findOneByCoordinates(0, 0)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw ServiceUnavailableException on internal error', async () => {
      cacheService.get.mockResolvedValue(null);
      httpService.get.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      await expect(service.findOneByCoordinates(0, 0)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('findAllByQuery', () => {
    it('should fetch from searchJSON and format into PageDto', async () => {
      const mockApiResponse = {
        geonames: [
          { geonameId: 1, name: 'C1' },
          { geonameId: 2, name: 'C2' },
        ],
      };

      httpService.get.mockReturnValue(
        of({ data: mockApiResponse } as unknown as AxiosResponse),
      );

      const result = await service.findAllByQuery('York', 2);

      expect(httpService.get).toHaveBeenCalledWith(
        'http://api.geonames.org/searchJSON',
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          params: expect.objectContaining({
            name_startsWith: 'York',
            maxRows: 2,
          }),
        }),
      );
      expect(result.data.length).toBe(2);
      expect(result.meta.limit).toBe(2);
      expect(result.data[0].id).toBe('1');
    });

    it('should throw UnprocessableEntityException if API responds with rejection struct', async () => {
      httpService.get.mockReturnValue(
        of({
          data: { status: { message: 'GeoNames error' } },
        } as unknown as AxiosResponse),
      );

      await expect(service.findAllByQuery('York')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });
});
