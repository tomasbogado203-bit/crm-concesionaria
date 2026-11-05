import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { manejadorErrores } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();

// Configuración de CORS estricta: permite únicamente el origen real del frontend
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // la URL real del frontend
    credentials: true, // solo si mandás cookies o headers de autenticación
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
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

