import { PrismaClient } from "@prisma/client";

// Next.js reloads modules a lot during development, which would normally
// create a fresh database connection every time and quickly exhaust the
// connection limit. This keeps a single shared Prisma client around on the
// global object in development, while production just creates one normally.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
