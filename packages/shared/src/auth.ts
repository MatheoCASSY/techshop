import { z } from 'zod';

export const ROLES = ['customer', 'admin'] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

const emailSchema = z.email().trim().toLowerCase().max(254);

export const registerSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(2).max(80),
  // Longueur minimale recommandée par l'ANSSI / OWASP ; plafond pour borner le coût du hachage
  password: z.string().min(8).max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: roleSchema,
});
export type User = z.infer<typeof userSchema>;
