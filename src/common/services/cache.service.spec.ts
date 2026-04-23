import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import type { Cache } from 'cache-manager';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should call cacheManager.get with correct key', async () => {
      cacheManager.get.mockResolvedValue('test-value');
      const result = await service.get('my-key');
      expect(cacheManager.get).toHaveBeenCalledWith('my-key');
      expect(result).toBe('test-value');
    });
  });

  describe('set', () => {
    it('should call cacheManager.set with correct arguments', async () => {
      await service.set('my-key', 'value', 100);
      expect(cacheManager.set).toHaveBeenCalledWith('my-key', 'value', 100);
    });

    it('should call cacheManager.set correctly without ttl', async () => {
      await service.set('my-key', 'value');
      expect(cacheManager.set).toHaveBeenCalledWith(
        'my-key',
        'value',
        undefined,
      );
    });
  });

  describe('getVersion', () => {
    it('should return the version if it exists', async () => {
      cacheManager.get.mockResolvedValue(5);
      const result = await service.getVersion('ver-key');
      expect(cacheManager.get).toHaveBeenCalledWith('ver-key');
      expect(result).toBe(5);
    });

    it('should return 0 if version does not exist', async () => {
      cacheManager.get.mockResolvedValue(null);
      const result = await service.getVersion('ver-key');
      expect(result).toBe(0);
    });
  });

  describe('bumpVersion', () => {
    it('should increment version correctly when it exists', async () => {
      cacheManager.get.mockResolvedValue(2);
      const result = await service.bumpVersion('ver-key');
      expect(cacheManager.get).toHaveBeenCalledWith('ver-key');
      expect(cacheManager.set).toHaveBeenCalledWith('ver-key', 3, undefined);
      expect(result).toBe(3);
    });

    it('should initialize version to 1 when it does not exist', async () => {
      cacheManager.get.mockResolvedValue(null);
      const result = await service.bumpVersion('ver-key');
      expect(cacheManager.set).toHaveBeenCalledWith('ver-key', 1, undefined);
      expect(result).toBe(1);
    });
  });
});
