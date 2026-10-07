import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { HttpError } from './errors.js';

export function signToken(user) {
  // Allt som board-API:n behöver för att auktorisera användaren:
  // sub = användar-id (matchas mot boardens userIds), username och roll.
  return jwt.sign(
    { username: user.username, role: user.role },
    config.jwtSecret,
    {
      subject: String(user.id),
      expiresIn: config.jwtExpiresIn,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
      algorithm: 'HS256',
    },
  );
}

// Middleware: kräver "Authorization: Bearer <token>"
export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    res.set('WWW-Authenticate', 'Bearer realm="whiteboard"');
    return next(new HttpError(401, 'Saknar Bearer-token i Authorization-headern'));
  }
  try {
    req.user = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });
    next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    res.set('WWW-Authenticate', `Bearer realm="whiteboard", error="invalid_token", error_description="${expired ? 'token expired' : 'invalid token'}"`);
    next(new HttpError(401, expired ? 'Token har gått ut, logga in på nytt' : 'Ogiltig token'));
  }
}
