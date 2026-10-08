import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Accept both CORS_ORIGIN (legacy) and CORS_ORIGINS (production docs) so
// either variable name works on Render/Railway.
if (!process.env.CORS_ORIGIN && process.env.CORS_ORIGINS) {
  process.env.CORS_ORIGIN = process.env.CORS_ORIGINS;
}

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5004),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  // No default: development falls back to the Vite origin below; production
  // MUST set this explicitly (guarded after parsing).
  CORS_ORIGIN: z.string().optional(),
  MAX_FILE_MB: z.coerce.number().int().positive().max(100).default(25),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  const problems = result.error.issues.map((i) => "  - " + (i.path.join(".") || "env") + ": " + i.message).join("\n");
  console.error("\nSYNCSPACE API cannot start - invalid env:\n" + problems + "\n");
  process.exit(1);
}
const values = result.data;
const corsSetting = (values.CORS_ORIGIN ?? "").trim();
const corsOrigins = corsSetting
  ? corsSetting.split(",").map((o) => o.trim()).filter(Boolean)
  : (values.NODE_ENV === "production" ? [] : ["http://localhost:5174"]);
if (values.NODE_ENV === "production" && corsOrigins.length === 0) {
  console.error("\nSYNCSPACE API cannot start - CORS_ORIGIN (or CORS_ORIGINS) must list the frontend origin(s) in production, e.g.\n  CORS_ORIGIN=https://your-frontend.vercel.app\n");
  process.exit(1);
}
export const env = {
  ...values,
  isProduction: values.NODE_ENV === "production",
  isDevelopment: values.NODE_ENV === "development",
  isTest: values.NODE_ENV === "test",
  corsOrigins,
};
export default env;
