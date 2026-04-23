import type { User } from '../../src/common/entities/user.entity';

export class UserTestFactory {
  static create(overrides?: Partial<User>): User {
    return {
      uid: 'user-123',
      email: 'test@example.com',
      email_verified: true,
      auth_time: 123456789,
      exp: 123456789,
      iat: 123456789,
      firebase: {
        identities: {},
        sign_in_provider: 'password',
      },
      ...overrides,
    } as User;
  }
}
