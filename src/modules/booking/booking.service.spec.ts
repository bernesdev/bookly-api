/* eslint-disable @typescript-eslint/unbound-method */

import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AccommodationTestFactory } from '../../../test/factories/accommodation-test.factory';
import { BookingTestFactory } from '../../../test/factories/booking-test.factory';
import { CacheService } from '../../common/services/cache.service';
import { encodeCursor } from '../../common/utils/cursor.util';
import { AccommodationService } from '../accommodation/accommodation.service';
import { FIREBASE_ADMIN } from '../firebase/firebase.provider';
import { BookingService } from './booking.service';
import { BookingStatus, CreateBookingDto } from './dtos/booking.dto';

describe('BookingService', () => {
  let service: BookingService;
  let cacheService: jest.Mocked<CacheService>;
  let accommodationService: jest.Mocked<AccommodationService>;
  let firestoreMock: {
    collection: jest.Mock;
    doc: jest.Mock;
    add: jest.Mock;
    get: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    startAfter: jest.Mock;
    limit: jest.Mock;
  };
  let requestObj: Record<string, unknown>;

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      getVersion: jest.fn().mockResolvedValue(1),
      bumpVersion: jest.fn(),
    } as unknown as jest.Mocked<CacheService>;

    accommodationService = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<AccommodationService>;

    requestObj = {};

    firestoreMock = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      add: jest.fn(),
      get: jest.fn(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      startAfter: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };

    const firebaseAppMock = {
      firestore: jest.fn().mockReturnValue(firestoreMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: CacheService, useValue: cacheService },
        { provide: AccommodationService, useValue: accommodationService },
        { provide: FIREBASE_ADMIN, useValue: firebaseAppMock },
        { provide: 'REQUEST', useValue: requestObj },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking correctly in firestore and bump cache version', async () => {
      const mockAccommodation = AccommodationTestFactory.create();
      accommodationService.findOne.mockResolvedValue(mockAccommodation);

      firestoreMock.add.mockResolvedValue({ id: 'new-book-id' });

      const dto: CreateBookingDto = {
        accommodationId: mockAccommodation.id,
        checkIn: '2026-05-01',
        checkOut: '2026-05-05',
        rooms: 1,
        adults: 2,
        children: 0,
      };

      const result = await service.create('user-123', dto);

      expect(accommodationService.findOne).toHaveBeenCalledWith(
        mockAccommodation.id,
      );
      expect(firestoreMock.collection).toHaveBeenCalledWith('users');
      expect(firestoreMock.doc).toHaveBeenCalledWith('user-123');
      expect(firestoreMock.collection).toHaveBeenCalledWith('bookings');
      expect(firestoreMock.add).toHaveBeenCalled(); // Passa o objeto mappeado do DTO

      // O cache de invalidação para os findAll deve ser atualizado
      expect(cacheService.bumpVersion).toHaveBeenCalledWith(
        'bookings:version:user-123:active',
      );
      expect(result.id).toBe('new-book-id');
      expect(result.accommodation.id).toBe(mockAccommodation.id);
    });

    it('should throw ServiceUnavailableException if firestore throws generic error', async () => {
      accommodationService.findOne.mockResolvedValue(
        AccommodationTestFactory.create(),
      );
      firestoreMock.add.mockRejectedValue(new Error('Firebase error'));

      const dto = {
        accommodationId: 'test',
        checkIn: '2026-05-01',
        checkOut: '2026-05-05',
        rooms: 1,
        adults: 2,
        children: 0,
      };

      await expect(service.create('user-123', dto)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('findAll', () => {
    it('should return cached bookings if hit and flag as cached', async () => {
      const mockResult = { data: BookingTestFactory.createMany([{}, {}]) };
      cacheService.get.mockResolvedValue(mockResult);

      const result = await service.findAll('user-1', 10, BookingStatus.ACTIVE);

      expect(cacheService.getVersion).toHaveBeenCalledWith(
        'bookings:version:user-1:active',
      );
      expect(cacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('bookings:user-1:active:10:none:v1'),
      );
      expect(firestoreMock.get).not.toHaveBeenCalled();
      expect(requestObj['isCacheHit']).toBe(true);
      expect(result).toBe(mockResult);
    });

    it('should query Firestore when cache misses and format to PageDto', async () => {
      cacheService.get.mockResolvedValue(null);

      const { id, ...mockData } = BookingTestFactory.create();
      const mockQuerySnapshot = {
        size: 1,
        docs: [
          {
            id,
            data: () => mockData,
            get: () => new Date(),
          },
        ],
      };
      firestoreMock.get.mockResolvedValue(mockQuerySnapshot);

      const result = await service.findAll('user-1', 10, BookingStatus.ACTIVE);

      expect(firestoreMock.where).toHaveBeenCalled();
      expect(firestoreMock.orderBy).toHaveBeenCalled();
      expect(firestoreMock.limit).toHaveBeenCalledWith(11); // requested limit + 1
      expect(cacheService.set).toHaveBeenCalled();

      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe(id);
      expect(result.meta.itemCount).toBe(1);
    });

    it('should decode cursor correctly if passed', async () => {
      cacheService.get.mockResolvedValue(null);

      const { id, ...mockData } = BookingTestFactory.create();
      firestoreMock.get.mockResolvedValue({
        size: 1,
        docs: [{ id, data: () => mockData, get: () => new Date() }],
      });

      const cursor = encodeCursor({
        checkOut: new Date().getTime(),
        id: 'doc-prev',
      });

      await service.findAll('user-1', 10, BookingStatus.ACTIVE, cursor);

      expect(firestoreMock.startAfter).toHaveBeenCalled();
    });

    it('should return undefined nextCursor if fetched items are less than limit + 1', async () => {
      cacheService.get.mockResolvedValue(null);

      const mockQuerySnapshot = {
        size: 5,
        docs: new Array(5).fill({
          id: 'test',
          data: () => ({}),
          get: () => new Date(),
        }),
      };
      firestoreMock.get.mockResolvedValue(mockQuerySnapshot);

      const result = await service.findAll('user-1', 10, BookingStatus.ACTIVE);

      expect(result.meta.nextCursor).toBeUndefined();
    });

    it('should generate nextCursor payload if items equal limit + 1', async () => {
      cacheService.get.mockResolvedValue(null);

      const checkOutDate = new Date();
      const mockQuerySnapshot = {
        size: 11,
        docs: new Array(11).fill({
          id: 'doc-id',
          data: () => ({}),
          get: () => checkOutDate,
        }),
      };
      firestoreMock.get.mockResolvedValue(mockQuerySnapshot);

      const result = await service.findAll('user-1', 10, BookingStatus.ACTIVE);

      expect(result.meta.nextCursor).toBeDefined();
      expect(result.meta.nextCursor).toBe(
        encodeCursor({
          checkOut: checkOutDate.getTime(),
          id: 'doc-id',
        }),
      );
    });

    it('should return undefined nextCursor if lastDoc lacks checkOut date', async () => {
      cacheService.get.mockResolvedValue(null);

      const mockQuerySnapshot = {
        size: 11,
        docs: new Array(11).fill({
          id: 'doc-id',
          data: () => ({}),
          get: () => undefined,
        }),
      };
      firestoreMock.get.mockResolvedValue(mockQuerySnapshot);

      const result = await service.findAll('user-1', 10, BookingStatus.ACTIVE);

      expect(result.meta.nextCursor).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('should return cached booking if found and flag request instance', async () => {
      const mockBooking = BookingTestFactory.create();
      cacheService.get.mockResolvedValue(mockBooking);

      const result = await service.findOne(mockBooking.id, 'user-123');

      expect(cacheService.get).toHaveBeenCalledWith(
        `booking:${mockBooking.id}`,
      );
      expect(firestoreMock.get).not.toHaveBeenCalled();
      expect(requestObj['isCacheHit']).toBe(true);
      expect(result).toEqual(mockBooking);
    });

    it('should fetch from firestore, destructure payload, and update cache on miss', async () => {
      cacheService.get.mockResolvedValue(null);

      const { id, ...mockData } = BookingTestFactory.create();
      firestoreMock.get.mockResolvedValue({
        id,
        data: () => mockData,
      });

      const result = await service.findOne(id, 'user-123');

      expect(firestoreMock.doc).toHaveBeenCalledWith(id);
      expect(firestoreMock.get).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith(
        `booking:${id}`,
        expect.any(Object),
        86_400_000,
      );
      expect(result.id).toBe(id);
    });
  });
});
