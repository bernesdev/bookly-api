import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getVercelHandler } from '../src/platform/vercel/vercel-handler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Removes Vercel's /api prefix
  if (req.url) {
    req.url = req.url.replace(/^\/api(\/index)?/, '');
    if (req.url === '') req.url = '/';
  }

  const vercelHandler = await getVercelHandler();

  vercelHandler(req, res);
}
