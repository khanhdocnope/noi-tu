import type { Request, Response, NextFunction } from 'express';

const sessions = new Map<string, number>();

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const password = process.env['ADMIN_PASSWORD'];
  if (!password) {
    return next();
  }

  if (req.path === '/login') {
    return next();
  }

  const sessionId = req.cookies?.['session'];
  if (sessionId && sessions.has(sessionId)) {
    const expires = sessions.get(sessionId)!;
    if (Date.now() < expires) {
      return next();
    }
    sessions.delete(sessionId);
  }

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.redirect('/login');
}

export function handleLogin(req: Request, res: Response): void {
  const { password: inputPassword } = req.body;
  const correctPassword = process.env['ADMIN_PASSWORD'];

  if (!correctPassword) {
    return void res.redirect('/admin');
  }

  if (inputPassword !== correctPassword) {
    return void res.send(`
      <!DOCTYPE html>
      <html><head><title>Login</title>
      <style>body{background:#1a1a2e;color:#eee;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
      .box{background:#16213e;padding:2rem;border-radius:12px;text-align:center}
      input{padding:0.5rem;border-radius:6px;border:1px solid #333;background:#1a1a2e;color:#eee;margin:0.5rem 0}
      button{padding:0.5rem 1rem;background:#e94560;color:white;border:none;border-radius:6px;cursor:pointer}</style></head>
      <body><div class="box"><h2>Wrong password</h2>
      <form method="POST" action="/login"><input name="password" type="password" placeholder="Password">
      <br><button type="submit">Login</button></form></div></body></html>
    `);
  }

  const sessionId = generateId();
  sessions.set(sessionId, Date.now() + 24 * 60 * 60 * 1000);

  res.cookie('session', sessionId, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });

  res.redirect('/admin');
}

export function handleLoginPage(_req: Request, res: Response): void {
  const password = process.env['ADMIN_PASSWORD'];
  if (!password) {
    return void res.redirect('/admin');
  }

  res.send(`
    <!DOCTYPE html>
    <html><head><title>Admin Login</title>
    <style>body{background:#1a1a2e;color:#eee;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
    .box{background:#16213e;padding:2rem;border-radius:12px;text-align:center}
    input{padding:0.5rem;border-radius:6px;border:1px solid #333;background:#1a1a2e;color:#eee;margin:0.5rem 0;width:200px}
    button{padding:0.5rem 1rem;background:#e94560;color:white;border:none;border-radius:6px;cursor:pointer;margin-top:0.5rem}</style></head>
    <body><div class="box"><h2>Admin Login</h2>
    <form method="POST" action="/login"><input name="password" type="password" placeholder="Enter password">
    <br><button type="submit">Login</button></form></div></body></html>
  `);
}
