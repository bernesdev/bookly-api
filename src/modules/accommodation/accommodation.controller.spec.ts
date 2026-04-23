/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { AccommodationTestFactory } from '../../../test/factories/accommodation-test.factory';
import { PageMetaDto } from '../../common/dtos/page-meta.dto';
import { PageDto } from '../../common/dtos/page.dto';
import { AccommodationController } from './accommodation.controller';
import { AccommodationService } from './accommodation.service';
import {
  AccommodationSort,
  FindAllAccommodationsDto,
} from './dtos/accommodation.dto';
import { Accommodation } from './entities/accommodation.entity';

describe('AccommodationController', () => {
  let controller: AccommodationController;
  let service: jest.Mocked<AccommodationService>;

  beforeEach(async () => {
    const mockAccommodationService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccommodationController],
      providers: [
        {
          provide: AccommodationService,
          useValue: mockAccommodationService,
        },
      ],
    }).compile();

    controller = module.get<AccommodationController>(AccommodationController);
    service = module.get(AccommodationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call AccommodationService.findAll with correct arguments and return paginated result', async () => {
      const mockData = AccommodationTestFactory.createMany([{}, {}, {}]);
      const mockResult = new PageDto<Accommodation>(
        mockData,
        new PageMetaDto({ itemCount: mockData.length, limit: 10 }),
      );

      service.findAll.mockResolvedValue(mockResult);

      const query = {
        locationId: '1111111',
        limit: 10,
        cursor: 'startCursor',
        sortBy: AccommodationSort.PRICE_ASC,
      };

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(
        query.locationId,
        query.limit,
        query.cursor,
        query.sortBy,
      );
      expect(result).toBe(mockResult);
    });

    it('should call AccommodationService.findAll with default arguments when optional properties are omitted', async () => {
      const mockResult = new PageDto<Accommodation>(
        [],
        new PageMetaDto({ itemCount: 0, limit: 10 }),
      );
      service.findAll.mockResolvedValue(mockResult);

      const query = { locationId: '1111111' } as FindAllAccommodationsDto;

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(
        query.locationId,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('findOne', () => {
    it('should call AccommodationService.findOne with correct id and return the accommodation', async () => {
      const mockAccommodation = AccommodationTestFactory.create({
        id: '1111111-0',
      });

      service.findOne.mockResolvedValue(mockAccommodation);

      const result = await controller.findOne(mockAccommodation.id);

      expect(service.findOne).toHaveBeenCalledWith(mockAccommodation.id);
      expect(result).toBe(mockAccommodation);
    });
  });
});
