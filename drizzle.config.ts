import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Use DATABASE_URL env. For local dev create .env with:
    // DATABASE_URL=postgresql://user:password@localhost:5432/paymatrix
    url: process.env.DATABASE_URL ?? "postgresql://postgres:Karan%40123@localhost:5432/paymatrix",
  },
  verbose: true,
  strict: true,
});
