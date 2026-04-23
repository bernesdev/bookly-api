import { createHttpApplication } from './bootstrap/app.factory';

async function bootstrap() {
  const app = await createHttpApplication();

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
