import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { autenticarToken, autorizarPerfiles } from '../src/middlewares/auth.middleware.js';

describe('Middleware de Autenticación y Autorización (RBAC)', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'secreto_default';

  describe('autenticarToken', () => {
    it('debe responder 401 si no se envía header Authorization', () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      autenticarToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Token no proporcionado') })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('debe responder 403 si el token es inválido o corrupto', () => {
      const req = {
        headers: { authorization: 'Bearer token_invalido_123' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      autenticarToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Token inválido') })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('debe asignar req.user y llamar a next() si el token es legítimo', () => {
      const payloadMock = { id: 10, email: 'vendedor@test.com', perfiles: ['VENDEDOR'] };
      const token = jwt.sign(payloadMock, JWT_SECRET, { expiresIn: '1h' });

      const req = {
        headers: { authorization: `Bearer ${token}` },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      autenticarToken(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(10);
      expect(req.user.perfiles).toContain('VENDEDOR');
    });
  });

  describe('autorizarPerfiles', () => {
    it('debe responder 403 si el usuario no tiene perfiles', () => {
      const middleware = autorizarPerfiles('ADMIN', 'FACTURADOR');
      const req = { user: { id: 1 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('debe denegar 403 si el perfil no coincide con los autorizados', () => {
      const middleware = autorizarPerfiles('FACTURADOR');
      const req = { user: { id: 2, perfiles: ['VENDEDOR'] } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('FACTURADOR') })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('debe autorizar y llamar a next() si el perfil del usuario coincide', () => {
      const middleware = autorizarPerfiles('VENDEDOR', 'FACTURADOR');
      const req = { user: { id: 3, perfiles: ['VENDEDOR'] } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('debe otorgar bypass total a usuarios con perfil ADMIN', () => {
      const middleware = autorizarPerfiles('FACTURADOR');
      const req = { user: { id: 99, perfiles: ['ADMIN'] } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
