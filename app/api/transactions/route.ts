import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const categoryId = searchParams.get('categoryId')

    const where: any = { userId: user.id }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0)
      where.date = {
        gte: startDate,
        lte: endDate
      }
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            type: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { categoryId, amount, date, description, type } = await request.json()

    if (!categoryId || !amount || !date || !type) {
      return NextResponse.json(
        { error: 'Categoria, valor, data e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: user.id }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId,
        amount: parseFloat(amount),
        date: new Date(date),
        description: description || '',
        type
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            type: true
          }
        }
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Erro ao criar transação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { id, categoryId, amount, date, description, type } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(categoryId && { categoryId }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(description !== undefined && { description }),
        ...(type && { type })
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            type: true
          }
        }
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Erro ao atualizar transação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    await prisma.transaction.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Transação excluída' })
  } catch (error) {
    console.error('Erro ao excluir transação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
