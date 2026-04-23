import { Global, Module } from '@nestjs/common';
import { FirebaseProvider } from './firebase.provider';

@Global()
@Module({
  providers: [FirebaseProvider],
  exports: [FirebaseProvider],
})
export class FirebaseModule {}
