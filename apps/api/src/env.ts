import { z } from 'zod';

// Valeur d'exemple des fichiers .env.example : ne doit jamais servir en production
const PLACEHOLDER_SECRET_PREFIX = 'remplacer-par';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    // Secret de signature des JWT : au moins 32 caractères (256 bits)
    JWT_SECRET: z.string().min(32, 'JWT_SECRET doit faire au moins 32 caractères'),
    // Tentatives de connexion / inscription autorisées par minute et par IP
    AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(10),
  })
  .refine(
    (env) => env.NODE_ENV !== 'production' || !env.JWT_SECRET.startsWith(PLACEHOLDER_SECRET_PREFIX),
    { message: 'JWT_SECRET contient encore la valeur d’exemple', path: ['JWT_SECRET'] },
  );

export type Env = z.infer<typeof envSchema>;

/** Valide les variables d'environnement au démarrage : on échoue tôt plutôt qu'en pleine requête. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Variables d'environnement invalides :\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
