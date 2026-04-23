/* eslint-disable @typescript-eslint/unbound-method */

import { BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AccommodationTestFactory } from '../../../test/factories/accommodation-test.factory';
import { LocationTestFactory } from '../../../test/factories/location-test.factory';
import { CacheService } from '../../common/services/cache.service';
import { encodeCursor } from '../../common/utils/cursor.util';
import { LocationService } from '../location/location.service';
import { AccommodationFactory } from './accommodation.factory';
import { AccommodationService } from './accommodation.service';
import { AccommodationSort } from './dtos/accommodation.dto';
import { Accommodation } from './entities/accommodation.entity';

describe('AccommodationService', () => {
  let service: AccommodationService;
  let cacheService: jest.Mocked<CacheService>;
  let locationService: jest.Mocked<LocationService>;
  let requestObj: Record<string, unknown>;

  // Utilize a getter to consistently provide a fresh array for mutations (like sorting)
  const getMockData = (): Accommodation[] => {
    return AccommodationTestFactory.createMany([
      { price: { currentPrice: 500 }, location: { distanceToCenter: 200 } },
      { price: { currentPrice: 100 }, location: { distanceToCenter: 500 } },
      { price: { currentPrice: 300 }, location: { distanceToCenter: 100 } },
    ]);
  };

  beforeEach(async () => {
    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<CacheService>;

    locationService = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<LocationService>;

    requestObj = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccommodationService,
        { provide: CacheService, useValue: cacheService },
        { provide: LocationService, useValue: locationService },
        AccommodationFactory, // Usando a factory real
        { provide: REQUEST, useValue: requestObj },
      ],
    }).compile();

    service = module.get<AccommodationService>(AccommodationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return accommodations from cache and inject cache metadata flag if hit', async () => {
      const data = getMockData();
      cacheService.get.mockResolvedValue(data);

      const result = await service.findAll('1111111', 10, undefined, undefined);

      expect(cacheService.get).toHaveBeenCalledWith('acc:1111111');
      expect(locationService.findOne).not.toHaveBeenCalled();
      expect(requestObj['isCacheHit']).toBe(true);
      expect(result.data.length).toBe(3);
      expect(result.meta.itemCount).toBe(3);
    });

    it('should fallback to locationService and factory if cache misses, updating cache', async () => {
      cacheService.get.mockResolvedValue(null);
      locationService.findOne.mockResolvedValue(
        LocationTestFactory.create({ id: '1111111' }),
      );

      const result = await service.findAll('1111111', 10, undefined, undefined);

      expect(cacheService.get).toHaveBeenCalledWith('acc:1111111');
      expect(locationService.findOne).toHaveBeenCalledWith('1111111');
      expect(cacheService.set).toHaveBeenCalledWith(
        'acc:1111111',
        expect.any(Array),
        86_400_000,
      );
      expect(result.data.length).toBeGreaterThan(0);
      expect(requestObj['isCacheHit']).toBeUndefined();
    });

    it('should correctly paginate results when boundaries are encoded and requested', async () => {
      const data = getMockData();
      cacheService.get.mockResolvedValue(data);

      // Setup a cursor matching the start index 1, and request a limit of 1 item
      const cursorObj = { start: 1 };
      const cursorStr = encodeCursor(cursorObj);

      const result = await service.findAll('1111111', 1, cursorStr, undefined);

      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('1111111-1');

      expect(result.meta.hasNextPage).toBe(true);

      const expectedNextCursor = encodeCursor({ start: 2 });
      expect(result.meta.nextCursor).toBe(expectedNextCursor);
    });

    it('should decode cursor correctly if passed', async () => {
      const data = getMockData();
      cacheService.get.mockResolvedValue(data);

      const cursor = encodeCursor({ start: 2 });

      const result = await service.findAll('1111111', 1, cursor, undefined);

      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('1111111-2');
    });

    it('should return undefined nextCursor if fetched items are less than limit', async () => {
      const data = getMockData();
      cacheService.get.mockResolvedValue(data);

      const cursor = encodeCursor({ start: 2 });

      const result = await service.findAll('1111111', 10, cursor, undefined);

      expect(result.meta.nextCursor).toBeUndefined();
    });

    it('should generate nextCursor payload if there are more items to fetch', async () => {
      const data = getMockData();
      cacheService.get.mockResolvedValue(data);

      const result = await service.findAll('1111111', 1, undefined, undefined);

      expect(result.meta.nextCursor).toBeDefined();
      expect(result.meta.nextCursor).toBe(encodeCursor({ start: 1 }));
    });

    it('should sort results correctly by PRICE_ASC (100 -> 300 -> 500)', async () => {
      const data = getMockData();
      cacheService.get.mockResolvedValue(data);

      const result = await service.findAll(
        '1111111',
        10,
        undefined,
        AccommodationSort.PRICE_ASC,
      );

      expect(result.data[0].price.currentPrice).toBe(100);
      expect(result.data[1].price.currentPrice).toBe(300);
      expect(result.data[2].price.currentPrice).toBe(500);
    });

    it('should sort results correctly by PRICE_DESC (500 -> 300 -> 100)', async () => {
      const data = getMockData();
      cacheService.get.mockResolvedValue(data);

      const result = await service.findAll(
        '1111111',
        10,
        undefined,
        AccommodationSort.PRICE_DESC,
      );

      expect(result.data[0].price.currentPrice).toBe(500);
      expect(result.data[1].price.currentPrice).toBe(300);
      expect(result.data[2].price.currentPrice).toBe(100);
    });

    it('should sort results correctly by DISTANCE (100 -> 200 -> 500)', async () => {
      const data = getMockData();
      cacheService.get.mockResolvedValue(data);

      const result = await service.findAll(
        '1111111',
        10,
        undefined,
        AccommodationSort.DISTANCE,
      );

      expect(result.data[0].location.distanceToCenter).toBe(100);
      expect(result.data[1].location.distanceToCenter).toBe(200);
      expect(result.data[2].location.distanceToCenter).toBe(500);
    });
  });

  describe('findOne', () => {
    it('should return accommodation seamlessly from cache loop', async () => {
      const data = getMockData();
      cacheService.get.mockResolvedValue(data);

      const result = await service.findOne('1111111-1');

      expect(cacheService.get).toHaveBeenCalledWith('acc:1111111');
      expect(locationService.findOne).not.toHaveBeenCalled();
      expect(requestObj['isCacheHit']).toBe(true);
      expect(result.id).toBe('1111111-1');
    });

    it('should fallback to factory if cache misses, returning the explicitly requested item id', async () => {
      cacheService.get.mockResolvedValue(null);
      locationService.findOne.mockResolvedValue(
        LocationTestFactory.create({ id: '1111111' }),
      );

      const result = await service.findOne('1111111-0');

      expect(cacheService.get).toHaveBeenCalledWith('acc:1111111');
      expect(locationService.findOne).toHaveBeenCalledWith('1111111');
      expect(cacheService.set).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('1111111-0');
    });

    it('should throw BadRequestException if accommodation is non-existent within payload result', async () => {
      const data = getMockData();
      cacheService.get.mockResolvedValue(data);

      await expect(service.findOne('1111111-999')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
