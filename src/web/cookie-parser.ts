import type { Request, Response, NextFunction } from 'express';

export function cookieParser(req: Request, _res: Response, next: NextFunction): void {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};

  if (cookieHeader) {
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const [key, ...rest] = pair.split('=');
      if (key) {
        req.cookies[key.trim()] = rest.join('=').trim();
      }
    }
  }

  next();
}

declare global {
  namespace Express {
    interface Request {
      cookies: Record<string, string>;
    }
  }
}
