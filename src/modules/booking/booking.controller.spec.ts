/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { BookingTestFactory } from '../../../test/factories/booking-test.factory';
import { UserTestFactory } from '../../../test/factories/user-test.factory';
import { PageMetaDto } from '../../common/dtos/page-meta.dto';
import { PageDto } from '../../common/dtos/page.dto';
import { FirebaseGuard } from '../../common/guards/firebase.guard';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import {
  BookingStatus,
  CreateBookingDto,
  FindAllBookingsDto,
} from './dtos/booking.dto';
import { Booking } from './entities/booking.entity';

describe('BookingController', () => {
  let controller: BookingController;
  let service: jest.Mocked<BookingService>;

  beforeEach(async () => {
    const mockBookingService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    })
      .overrideGuard(FirebaseGuard) // Mock the guard so it doesn't block endpoint reachability
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<BookingController>(BookingController);
    service = module.get(BookingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call BookingService.create with correct user uid and DTO, then return the response', async () => {
      const mockUser = UserTestFactory.create();

      const createDto: CreateBookingDto = {
        accommodationId: '1111111-0',
        checkIn: '2026-05-01',
        checkOut: '2026-05-05',
        rooms: 1,
        adults: 2,
        children: 0,
      };

      const mockResult = BookingTestFactory.create();
      service.create.mockResolvedValue(mockResult);

      const result = await controller.create(mockUser, createDto);

      expect(service.create).toHaveBeenCalledWith(mockUser.uid, createDto);
      expect(result).toBe(mockResult);
    });
  });

  describe('findAll', () => {
    it('should call BookingService.findAll and return paginated bookings', async () => {
      const mockUser = UserTestFactory.create();
      const mockBookings = BookingTestFactory.createMany([{}, {}]);

      const mockPaginated = new PageDto<Booking>(
        mockBookings,
        new PageMetaDto({ itemCount: mockBookings.length, limit: 10 }),
      );

      service.findAll.mockResolvedValue(mockPaginated);

      const query: FindAllBookingsDto = {
        limit: 10,
        status: BookingStatus.ACTIVE,
        cursor: 'fake-cursor',
      };

      const result = await controller.findAll(mockUser, query);

      expect(service.findAll).toHaveBeenCalledWith(
        mockUser.uid,
        query.limit,
        query.status,
        query.cursor,
      );
      expect(result).toBe(mockPaginated);
    });
  });

  describe('findOne', () => {
    it('should call BookingService.findOne with correct booking ID and user UID', async () => {
      const mockUser = UserTestFactory.create();
      const mockBooking = BookingTestFactory.create({ id: 'book-456' });

      service.findOne.mockResolvedValue(mockBooking);

      const result = await controller.findOne(mockUser, mockBooking.id);

      expect(service.findOne).toHaveBeenCalledWith(
        mockBooking.id,
        mockUser.uid,
      );
      expect(result).toBe(mockBooking);
    });
  });
});
