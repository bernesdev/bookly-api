import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as admin from 'firebase-admin';
import { FIREBASE_ADMIN } from '../../modules/firebase/firebase.provider';

@Injectable()
export class FirebaseGuard implements CanActivate {
  constructor(
    @Inject(FIREBASE_ADMIN) private readonly firebase: admin.app.App,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Authentication token is missing or invalid',
      );
    }

    try {
      const decodedToken = await this.firebase.auth().verifyIdToken(token);

      request['user'] = decodedToken;

      return true;
    } catch {
      throw new UnauthorizedException('Session is expired or invalid');
    }
  }
}
