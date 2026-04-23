import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  async getVersion(key: string): Promise<number> {
    const version = await this.get<number>(key);
    return version ?? 0;
  }

  async bumpVersion(key: string): Promise<number> {
    const currentVersion = await this.getVersion(key);
    const nextVersion = currentVersion + 1;
    await this.set(key, nextVersion);
    return nextVersion;
  }
}
