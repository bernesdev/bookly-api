import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { LocationService } from './../src/modules/location/location.service';

interface LocationResponse {
  id: string;
  city: string;
}

interface PaginatedLocationResponse {
  data: LocationResponse[];
  meta: Record<string, unknown>;
}

describe('LocationController (e2e)', () => {
  let app: INestApplication<App>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let locationService: jest.Mocked<LocationService>;

  beforeAll(async () => {
    const mockLocationService = {
      findOneByCoordinates: jest.fn().mockResolvedValue({
        id: '123',
        city: 'Paris',
      }),
      findAllByQuery: jest
        .fn()
        .mockResolvedValue([{ id: '123', city: 'Paris' }]),
      findTopDestinations: jest.fn().mockResolvedValue({
        data: [{ id: '123', city: 'Paris' }],
        meta: { limit: 10, itemCount: 1 },
      }),
      findOne: jest.fn().mockResolvedValue({
        id: '123',
        city: 'Paris',
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LocationService)
      .useValue(mockLocationService)
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

  describe('/locations/coordinates (GET)', () => {
    it('should return a location by coordinates', () => {
      return request(app.getHttpServer())
        .get('/locations/coordinates')
        .query({ lat: 48.8566, lng: 2.3522 })
        .expect(200)
        .expect((res) => {
          const body = res.body as LocationResponse;
          expect(body.id).toBe('123');
          expect(body.city).toBe('Paris');
        });
    });

    it('should throw 400 for invalid coordinates', () => {
      return request(app.getHttpServer())
        .get('/locations/coordinates')
        .query({ lat: 100, lng: 200 }) // Invalid range for lat/lng
        .expect(400);
    });
  });

  describe('/locations/search (GET)', () => {
    it('should return a list of locations matching the query', () => {
      return request(app.getHttpServer())
        .get('/locations/search')
        .query({ query: 'Par' })
        .expect(200)
        .expect((res) => {
          const body = res.body as LocationResponse[];
          expect(Array.isArray(body)).toBe(true);
          expect(body[0].id).toBe('123');
        });
    });

    it('should throw 400 if query is missing', () => {
      return request(app.getHttpServer()).get('/locations/search').expect(400);
    });
  });

  describe('/locations/top-destinations (GET)', () => {
    it('should return paginated top destinations', () => {
      return request(app.getHttpServer())
        .get('/locations/top-destinations')
        .query({ limit: 5 })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedLocationResponse;
          expect(body.data).toBeDefined();
          expect(body.meta).toBeDefined();
        });
    });
  });

  describe('/locations/:id (GET)', () => {
    it('should return a single location by id', () => {
      return request(app.getHttpServer())
        .get('/locations/123')
        .expect(200)
        .expect((res) => {
          const body = res.body as LocationResponse;
          expect(body.id).toBe('123');
          expect(body.city).toBe('Paris');
        });
    });
  });
});
