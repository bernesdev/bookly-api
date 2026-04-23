import { EnvService } from '../../config/env.service';
import * as admin from 'firebase-admin';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

export const FirebaseProvider = {
  provide: FIREBASE_ADMIN,
  useFactory: (envService: EnvService): admin.app.App => {
    // Avoid initializing multiple Firebase apps in development with hot reload
    if (admin.apps.length > 0) {
      return admin.app();
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: envService.firebaseProjectId,
        clientEmail: envService.firebaseClientEmail,
        privateKey: envService.firebasePrivateKey?.replace(/\\n/g, '\n'),
      }),
      databaseURL: envService.firebaseDatabaseUrl,
    });

    admin.firestore().settings({ ignoreUndefinedProperties: true });

    return admin.app();
  },
  inject: [EnvService],
};
