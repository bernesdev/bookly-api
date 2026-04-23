import { createKeyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CommonModule } from './common/common.module';
import { CacheHeaderInterceptor } from './common/interceptors/cache-header.interceptor';
import { validate } from './config/configuration';
import { EnvModule } from './config/env.module';
import { EnvService } from './config/env.service';
import { AccommodationModule } from './modules/accommodation/accommodation.module';
import { BookingModule } from './modules/booking/booking.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { LocationModule } from './modules/location/location.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    EnvModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [EnvModule],
      useFactory: (envService: EnvService) => ({
        ttl: 86_400_000, // 24 hours
        stores: [createKeyv(envService.redisUrl)],
      }),
      inject: [EnvService],
    }),
    CommonModule,
    FirebaseModule,
    LocationModule,
    AccommodationModule,
    BookingModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheHeaderInterceptor,
    },
  ],
})
export class AppModule {}
