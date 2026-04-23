import {
  HttpException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import dayjs from 'dayjs';
import * as admin from 'firebase-admin';
import { PageMetaDto } from '../../common/dtos/page-meta.dto';
import { PageDto } from '../../common/dtos/page.dto';
import { CacheService } from '../../common/services/cache.service';
import { decodeCursor } from '../../common/utils/cursor.util';
import {
  isNonEmptyString,
  isNumber,
} from '../../common/utils/validators.utils';
import { AccommodationService } from '../accommodation/accommodation.service';
import { FIREBASE_ADMIN } from '../firebase/firebase.provider';
import {
  BookingDto,
  BookingStatus,
  CreateBookingDto,
} from './dtos/booking.dto';
import { Booking } from './entities/booking.entity';
import { BookingMapper } from './mappers/booking.mapper';

@Injectable()
export class BookingService {
  private static readonly BOOKINGS_CACHE_TTL = 300_000; // 5 minutes
  private static readonly BOOKING_CACHE_TTL = 86_400_000; // 24 hours

  constructor(
    private readonly accommodationService: AccommodationService,
    @Inject(FIREBASE_ADMIN) private readonly firebase: admin.app.App,
    private readonly cacheService: CacheService,
    @Inject('REQUEST') private request: Request,
  ) {}

  private get db() {
    return this.firebase.firestore();
  }

  async create(
    userId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    try {
      const accommodation = await this.accommodationService.findOne(
        createBookingDto.accommodationId,
      );

      const booking: BookingDto = BookingMapper.toEntity(
        createBookingDto,
        accommodation,
      );

      const response = await this.db
        .collection('users')
        .doc(userId)
        .collection('bookings')
        .add(booking);

      await this.bumpCacheVersion(userId);

      return {
        ...booking,
        id: response.id,
      };
    } catch (error) {
      console.error('Error creating booking:', error);

      if (error instanceof HttpException) throw error;

      throw new ServiceUnavailableException(
        'Booking service is temporarily unavailable',
      );
    }
  }

  async findAll(
    userId: string,
    limit: number = 10,
    status: BookingStatus,
    cursor?: string,
  ): Promise<PageDto<Booking>> {
    try {
      const version = await this.getCacheVersion(userId, status);
      const cacheKey = `bookings:${userId}:${status}:${limit}:${cursor ?? 'none'}:v${version}`;

      const cached = await this.cacheService.get<PageDto<Booking>>(cacheKey);
      if (cached) {
        this.request['isCacheHit'] = true;
        return cached;
      }

      let query = this.db
        .collection('users')
        .doc(userId)
        .collection('bookings')
        .where(
          'dates.checkOut',
          status === BookingStatus.ACTIVE ? '>=' : '<',
          new Date(),
        )
        .orderBy('dates.checkOut', 'asc')
        .orderBy(admin.firestore.FieldPath.documentId(), 'asc');

      if (cursor) {
        const decodedCursor = decodeCursor({
          cursor,
          schema: {
            checkOut: isNumber,
            id: isNonEmptyString,
          },
        });
        query = query.startAfter(
          dayjs(decodedCursor.checkOut).toDate(),
          decodedCursor.id,
        );
      }

      // Fetch one extra item to check if there is a next page
      const queryLimit = limit + 1;
      const snapshot = await query.limit(queryLimit).get();

      const documentsToReturn = snapshot.docs.slice(0, limit);

      const bookings = documentsToReturn.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Booking,
      );

      const nextCursor = this.buildNextCursor(
        snapshot.size,
        queryLimit,
        documentsToReturn.at(-1),
      );

      const response = new PageDto<Booking>(
        bookings,
        new PageMetaDto({
          limit,
          itemCount: bookings.length,
          nextCursor,
        }),
      );

      await this.cacheService.set(
        cacheKey,
        response,
        BookingService.BOOKINGS_CACHE_TTL,
      );

      return response;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (error instanceof HttpException) throw error;

      throw new ServiceUnavailableException(
        'Booking service is temporarily unavailable',
      );
    }
  }

  async findOne(id: string, userId: string): Promise<Booking> {
    try {
      const cacheKey = `booking:${id}`;

      const cached = await this.cacheService.get<Booking>(cacheKey);
      if (cached) {
        this.request['isCacheHit'] = true;
        return cached;
      }

      const snapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('bookings')
        .doc(id)
        .get();

      const booking = { id: snapshot.id, ...snapshot.data() } as Booking;

      await this.cacheService.set(
        cacheKey,
        booking,
        BookingService.BOOKING_CACHE_TTL,
      );

      return booking;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new ServiceUnavailableException(
        'Booking service is temporarily unavailable',
      );
    }
  }

  private async getCacheVersion(
    userId: string,
    status: BookingStatus,
  ): Promise<number> {
    return this.cacheService.getVersion(`bookings:version:${userId}:${status}`);
  }

  private async bumpCacheVersion(userId: string): Promise<void> {
    await this.cacheService.bumpVersion(
      `bookings:version:${userId}:${BookingStatus.ACTIVE}`,
    );
  }

  private buildNextCursor(
    snapshotSize: number,
    queryLimit: number,
    lastDoc?: admin.firestore.QueryDocumentSnapshot,
  ): object | undefined {
    if (snapshotSize < queryLimit) {
      return undefined;
    }

    if (!lastDoc) {
      return undefined;
    }

    const rawCheckOut = lastDoc.get('dates.checkOut') as
      | admin.firestore.Timestamp
      | Date
      | undefined;

    if (!rawCheckOut) {
      return undefined;
    }

    const checkOutMillis =
      rawCheckOut instanceof admin.firestore.Timestamp
        ? rawCheckOut.toMillis()
        : rawCheckOut.getTime();

    const payload = {
      checkOut: checkOutMillis,
      id: lastDoc.id,
    };

    return payload;
  }
}
