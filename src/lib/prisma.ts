// Safe Prisma client export. If @prisma/client is not generated or DATABASE_URL
// is not set, this module exports `prisma = null` and logs a warning. API routes
// should check `process.env.DATABASE_URL` and whether `prisma` is available.

declare global {
  // prevent multiple instantiation in dev
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var prisma: any
}

let prisma: any = null
try {
  // require dynamically so import fails can be caught
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client')
  prisma = global.prisma ?? new PrismaClient()
  if (process.env.NODE_ENV !== 'production') global.prisma = prisma
} catch (err) {
  // @prisma/client not generated or not installed
  // Leave prisma as null; callers must handle this case.
  // Use console.warn so developer sees actionable message.
  // Note: this is safe for mock-mode where DATABASE_URL is unset.
  // eslint-disable-next-line no-console
  console.warn('@prisma/client not available — Prisma client disabled. Run `npx prisma generate` to enable.')
}

export { prisma }
