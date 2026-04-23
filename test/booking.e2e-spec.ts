/* eslint-disable @typescript-eslint/unbound-method */

import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { FirebaseGuard } from './../src/common/guards/firebase.guard';
import { BookingService } from './../src/modules/booking/booking.service';
import { CreateBookingDto } from './../src/modules/booking/dtos/booking.dto';

interface BookingResponse {
  id: string;
}

interface PaginatedBookingResponse {
  data: BookingResponse[];
  meta: Record<string, unknown>;
}

describe('BookingController (e2e)', () => {
  let app: INestApplication<App>;
  let bookingService: jest.Mocked<BookingService>;

  beforeAll(async () => {
    const mockBookingService = {
      create: jest.fn().mockResolvedValue({
        id: 'book-123',
        status: 'active',
        dates: { checkIn: new Date(), checkOut: new Date() },
      }),
      findAll: jest.fn().mockResolvedValue({
        data: [{ id: 'book-123' }],
        meta: { itemCount: 1, limit: 10 },
      }),
      findOne: jest.fn().mockResolvedValue({
        id: 'book-123',
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(BookingService)
      .useValue(mockBookingService)
      .overrideGuard(FirebaseGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context
            .switchToHttp()
            .getRequest<{ user: { uid: string } }>();
          req.user = { uid: 'user-123' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    bookingService = moduleFixture.get(BookingService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/bookings (POST)', () => {
    it('should create a new booking', () => {
      const payload: CreateBookingDto = {
        accommodationId: '123',
        checkIn: '2026-05-01',
        checkOut: '2026-05-05',
        rooms: 1,
        adults: 2,
        children: 0,
      };

      return request(app.getHttpServer())
        .post('/bookings')
        .send(payload)
        .expect(201)
        .expect((res) => {
          const body = res.body as BookingResponse;
          expect(body.id).toBe('book-123');
        });
    });

    it('should throw 400 for invalid data', () => {
      const payload = {
        accommodationId: '123',
        checkIn: 'invalid-date', // Invalid format
      };

      return request(app.getHttpServer())
        .post('/bookings')
        .send(payload)
        .expect(400);
    });
  });

  describe('/bookings (GET)', () => {
    it('should return paginated bookings', () => {
      return request(app.getHttpServer())
        .get('/bookings')
        .query({ limit: 5 })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedBookingResponse;
          expect(body.data).toBeDefined();
          expect(body.meta).toBeDefined();
        });
    });

    it('should pass correct default values for status', async () => {
      await request(app.getHttpServer()).get('/bookings').expect(200);

      expect(bookingService.findAll).toHaveBeenCalledWith(
        'user-123',
        10,
        'active',
        undefined,
      );
    });
  });

  describe('/bookings/:id (GET)', () => {
    it('should return a single booking by id', () => {
      return request(app.getHttpServer())
        .get('/bookings/book-123')
        .expect(200)
        .expect((res) => {
          const body = res.body as BookingResponse;
          expect(body.id).toBe('book-123');
        });
    });
  });
});
