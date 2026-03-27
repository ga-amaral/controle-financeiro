import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        amount: true,
        type: true,
        date: true
      }
    })

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthTransactions = transactions.filter(t => {
        const month = new Date(t.date).getMonth()
        return month === i
      })

      const income = monthTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)

      const expense = monthTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        month: i + 1,
        income,
        expense,
        balance: income - expense
      }
    })

    const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0)
    const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0)
    const totalBalance = totalIncome - totalExpense

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const currentMonthData = monthlyData[currentMonth - 1]

    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
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
      orderBy: { date: 'desc' },
      take: 5
    })

    return NextResponse.json({
      year,
      monthlyData,
      summary: {
        totalIncome,
        totalExpense,
        totalBalance,
        currentMonthIncome: currentMonthData.income,
        currentMonthExpense: currentMonthData.expense,
        currentMonthBalance: currentMonthData.balance
      },
      recentTransactions
    })
  } catch (error) {
    console.error('Erro no dashboard:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
