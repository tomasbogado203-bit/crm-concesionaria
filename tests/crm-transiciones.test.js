import { TRANSICIONES_PERMITIDAS } from '../src/services/oportunidad.service.js';

describe('Reglas de Negocio del CRM: Transiciones de Etapa y Conflictos (Clase 7)', () => {
  it('debe definir la matriz de transiciones formal del pipeline', () => {
    expect(TRANSICIONES_PERMITIDAS).toBeDefined();
    expect(TRANSICIONES_PERMITIDAS.PROSPECTO).toContain('TEST_DRIVE');
    expect(TRANSICIONES_PERMITIDAS.PROSPECTO).toContain('NEGOCIACION');
    expect(TRANSICIONES_PERMITIDAS.PROSPECTO).toContain('RESERVADO');
    expect(TRANSICIONES_PERMITIDAS.PROSPECTO).toContain('PERDIDA');
  });

  it('no debe permitir saltar arbitrariamente de PROSPECTO directo a GANADA sin negociación previa ni facturación', () => {
    expect(TRANSICIONES_PERMITIDAS.PROSPECTO).not.toContain('GANADA');
  });

  it('debe permitir avanzar a GANADA desde NEGOCIACION o RESERVADO', () => {
    expect(TRANSICIONES_PERMITIDAS.NEGOCIACION).toContain('GANADA');
    expect(TRANSICIONES_PERMITIDAS.RESERVADO).toContain('GANADA');
  });

  it('la etapa GANADA debe ser terminal sin transiciones salientes', () => {
    expect(TRANSICIONES_PERMITIDAS.GANADA).toHaveLength(0);
  });

  it('debe permitir reapertura comercial únicamente desde PERDIDA hacia PROSPECTO o NEGOCIACION', () => {
    expect(TRANSICIONES_PERMITIDAS.PERDIDA).toContain('PROSPECTO');
    expect(TRANSICIONES_PERMITIDAS.PERDIDA).toContain('NEGOCIACION');
    expect(TRANSICIONES_PERMITIDAS.PERDIDA).not.toContain('GANADA');
  });
});
