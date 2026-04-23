/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import {
  DestinationTestFactory,
  LocationTestFactory,
} from '../../../test/factories/location-test.factory';
import { PageMetaDto } from '../../common/dtos/page-meta.dto';
import { PageDto } from '../../common/dtos/page.dto';
import { Destination, Location } from './entities/location.entity';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

describe('LocationController', () => {
  let controller: LocationController;
  let service: jest.Mocked<LocationService>;

  beforeEach(async () => {
    const mockLocationService = {
      findOneByCoordinates: jest.fn(),
      findAllByQuery: jest.fn(),
      findTopDestinations: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
    service = module.get(LocationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOneByCoordinates', () => {
    it('should call LocationService.findOneByCoordinates with correct Lat and Lng and return a location', async () => {
      const mockLocation = LocationTestFactory.create();
      service.findOneByCoordinates.mockResolvedValue(mockLocation);

      const query = { lat: 40.7128, lng: -74.006 };
      const result = await controller.findOneByCoordinates(query);

      expect(service.findOneByCoordinates).toHaveBeenCalledWith(
        query.lat,
        query.lng,
      );
      expect(result).toBe(mockLocation);
    });
  });

  describe('findAllByQuery', () => {
    it('should call LocationService.findAllByQuery with correct arguments and return paginated locations', async () => {
      const mockLocations = [
        LocationTestFactory.create({ id: '1' }),
        LocationTestFactory.create({ id: '2' }),
      ];
      const mockPaginated = new PageDto<Location>(
        mockLocations,
        new PageMetaDto({ itemCount: mockLocations.length, limit: 10 }),
      );

      service.findAllByQuery.mockResolvedValue(mockPaginated);

      const query = { query: 'New York', limit: 10 };
      const result = await controller.findAllByQuery(query);

      expect(service.findAllByQuery).toHaveBeenCalledWith(
        query.query,
        query.limit,
      );
      expect(result).toBe(mockPaginated);
    });
  });

  describe('findTopDestinations', () => {
    it('should call LocationService.findTopDestinations with limit and cursor, returning paginated top locations', () => {
      const mockDestinations = [DestinationTestFactory.create()];

      const mockPaginated = new PageDto<Destination>(
        mockDestinations,
        new PageMetaDto({ itemCount: mockDestinations.length, limit: 15 }),
      );

      service.findTopDestinations.mockReturnValue(mockPaginated);

      const query = { limit: 15, cursor: 'fake-cursor' };
      const result = controller.findTopDestinations(query);

      expect(service.findTopDestinations).toHaveBeenCalledWith(
        query.limit,
        query.cursor,
      );
      expect(result).toBe(mockPaginated);
    });
  });

  describe('findOne', () => {
    it('should call LocationService.findOne with correct id and return the location', async () => {
      const mockLocation = LocationTestFactory.create({ id: 'loc-999' });
      service.findOne.mockResolvedValue(mockLocation);

      const result = await controller.findOne(mockLocation.id);

      expect(service.findOne).toHaveBeenCalledWith(mockLocation.id);
      expect(result).toBe(mockLocation);
    });
  });
});
