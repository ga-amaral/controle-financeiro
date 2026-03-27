'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'
import { BackgroundPaths } from '@/components/ui/BackgroundPaths'

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  color: string
}

interface Transaction {
  id: string
  amount: number
  date: string
  description: string
  type: 'INCOME' | 'EXPENSE'
  category: Category
}

interface DashboardData {
  year: number
  monthlyData: {
    month: number
    income: number
    expense: number
    balance: number
  }[]
  summary: {
    totalIncome: number
    totalExpense: number
    totalBalance: number
    currentMonthIncome: number
    currentMonthExpense: number
    currentMonthBalance: number
  }
  recentTransactions: Transaction[]
}

const months = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

export default function Dashboard() {
  const { user, token, logout, loading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'EXPENSE'
  })
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showMonthModal, setShowMonthModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; name: string } | null>(null)
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([])
  const [loadingMonth, setLoadingMonth] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editingMonthTransaction, setEditingMonthTransaction] = useState<Transaction | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteSource, setDeleteSource] = useState<'main' | 'month'>('main')
  const [formMonthData, setFormMonthData] = useState({
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE'
  })

  const fetchDashboard = async () => {
    if (!token) return
    try {
      const res = await fetch(`/api/dashboard?year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setData(data)
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const fetchMonthTransactions = async (month: number) => {
    setLoadingMonth(true)
    try {
      const res = await fetch(`/api/transactions?month=${month}&year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMonthTransactions(data)
      }
    } catch (error) {
      console.error('Erro ao carregar transações do mês:', error)
    } finally {
      setLoadingMonth(false)
    }
  }

  const openMonthModal = (month: number, name: string) => {
    setSelectedMonth({ month, name })
    fetchMonthTransactions(month)
    setShowMonthModal(true)
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (token) {
      fetchDashboard()
      fetchCategories()
    }
  }, [token, selectedYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = '/api/transactions'
    const method = editingTransaction ? 'PUT' : 'POST'
    const body = editingTransaction 
      ? { id: editingTransaction.id, ...formData }
      : formData

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      setShowModal(false)
      setEditingTransaction(null)
      setFormData({
        categoryId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'EXPENSE'
      })
      fetchDashboard()
    }
  }

  const handleDelete = async (id: string) => {
    setDeleteId(id)
    setDeleteSource('main')
    setShowDeleteModal(true)
  }

  const handleMonthTransactionDelete = async (id: string) => {
    setDeleteId(id)
    setDeleteSource('month')
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    
    const res = await fetch(`/api/transactions?id=${deleteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })

    if (res.ok) {
      fetchDashboard()
      if (deleteSource === 'month' && selectedMonth) {
        fetchMonthTransactions(selectedMonth.month)
      }
    }
    
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      categoryId: transaction.category.id,
      amount: transaction.amount.toString(),
      date: new Date(transaction.date).toISOString().split('T')[0],
      description: transaction.description,
      type: transaction.type
    })
    setShowModal(true)
  }

  const openEditMonthTransaction = (transaction: Transaction) => {
    setEditingMonthTransaction(transaction)
    setFormMonthData({
      categoryId: transaction.category.id,
      amount: transaction.amount.toString(),
      date: new Date(transaction.date).toISOString().split('T')[0],
      description: transaction.description,
      type: transaction.type
    })
    setShowTransactionModal(true)
  }

  const handleMonthTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = '/api/transactions'
    const method = editingMonthTransaction ? 'PUT' : 'POST'
    const body = editingMonthTransaction 
      ? { id: editingMonthTransaction.id, ...formMonthData }
      : formMonthData

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      setShowTransactionModal(false)
      setEditingMonthTransaction(null)
      setFormMonthData({
        categoryId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'EXPENSE'
      })
      if (selectedMonth) {
        fetchMonthTransactions(selectedMonth.month)
      }
      fetchDashboard()
    }
  }

  const openNewMonthTransaction = (month: number) => {
    setEditingMonthTransaction(null)
    const year = selectedYear
    const day = new Date(year, month - 1, new Date().getDate()).getDate()
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setFormMonthData({
      categoryId: '',
      amount: '',
      date: dateStr,
      description: '',
      type: 'EXPENSE'
    })
    setShowTransactionModal(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
          <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
      <BackgroundPaths />
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Financeiro</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-blue-200">Olá, {user.name}</span>
            <button
              onClick={() => {
                logout()
                router.push('/')
              }}
              className="text-blue-300 hover:text-white transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-white">Dashboard</h2>
          <div className="flex gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year} className="bg-slate-800">{year}</option>
              ))}
            </select>
          </div>
        </div>

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-blue-200">Saldo do Ano</h3>
                </div>
                <p className={`text-3xl font-bold ${data.summary.totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(data.summary.totalBalance)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-blue-200">Receitas</h3>
                </div>
                <p className="text-3xl font-bold text-blue-400">
                  {formatCurrency(data.summary.totalIncome)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-blue-200">Despesas</h3>
                </div>
                <p className="text-3xl font-bold text-red-400">
                  {formatCurrency(data.summary.totalExpense)}
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl mb-8 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Balanço Mensal</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Mês</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-blue-200 uppercase tracking-wider">Receitas</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-blue-200 uppercase tracking-wider">Despesas</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-blue-200 uppercase tracking-wider">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {data.monthlyData.map((month) => (
                      <tr 
                        key={month.month} 
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => openMonthModal(month.month, months[month.month - 1])}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white hover:text-blue-300">
                          {months[month.month - 1]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-400">
                          {formatCurrency(month.income)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-400">
                          {formatCurrency(month.expense)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${month.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(month.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Transações Recentes</h3>
              </div>
              <div className="divide-y divide-white/10">
                {data.recentTransactions.length === 0 ? (
                  <div className="px-6 py-12 text-center text-blue-300">
                    Nenhuma transação encontrada
                  </div>
                ) : (
                  data.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-4 h-4 rounded-full shadow-lg"
                          style={{ backgroundColor: transaction.category.color }}
                        ></div>
                        <div>
                          <p className="font-medium text-white">{transaction.category.name}</p>
                          <p className="text-sm text-blue-300">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                            {transaction.description && ` • ${transaction.description}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-bold text-lg ${transaction.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                        <button
                          onClick={() => openEditModal(transaction)}
                          className="text-blue-300 hover:text-white text-sm transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Tipo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'EXPENSE', categoryId: '' })}
                    className={`py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                      formData.type === 'EXPENSE' 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                        : 'bg-white/10 text-blue-200 hover:bg-white/20'
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'INCOME', categoryId: '' })}
                    className={`py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                      formData.type === 'INCOME' 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                        : 'bg-white/10 text-blue-200 hover:bg-white/20'
                    }`}
                  >
                    Receita
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Categoria</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" className="bg-slate-800">Selecione...</option>
                  {categories
                    .filter(c => c.type === formData.type)
                    .map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-slate-800">{cat.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  placeholder="0,00"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Descrição</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Opcional"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTransaction(null)
                  }}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMonthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/20 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {selectedMonth?.name} de {selectedYear}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectedMonth && openNewMonthTransaction(selectedMonth.month)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  + Nova
                </button>
                <button
                  onClick={() => {
                    setShowMonthModal(false)
                    setSelectedMonth(null)
                    setMonthTransactions([])
                  }}
                  className="text-blue-300 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {loadingMonth ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent"></div>
                </div>
              ) : monthTransactions.length === 0 ? (
                <div className="text-center py-12 text-blue-300">
                  Nenhuma transação neste mês
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-white/5 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-200 uppercase">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-200 uppercase">Categoria</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-200 uppercase">Descrição</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-blue-200 uppercase">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {monthTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-sm text-white">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: transaction.category.color }}
                            ></div>
                            <span className="text-sm text-white">{transaction.category.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-200">
                          {transaction.description || '-'}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-medium ${transaction.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openEditMonthTransaction(transaction)}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleMonthTransactionDelete(transaction.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/20 bg-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-blue-200">
                  Total: {monthTransactions.length} transação{monthTransactions.length !== 1 ? 'ões' : ''}
                </span>
                <span className="text-emerald-400 font-medium">
                  Receitas: {formatCurrency(monthTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0))}
                </span>
                <span className="text-red-400 font-medium">
                  Despesas: {formatCurrency(monthTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingMonthTransaction ? 'Editar Transação' : 'Nova Transação'}
            </h3>
            <form onSubmit={handleMonthTransactionSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Tipo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormMonthData({ ...formMonthData, type: 'EXPENSE', categoryId: '' })}
                    className={`py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                      formMonthData.type === 'EXPENSE' 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                        : 'bg-white/10 text-blue-200 hover:bg-white/20'
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMonthData({ ...formMonthData, type: 'INCOME', categoryId: '' })}
                    className={`py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                      formMonthData.type === 'INCOME' 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                        : 'bg-white/10 text-blue-200 hover:bg-white/20'
                    }`}
                  >
                    Receita
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Categoria</label>
                <select
                  value={formMonthData.categoryId}
                  onChange={(e) => setFormMonthData({ ...formMonthData, categoryId: e.target.value })}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" className="bg-slate-800">Selecione...</option>
                  {categories
                    .filter(c => c.type === formMonthData.type)
                    .map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-slate-800">{cat.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formMonthData.amount}
                  onChange={(e) => setFormMonthData({ ...formMonthData, amount: e.target.value })}
                  required
                  placeholder="0,00"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Data</label>
                <input
                  type="date"
                  value={formMonthData.date}
                  onChange={(e) => setFormMonthData({ ...formMonthData, date: e.target.value })}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Descrição</label>
                <input
                  type="text"
                  value={formMonthData.description}
                  onChange={(e) => setFormMonthData({ ...formMonthData, description: e.target.value })}
                  placeholder="Opcional"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionModal(false)
                    setEditingMonthTransaction(null)
                  }}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Confirmar Exclusão</h3>
              <p className="text-blue-200 mb-6">Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteId(null)
                  }}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
