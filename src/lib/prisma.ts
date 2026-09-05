// Sample prisma client export used by API routes in this repo.
// Install and configure Prisma/DB separately when integrating.
import { PrismaClient } from '@prisma/client'

declare global {
  // prevent multiple instantiation in dev
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma
