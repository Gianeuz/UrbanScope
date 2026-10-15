import { PrismaClient } from "@prisma/client";

/**
 * Single PrismaClient instance. In development, Next.js hot-reloads modules,
 * so the client is cached on globalThis to avoid exhausting connections.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
