import { PrismaClient } from "@prisma/client";

// Next.js dev server hot-reloads modules, which would otherwise create a new
// PrismaClient on every reload and exhaust the DB connection pool.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

/**
 * Executes a database operation with an automatic single retry if the serverless
 * connection pooler closed an idle connection (e.g. Supabase PgBouncer P1017).
 */
export async function withDbRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    const isConnError =
      err?.message?.includes("closed the connection") ||
      err?.message?.includes("Connection lost") ||
      err?.code === "P1017" ||
      err?.code === "P1001" ||
      err?.code === "P1008";

    if (isConnError) {
      try {
        await prisma.$disconnect();
      } catch {}
      return await fn();
    }
    throw err;
  }
}
