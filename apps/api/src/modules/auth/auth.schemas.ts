import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
  firstName: z.string().min(1, 'Nombre requerido').max(80),
  lastName: z.string().min(1, 'Apellido requerido').max(80),
  phone: z.string().min(7).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password requerido'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'refreshToken requerido'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
