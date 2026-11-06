import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { manejadorErrores } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  return (
    allowedOrigins.includes(origin) ||
    /^https?:\/\/(localhost|127\.0\.0\.1):(?:5173|5174|4173)(?::\d+)?$/.test(origin)
  );
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Ruta de comprobación de salud del servidor
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', mensaje: 'CRM Concesionaria API funcionando' });
});

// Ruta raíz para que la API responda de forma útil cuando se abre la URL principal
app.get('/', (req, res) => {
  res.status(200).json({
    mensaje: 'CRM Concesionaria API funcionando',
    version: '1.0.0',
    health: '/health',
    endpoints: [
      'POST /auth/registro',
      'POST /auth/login',
      'GET /clientes',
      'POST /clientes',
      'GET /vehiculos',
      'GET /oportunidades',
      'GET /facturas',
      'GET /test-drives',
      'GET /tasaciones'
    ]
  });
});

// Rutas principales — un único punto de montaje
app.use('/', routes);

// Middleware centralizado de manejo de errores (siempre al final)
app.use(manejadorErrores);

export default app;

