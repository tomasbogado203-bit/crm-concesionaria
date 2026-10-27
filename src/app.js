import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { manejadorErrores } from './middlewares/error.middleware.js';

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

// Rutas principales — un único punto de montaje
app.use('/', routes);

// Middleware centralizado de manejo de errores (siempre al final)
app.use(manejadorErrores);

export default app;

