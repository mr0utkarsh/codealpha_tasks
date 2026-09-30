import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5004),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5174"),
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
export const env = {
  ...values,
  isProduction: values.NODE_ENV === "production",
  isDevelopment: values.NODE_ENV === "development",
  isTest: values.NODE_ENV === "test",
  corsOrigins: values.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean),
};
export default env;
