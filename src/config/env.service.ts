import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './configuration';

@Injectable()
export class EnvService {
  get redisUrl() {
    return this.get('REDIS_URL');
  }
  get geonamesBaseUrl() {
    return this.get('GEONAMES_BASE_URL');
  }
  get geonamesUsername() {
    return this.get('GEONAMES_USERNAME');
  }

  get firebaseProjectId() {
    return this.get('FIREBASE_PROJECT_ID');
  }

  get firebaseClientEmail() {
    return this.get('FIREBASE_CLIENT_EMAIL');
  }

  get firebasePrivateKey() {
    return this.get('FIREBASE_PRIVATE_KEY');
  }

  get firebaseDatabaseUrl() {
    return this.get('FIREBASE_DATABASE_URL');
  }

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  get<T extends keyof EnvironmentVariables>(key: T) {
    return this.configService.get(key, { infer: true });
  }
}
