import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const prisma = await getPrisma()
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido' },
        { status: 400 }
      )
    }

    const { name, email, password } = body || {}

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    const defaultCategories = [
      { name: 'Salário', type: 'INCOME' as const, color: '#10B981' },
      { name: 'Freelance', type: 'INCOME' as const, color: '#34D399' },
      { name: 'Investimentos', type: 'INCOME' as const, color: '#6EE7B7' },
      { name: 'Alimentação', type: 'EXPENSE' as const, color: '#EF4444' },
      { name: 'Transporte', type: 'EXPENSE' as const, color: '#F97316' },
      { name: 'Moradia', type: 'EXPENSE' as const, color: '#8B5CF6' },
      { name: 'Lazer', type: 'EXPENSE' as const, color: '#EC4899' },
      { name: 'Saúde', type: 'EXPENSE' as const, color: '#06B6D4' },
      { name: 'Educação', type: 'EXPENSE' as const, color: '#F59E0B' },
      { name: 'Outros', type: 'EXPENSE' as const, color: '#6B7280' }
    ]

    await prisma.category.createMany({
      data: defaultCategories.map(cat => ({
        ...cat,
        userId: user.id
      }))
    })

    const token = generateToken(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    })
  } catch (error) {
    console.error('Erro no registro:', error)
    return NextResponse.json(
      { error: 'Erro ao criar usuário', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
