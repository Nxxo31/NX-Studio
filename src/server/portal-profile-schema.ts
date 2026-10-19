// Zod schema + parsing para el endpoint POST /api/portal/profile.
//
// Por qué separado: el endpoint importa un solo helper para validar la forma
// exacta del body — el resto del módulo POST es I/O + side effects, no validación.
// Esto facilita testing aislado (tests/unit/portal-ui.test.ts).

import { z } from 'zod';

/**
 * Schema del body de POST /api/portal/profile.
 * Campos: todos opcionales (PATCH-like), pero al menos uno debe estar presente.
 */
export const ProfilePatchSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(180).optional(),
    empresa: z.string().trim().max(180).nullable().optional(),
    telefono: z.string().trim().max(40).nullable().optional(),
    pais: z.string().trim().length(2).nullable().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Se requiere al menos un campo para actualizar',
  });

export type ProfilePatchInput = z.infer<typeof ProfilePatchSchema>;