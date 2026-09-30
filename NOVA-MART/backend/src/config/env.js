import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment schema. The API refuses to boot with an invalid configuration so
 * that missing secrets surface immediately instead of at request time.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (see .env.example)'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  const problems = result.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');

  console.error(
    `\nNOVA MART API cannot start - invalid environment configuration:\n${problems}\n\n` +
      'Copy backend/.env.example to backend/.env and fill in the values.\n'
  );
  process.exit(1);
}

const values = result.data;

export const env = {
  ...values,
  isProduction: values.NODE_ENV === 'production',
  isDevelopment: values.NODE_ENV === 'development',
  isTest: values.NODE_ENV === 'test',
  /** Browser origins allowed by CORS. */
  corsOrigins: values.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export default env;
