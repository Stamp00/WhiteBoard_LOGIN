import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Saknar miljövariabeln ${key}`);
    process.exit(1);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET måste vara minst 32 tecken lång');
  process.exit(1);
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtIssuer: process.env.JWT_ISSUER || 'whiteboard-login-api',
  jwtAudience: process.env.JWT_AUDIENCE || 'whiteboard',
  // Kommaseparerad lista med tillåtna origins, t.ex. "https://people.arcada.fi"
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((o) => o.trim()),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
};
