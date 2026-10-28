import { registroSchema, crearUsuarioAdminSchema, loginSchema } from '../src/schemas/auth.schema.js';
import { crearClienteSchema, actualizarClienteSchema } from '../src/schemas/cliente.schema.js';
import { crearVehiculoSchema, actualizarVehiculoSchema } from '../src/schemas/vehiculo.schema.js';
import { crearOportunidadSchema, cambiarEtapaSchema, registrarSeniaSchema } from '../src/schemas/oportunidad.schema.js';
import { emitirFacturaSchema, registrarPagoSchema } from '../src/schemas/factura.schema.js';
import { agendarTestDriveSchema } from '../src/schemas/testdrive.schema.js';

describe('Validación de Esquemas Zod (Clase 6)', () => {
  describe('auth.schema', () => {
    it('registroSchema debe validar email y longitud de password', () => {
      const invalido = {
        nombre: 'A',
        email: 'no-es-un-email',
        password: '123',
      };
      const res = registroSchema.safeParse(invalido);
      expect(res.success).toBe(false);
    });

    it('registroSchema público no debe aceptar ni fijar el rol ADMIN en su validación', () => {
      const valido = {
        nombre: 'Juan Perez',
        email: 'juan@test.com',
        password: 'passwordSeguro123',
      };
      const res = registroSchema.safeParse(valido);
      expect(res.success).toBe(true);
      expect(res.data.rol).toBeUndefined();
    });

    it('crearUsuarioAdminSchema debe exigir rol válido para creación por admin', () => {
      const adminValido = {
        nombre: 'Admin General',
        email: 'admin@concesionaria.com',
        password: 'passwordSuperAdmin123',
        rol: 'ADMIN',
      };
      const res = crearUsuarioAdminSchema.safeParse(adminValido);
      expect(res.success).toBe(true);
    });

    it('loginSchema debe rechazar campos vacíos', () => {
      const invalido = { email: '', password: '' };
      const res = loginSchema.safeParse(invalido);
      expect(res.success).toBe(false);
    });
  });

  describe('cliente.schema', () => {
    it('crearClienteSchema debe exigir nombre, apellido, documento y teléfono para persona física', () => {
      const valido = {
        tipoPersona: 'FISICA',
        nombre: 'Carlos',
        apellido: 'Gomez',
        documento: '38123456',
        telefono: '3764123456',
      };
      expect(crearClienteSchema.safeParse(valido).success).toBe(true);

      const sinApellido = {
        tipoPersona: 'FISICA',
        nombre: 'Carlos',
        documento: '38123456',
        telefono: '3764123456',
      };
      expect(crearClienteSchema.safeParse(sinApellido).success).toBe(false);
    });

    it('crearClienteSchema debe exigir razón social para persona jurídica', () => {
      const juridicaSinRazon = {
        tipoPersona: 'JURIDICA',
        nombre: 'Empresa SA',
        documento: '30712345678',
        telefono: '3764123456',
      };
      expect(crearClienteSchema.safeParse(juridicaSinRazon).success).toBe(false);

      const juridicaValida = {
        ...juridicaSinRazon,
        razonSocial: 'Empresa Posadas SA',
      };
      expect(crearClienteSchema.safeParse(juridicaValida).success).toBe(true);
    });
  });

  describe('vehiculo.schema', () => {
    it('crearVehiculoSchema debe validar vin, marca, modelo y año positivo', () => {
      const valido = {
        vin: 'VIN1234567890ABCD',
        marca: 'Toyota',
        modelo: 'Corolla',
        version: 'XEI 2.0',
        anio: 2024,
        precioVenta: 25000000,
      };
      expect(crearVehiculoSchema.safeParse(valido).success).toBe(true);

      const anioInvalido = { ...valido, anio: 1800 };
      expect(crearVehiculoSchema.safeParse(anioInvalido).success).toBe(false);
    });
  });

  describe('oportunidad.schema', () => {
    it('crearOportunidadSchema debe requerir clienteId, vehiculoId y montoEstimado positivo', () => {
      const valido = {
        clienteId: 1,
        vehiculoId: 2,
        montoEstimado: 15000000,
      };
      expect(crearOportunidadSchema.safeParse(valido).success).toBe(true);

      const montoNegativo = { ...valido, montoEstimado: -500 };
      expect(crearOportunidadSchema.safeParse(montoNegativo).success).toBe(false);
    });

    it('cambiarEtapaSchema debe requerir una etapa válida de la enumeración', () => {
      expect(cambiarEtapaSchema.safeParse({ etapa: 'TEST_DRIVE' }).success).toBe(true);
      expect(cambiarEtapaSchema.safeParse({ etapa: 'ETAPA_INEXISTENTE' }).success).toBe(false);
    });

    it('registrarSeniaSchema debe validar monto de seña positivo', () => {
      expect(registrarSeniaSchema.safeParse({ montoSenia: 500000, metodoPago: 'EFECTIVO' }).success).toBe(true);
      expect(registrarSeniaSchema.safeParse({ montoSenia: 0 }).success).toBe(false);
    });
  });

  describe('factura.schema', () => {
    it('emitirFacturaSchema debe requerir al menos un ítem con precio y cantidad', () => {
      const valida = {
        clienteId: 1,
        tipoComprobante: 'FACTURA_B',
        items: [
          {
            descripcion: 'Toyota Corolla 2024',
            cantidad: 1,
            precioUnitario: 25000000,
          },
        ],
      };
      expect(emitirFacturaSchema.safeParse(valida).success).toBe(true);

      const sinItems = { clienteId: 1, items: [] };
      expect(emitirFacturaSchema.safeParse(sinItems).success).toBe(false);
    });
  });

  describe('testdrive.schema', () => {
    it('agendarTestDriveSchema debe requerir cliente, vehiculo, fecha y licencia', () => {
      const valido = {
        clienteId: 1,
        vehiculoId: 1,
        fechaHora: new Date().toISOString(),
        licenciaConducir: 'B1-38123456',
      };
      expect(agendarTestDriveSchema.safeParse(valido).success).toBe(true);
    });
  });
});
