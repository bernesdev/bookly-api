import { Express } from 'express';
import { createServerlessApplication } from '../../bootstrap/app.factory';

let cachedApp: Express | undefined;

export async function getVercelHandler() {
  if (!cachedApp) {
    const { expressApp } = await createServerlessApplication();
    cachedApp = expressApp;
  }

  return cachedApp;
}
