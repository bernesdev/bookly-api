import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FIREBASE_ADMIN } from '../../modules/firebase/firebase.provider';
import { FirebaseGuard } from './firebase.guard';

describe('FirebaseGuard', () => {
  let guard: FirebaseGuard;
  let mockVerifyIdToken: jest.Mock;

  beforeEach(async () => {
    mockVerifyIdToken = jest.fn();

    const mockFirebaseAdmin = {
      auth: () => ({
        verifyIdToken: mockVerifyIdToken,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseGuard,
        {
          provide: FIREBASE_ADMIN,
          useValue: mockFirebaseAdmin,
        },
      ],
    }).compile();

    guard = module.get<FirebaseGuard>(FirebaseGuard);
  });

  const createMockContext = (
    authorizationHeader?: string,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            ...(authorizationHeader && { authorization: authorizationHeader }),
          },
        }),
      }),
    } as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException if authorization header is completely empty', async () => {
    const context = createMockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication token is missing or invalid'),
    );
  });

  it('should throw UnauthorizedException if token does not start with Bearer', async () => {
    const context = createMockContext('Basic some-token');
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication token is missing or invalid'),
    );
  });

  it('should throw UnauthorizedException if Firebase rejects the token (expired or invalid)', async () => {
    const context = createMockContext('Bearer invalid-token');
    mockVerifyIdToken.mockRejectedValue(new Error('Firebase error'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Session is expired or invalid'),
    );
  });

  it('should return true and assign user to request if token is valid', async () => {
    type BaseRequest = { headers: Record<string, string>; user?: unknown };
    const mockRequest: BaseRequest = {
      headers: { authorization: 'Bearer valid-token' },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    mockVerifyIdToken.mockResolvedValue({ uid: '123' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
    expect(mockRequest.user).toEqual({ uid: '123' });
  });
});
