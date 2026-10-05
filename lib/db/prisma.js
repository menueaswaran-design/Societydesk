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