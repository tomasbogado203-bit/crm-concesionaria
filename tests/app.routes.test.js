import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';

describe('Pruebas de Integración de Endpoints y Seguridad (Supertest + Jest - Clase 8)', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'secreto_default';

  // Generar tokens de prueba
  const tokenVendedor = jwt.sign(
    { id: 1, email: 'vendedor@test.com', perfiles: ['VENDEDOR'] },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const tokenFacturador = jwt.sign(
    { id: 2, email: 'facturador@test.com', perfiles: ['FACTURADOR'] },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const tokenAdmin = jwt.sign(
    { id: 99, email: 'admin@test.com', perfiles: ['ADMIN'] },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  describe('1. Endpoint de Salud (Health)', () => {
    it('GET /health debe responder 200 OK y estado "ok"', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('2. Control de Acceso: Bloqueo sin autenticación (401)', () => {
    it('GET /clientes sin token debe rechazar con 401 Unauthorized', async () => {
      const res = await request(app).get('/clientes');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Token no proporcionado');
    });

    it('POST /facturas sin token debe rechazar con 401', async () => {
      const res = await request(app).post('/facturas').send({});
      expect(res.status).toBe(401);
    });

    it('GET /vehiculos sin token debe rechazar con 401', async () => {
      const res = await request(app).get('/vehiculos');
      expect(res.status).toBe(401);
    });
  });

  describe('3. Control de Acceso por Perfiles / RBAC Estricto (403)', () => {
    it('VENDEDOR no debe poder crear usuarios administrativos (POST /auth/usuarios) -> 403', async () => {
      const res = await request(app)
        .post('/auth/usuarios')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({
          nombre: 'Hacker',
          email: 'hack@test.com',
          password: 'password123',
          rol: 'ADMIN',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Acceso denegado');
    });

    it('VENDEDOR no debe poder listar usuarios (GET /auth/usuarios) -> 403', async () => {
      const res = await request(app)
        .get('/auth/usuarios')
        .set('Authorization', `Bearer ${tokenVendedor}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Acceso denegado');
    });

    it('Cualquier intento de registro público anónimo (POST /auth/registro) debe ser denegado con 403', async () => {
      const res = await request(app).post('/auth/registro').send({
        nombre: 'Cualquiera',
        email: 'anon@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('deshabilitado');
    });

    it('VENDEDOR no debe poder emitir facturas fiscales (POST /facturas) -> 403', async () => {
      const res = await request(app)
        .post('/facturas')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({
          clienteId: 1,
          items: [{ descripcion: 'Auto', precioUnitario: 1000000 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('FACTURADOR');
    });

    it('VENDEDOR no debe poder eliminar clientes físicamente/lógicamente (DELETE /clientes/:id) -> 403', async () => {
      const res = await request(app)
        .delete('/clientes/1')
        .set('Authorization', `Bearer ${tokenVendedor}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('ADMIN');
    });

    it('VENDEDOR no debe poder dar de alta vehículos de stock (POST /vehiculos) -> 403', async () => {
      const res = await request(app)
        .post('/vehiculos')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({
          vin: 'TEST123456789',
          marca: 'Ford',
          modelo: 'Focus',
          version: 'SE',
          anio: 2022,
          precioVenta: 18000000,
        });

      expect(res.status).toBe(403);
    });

    it('FACTURADOR no debe poder agendar pruebas de manejo (POST /test-drives) -> 403', async () => {
      const res = await request(app)
        .post('/test-drives')
        .set('Authorization', `Bearer ${tokenFacturador}`)
        .send({
          clienteId: 1,
          vehiculoId: 1,
          fechaHora: new Date().toISOString(),
          licenciaConducir: 'B1-1234',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('4. Validación de Esquemas y Códigos de Error (400 Zod)', () => {
    it('POST /auth/usuarios con payload inválido debe responder 400 con detalles de Zod', async () => {
      const res = await request(app)
        .post('/auth/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'A',
          email: 'invalido',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Error de validación');
      expect(Array.isArray(res.body.detalles)).toBe(true);
    });

    it('PATCH /oportunidades/1/etapa con etapa no enumerada debe responder 400', async () => {
      const res = await request(app)
        .patch('/oportunidades/1/etapa')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({ etapa: 'ESTADO_FANTASMA' });

      expect(res.status).toBe(400);
    });
  });
});
