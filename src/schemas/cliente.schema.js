import { z } from 'zod';

export const crearClienteSchema = z
  .object({
    tipoPersona: z.enum(['FISICA', 'JURIDICA']).default('FISICA'),
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    apellido: z.string().optional(),
    razonSocial: z.string().optional(),
    documento: z.string().min(6, 'El documento debe tener al menos 6 caracteres'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    telefono: z.string().min(6, 'El teléfono es obligatorio'),
    estado: z.enum(['LEAD', 'CLIENTE', 'INACTIVO']).default('LEAD'),
  })
  .superRefine((data, ctx) => {
    // Si es Persona Jurídica, la razón social es obligatoria
    if (data.tipoPersona === 'JURIDICA' && !data.razonSocial?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['razonSocial'],
        message: 'La razón social es obligatoria para personas jurídicas',
      });
    }

    // Si es Persona Física, el apellido es obligatorio
    if (data.tipoPersona === 'FISICA' && !data.apellido?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['apellido'],
        message: 'El apellido es obligatorio para personas físicas',
      });
    }
  });

export const actualizarClienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  apellido: z.string().optional(),
  razonSocial: z.string().optional(),
  documento: z.string().min(6).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().min(6).optional(),
  direccion: z.string().optional(),
  snActivo: z.boolean().optional(),
});

export const crearInteraccionSchema = z.object({
  canal: z.enum(['WHATSAPP', 'LLAMADA', 'VISITA_SALON', 'EMAIL']),
  resumen: z.string().min(3, 'El resumen debe tener al menos 3 caracteres'),
});

export const enviarCorreoClienteSchema = z.object({
  asunto: z.string().min(2, 'El asunto debe tener al menos 2 caracteres'),
  mensaje: z.string().min(5, 'El mensaje debe tener al menos 5 caracteres'),
  plantilla: z.string().optional(),
});
