import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

z.config(z.locales.sv());
import { prisma } from './db.js';
import { config } from './config.js';
import { HttpError } from './errors.js';
import { signToken, requireAuth } from './auth.js';

const router = Router();

const credentialsSchema = z.object({
  username: z
    .string({ error: 'Användarnamn krävs' })
    .trim()
    .min(3, 'Användarnamnet måste vara minst 3 tecken')
    .max(32, 'Användarnamnet får vara högst 32 tecken')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Användarnamnet får bara innehålla bokstäver a-z, siffror, _ . och -'),
  password: z
    .string({ error: 'Lösenord krävs' })
    .min(8, 'Lösenordet måste vara minst 8 tecken')
    .max(72, 'Lösenordet får vara högst 72 tecken'), // bcrypt använder max 72 byte
});

function parseCredentials(body) {
  const result = credentialsSchema.safeParse(body ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new HttpError(400, issue.message, result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })));
  }
  return { ...result.data, username: result.data.username.toLowerCase() };
}

const publicUser = ({ id, username, role, createdAt }) => ({ id, username, role, createdAt });

// Skapa ny användare
router.post('/users', async (req, res) => {
  const { username, password } = parseCredentials(req.body);

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) throw new HttpError(409, 'Användarnamnet är redan taget');

  // bcrypt genererar ett slumpmässigt salt och bakar in det i hashen
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  const user = await prisma.user.create({ data: { username, passwordHash } });

  res.status(201).location(`/users/${user.id}`).json(publicUser(user));
});

// Logga in -> JWT
router.post('/auth/login', async (req, res) => {
  const body = req.body ?? {};
  if (typeof body.username !== 'string' || typeof body.password !== 'string' || !body.username || !body.password) {
    throw new HttpError(400, 'Ange både användarnamn och lösenord');
  }

  const user = await prisma.user.findUnique({ where: { username: body.username.trim().toLowerCase() } });
  // Jämför alltid mot en hash så att svarstiden inte avslöjar om användaren finns
  const hash = user?.passwordHash ?? '$2b$12$KNUPzZS7kJlfiXTnLplJv.R9rm07QdErgfqfzy65HImWBeArzJOSS';
  const ok = await bcrypt.compare(body.password, hash);
  if (!user || !ok) {
    res.set('WWW-Authenticate', 'Bearer realm="whiteboard"');
    throw new HttpError(401, 'Fel användarnamn eller lösenord');
  }

  const token = signToken(user);
  res.set('Cache-Control', 'no-store').json({
    token,
    tokenType: 'Bearer',
    expiresIn: config.jwtExpiresIn,
    user: publicUser(user),
  });
});

// Info om inloggad användare (kräver JWT)
router.get('/users/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.user.sub) } });
  if (!user) throw new HttpError(404, 'Användaren finns inte längre');
  res.json(publicUser(user));
});

// Lista användare (id + namn) så att frontend kan visa vem som äger lappar
router.get('/users', requireAuth, async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, username: true }, orderBy: { username: 'asc' } });
  res.json(users);
});

export default router;
