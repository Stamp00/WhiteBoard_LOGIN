import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import routes from './routes.js';
import { notFound, errorHandler } from './errors.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use(routes);

app.use(notFound);
app.use(errorHandler);
