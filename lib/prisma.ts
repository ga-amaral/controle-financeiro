import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export async function getPrisma() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not defined')
  }
  
  globalForPrisma.prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
  return globalForPrisma.prisma
}
