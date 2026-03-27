import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export async function getPrisma() {
  console.log('getPrisma called, DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'NOT SET')
  
  if (globalForPrisma.prisma) {
    console.log('Returning existing prisma client')
    return globalForPrisma.prisma
  }
  
  if (!process.env.DATABASE_URL) {
    const error = new Error('DATABASE_URL not defined')
    console.error('DATABASE_URL missing!')
    throw error
  }
  
  console.log('Creating new PrismaClient')
  globalForPrisma.prisma = new PrismaClient({
    log: ['error', 'warn', 'query'],
  })
  return globalForPrisma.prisma
}
