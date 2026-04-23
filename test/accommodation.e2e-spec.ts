import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { CacheService } from './../src/common/services/cache.service';
import { LocationService } from './../src/modules/location/location.service';

interface AccommodationResponse {
  id: string;
  location: { distanceToCenter: number };
  price: { currentPrice: number };
}

interface PaginatedResponse {
  data: AccommodationResponse[];
  meta: Record<string, unknown>;
}

describe('AccommodationController (e2e)', () => {
  let app: INestApplication<App>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let locationService: jest.Mocked<LocationService>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LocationService)
      .useValue({
        findOne: jest.fn().mockResolvedValue({
          id: '123',
          city: 'Paris',
          country: 'France',
          lat: 48.8566,
          lng: 2.3522,
        }),
      })
      .overrideProvider(CacheService)
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        getVersion: jest.fn().mockResolvedValue(0),
        bumpVersion: jest.fn().mockResolvedValue(1),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    locationService = moduleFixture.get(LocationService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/accommodations (GET)', () => {
    it('should return a paginated list of accommodations', () => {
      return request(app.getHttpServer())
        .get('/accommodations')
        .query({ locationId: '123', limit: 5 })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
          expect(body.data.length).toBeLessThanOrEqual(5);
          expect(body.meta).toBeDefined();
        });
    });

    it('should return sorted accommodations by distance', () => {
      return request(app.getHttpServer())
        .get('/accommodations')
        .query({ locationId: '123', limit: 5, sortBy: 'distance' })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          const accs = body.data;
          expect(accs.length).toBeGreaterThan(0);
          if (accs.length > 1) {
            expect(accs[0].location.distanceToCenter).toBeLessThanOrEqual(
              accs[1].location.distanceToCenter,
            );
          }
        });
    });

    it('should return sorted accommodations by price asc', () => {
      return request(app.getHttpServer())
        .get('/accommodations')
        .query({ locationId: '123', limit: 5, sortBy: 'price_asc' })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          const accs = body.data;
          expect(accs.length).toBeGreaterThan(0);
          if (accs.length > 1) {
            expect(accs[0].price.currentPrice).toBeLessThanOrEqual(
              accs[1].price.currentPrice,
            );
          }
        });
    });

    it('should return sorted accommodations by price desc', () => {
      return request(app.getHttpServer())
        .get('/accommodations')
        .query({ locationId: '123', limit: 5, sortBy: 'price_desc' })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          const accs = body.data;
          expect(accs.length).toBeGreaterThan(0);
          if (accs.length > 1) {
            expect(accs[0].price.currentPrice).toBeGreaterThanOrEqual(
              accs[1].price.currentPrice,
            );
          }
        });
    });
  });

  describe('/accommodations/:id (GET)', () => {
    it('should return a single accommodation by id', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/accommodations')
        .query({ locationId: '123', limit: 1 });

      const listBody = listRes.body as PaginatedResponse;
      const accId = listBody.data[0].id;

      return request(app.getHttpServer())
        .get(`/accommodations/${accId}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as AccommodationResponse;
          expect(body.id).toBe(accId);
          expect(body.location).toBeDefined();
          expect(body.price).toBeDefined();
        });
    });

    it('should throw 400 for an invalid accommodation id', () => {
      return request(app.getHttpServer())
        .get('/accommodations/123-invalid-id-xyz-not-found')
        .expect(400);
    });
  });
});
