/* eslint-disable @typescript-eslint/unbound-method */

import * as admin from 'firebase-admin';
import { EnvService } from '../../config/env.service';
import { FirebaseProvider, FIREBASE_ADMIN } from './firebase.provider';

jest.mock('firebase-admin', () => {
  const settingsMock = jest.fn();
  const firestoreMock = jest.fn().mockReturnValue({
    settings: settingsMock,
  });

  return {
    apps: [],
    app: jest.fn(),
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    firestore: firestoreMock,
  };
});

describe('FirebaseProvider', () => {
  let mockEnvService: jest.Mocked<EnvService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEnvService = {
      firebaseProjectId: 'test-project',
      firebaseClientEmail: 'test-email@example.com',
      firebasePrivateKey: 'test-key\\nwith\\nnewlines',
      firebaseDatabaseUrl: 'https://test.firebaseio.com',
    } as unknown as jest.Mocked<EnvService>;

    // Reset admin.apps array for each test
    admin.apps.length = 0;
  });

  it('should be structured correctly for NestJS dependency injection', () => {
    expect(FirebaseProvider.provide).toBe(FIREBASE_ADMIN);
    expect(typeof FirebaseProvider.useFactory).toBe('function');
    expect(FirebaseProvider.inject).toEqual([EnvService]);
  });

  describe('useFactory', () => {
    it('should initialize a new Firebase app if none exists', () => {
      const mockCert = { cert: 'mocked' };
      (admin.credential.cert as jest.Mock).mockReturnValue(mockCert);

      const mockApp = { name: '[DEFAULT]' };
      (admin.app as jest.Mock).mockReturnValue(mockApp);

      const app = FirebaseProvider.useFactory(mockEnvService);

      expect(app).toBe(mockApp);

      // Asserts credential parsing and initialization
      expect(admin.credential.cert).toHaveBeenCalledWith({
        projectId: 'test-project',
        clientEmail: 'test-email@example.com',
        privateKey: 'test-key\nwith\nnewlines', // Asserts the replace logic
      });

      expect(admin.initializeApp).toHaveBeenCalledWith({
        credential: mockCert,
        databaseURL: 'https://test.firebaseio.com',
      });

      // Asserts that firestore ignoreUndefinedProperties setting runs
      expect(admin.firestore).toHaveBeenCalled();
      expect(admin.firestore().settings).toHaveBeenCalledWith({
        ignoreUndefinedProperties: true,
      });

      expect(admin.app).toHaveBeenCalled();
    });

    it('should not initialize a new Firebase app if one already exists (hot reload scenario)', () => {
      // Simulate an existing initialized app
      admin.apps.push({ name: '[DEFAULT]' } as any);

      const mockApp = { name: '[DEFAULT]' };
      (admin.app as jest.Mock).mockReturnValue(mockApp);

      const app = FirebaseProvider.useFactory(mockEnvService);

      expect(app).toBe(mockApp);

      // Ensure that initialization steps were bypassed
      expect(admin.initializeApp).not.toHaveBeenCalled();
      expect(admin.credential.cert).not.toHaveBeenCalled();
      expect(admin.firestore).not.toHaveBeenCalled();
    });

    it('should handle undefined private_key gracefully', () => {
      // @ts-expect-error forcing undefined to validate optional chaining
      mockEnvService.firebasePrivateKey = undefined;

      FirebaseProvider.useFactory(mockEnvService);

      expect(admin.credential.cert).toHaveBeenCalledWith(
        expect.objectContaining({
          privateKey: undefined,
        }),
      );
    });
  });
});
