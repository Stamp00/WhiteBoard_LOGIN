# Whiteboard – login-API

Registrering och inloggning. Returnerar en JWT som board-API:n använder för auktorisering.
Se huvud-README:n för API-översikt och driftsättning.

```bash
cp .env.example .env      # fyll i DATABASE_URL och JWT_SECRET
npm install
npx prisma migrate dev    # skapar tabellen User
npm run dev
```

Docker: `docker build -t login-api . && docker run -p 3001:3001 --env-file .env login-api`
(kör `prisma migrate deploy` automatiskt vid start).

Översikt över hela projektet, API-dokumentation och driftsättningsguide: [PROJEKT.md](PROJEKT.md)
