
import React, { useState, useEffect, useMemo } from 'react'
import { useTransactionsContext } from '../contexts/TransactionsContext'
import { useAuth } from '../contexts/AuthContext'
import { Transaction } from '../firebase/types'
import { categoryService } from '../firebase/services/categories'
import Lottie from 'lottie-react'

interface SummaryData {
  currentBalance: number
  currentMonthRevenue: number
  currentMonthExpense: number
  previousMonthRevenue: number
  previousMonthExpense: number
  revenuePercentage: number
  expensePercentage: number
  balancePercentage: number
}

const SummaryCards = () => {
  const { user } = useAuth()
  const { transactions, loading, error, createTransaction } = useTransactionsContext()
  const [makingMoneyAnimation, setMakingMoneyAnimation] = useState(null)

  // Carregar animação Lottie
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const animation = await import('../assets/Making Money.json')
        setMakingMoneyAnimation(animation.default)
      } catch (error) {
        console.warn('⚠️ Erro ao carregar animação Making Money:', error)
      }
    }
    loadAnimation()
  }, [])

  // Função para calcular dados do resumo
  const calculateSummaryData = (transactions: Transaction[]): SummaryData => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Mês anterior
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Filtrar transações do mês atual
    const currentMonthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear
    })

    // Filtrar transações do mês anterior
    const previousMonthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return transactionDate.getMonth() === previousMonth && 
             transactionDate.getFullYear() === previousYear
    })

    // Calcular receitas (apenas as que foram pagas/recebidas, independente do mês)
    const currentMonthRevenue = transactions
      .filter(t => t.type === 'receita' && t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0)

    // Calcular despesas (apenas as que foram pagas, independente do mês)
    const currentMonthExpense = transactions
      .filter(t => t.type === 'despesa' && t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0)


    // Calcular receitas do mês anterior (apenas as que foram pagas/recebidas)
    const previousMonthRevenue = previousMonthTransactions
      .filter(t => t.type === 'receita' && t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0)

    // Calcular despesas do mês anterior (apenas as que foram pagas)
    const previousMonthExpense = previousMonthTransactions
      .filter(t => t.type === 'despesa' && t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0)

    // Calcular saldo atual (receitas pagas - despesas pagas)
    const currentBalance = currentMonthRevenue - currentMonthExpense

    // Calcular percentuais de variação
    const revenuePercentage = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : 0

    const expensePercentage = previousMonthExpense > 0
      ? ((currentMonthExpense - previousMonthExpense) / previousMonthExpense) * 100
      : 0

    // Calcular percentual do saldo (baseado na variação líquida)
    const currentNet = currentMonthRevenue - currentMonthExpense
    const previousNet = previousMonthRevenue - previousMonthExpense
    const balancePercentage = previousNet !== 0
      ? ((currentNet - previousNet) / Math.abs(previousNet)) * 100
      : 0

    return {
      currentBalance,
      currentMonthRevenue,
      currentMonthExpense,
      previousMonthRevenue,
      previousMonthExpense,
      revenuePercentage,
      expensePercentage,
      balancePercentage
    }
  }

  // Calcular dados do resumo usando useMemo para evitar recálculos desnecessários
  const summaryData = useMemo(() => {
    if (transactions.length === 0) {
      return {
        currentBalance: 0,
        currentMonthRevenue: 0,
        currentMonthExpense: 0,
        previousMonthRevenue: 0,
        previousMonthExpense: 0,
        revenuePercentage: 0,
        expensePercentage: 0,
        balancePercentage: 0
      }
    }
    
    return calculateSummaryData(transactions)
  }, [transactions])

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Função para formatar percentuais
  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  // Se estiver carregando, mostrar loading
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow border animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="text-lg font-medium text-red-800">Erro ao carregar dados</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }



  return (
    <div className="mb-1.5 lg:mb-6">
      {/* Mobile: Carrossel horizontal */}
      <div className="lg:hidden space-y-3">
        {/* Saldo Atual - Card principal com contraste reduzido */}
        <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Saldo Atual</h3>
            <div className="relative flex items-center justify-center">
              <p className={`text-3xl font-black ${
                summaryData.currentBalance >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {summaryData.currentBalance >= 0 ? '+' : ''}{formatCurrency(summaryData.currentBalance)}
              </p>
              {summaryData.currentBalance < 0 && (
                <div className="absolute right-0 w-16 h-16 flex items-center justify-center">
                  {makingMoneyAnimation ? (
                    <Lottie 
                      animationData={makingMoneyAnimation}
                      loop={true}
                      autoplay={true}
                      style={{ width: '64px', height: '64px' }}
                    />
                  ) : (
                    <span className="text-red-600 text-6xl">⚠️</span>
                  )}
                </div>
              )}
              {summaryData.currentBalance >= 0 && (
                <div className="absolute right-0 w-16 h-16 flex items-center justify-center">
                  {makingMoneyAnimation ? (
                    <Lottie 
                      animationData={makingMoneyAnimation}
                      loop={true}
                      autoplay={true}
                      style={{ width: '64px', height: '64px' }}
                    />
                  ) : (
                    <span className="text-green-600 text-6xl">📈</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Receitas e Despesas - Cards com equilíbrio diferenciado */}
        <div className="flex space-x-3">
          {/* Receitas - Fundo branco */}
          <div className="bg-white p-3 rounded-xl shadow border border-gray-200 flex-1">
            <div className="text-center mb-2">
              <h3 className="text-xs font-medium text-green-600 mb-1">Receitas</h3>
              <p className="text-xl font-black text-green-700">
                {formatCurrency(summaryData.currentMonthRevenue)}
              </p>
            </div>
            
            {/* Mini barra de progresso mais grossa - Ocultada no mobile */}
            <div className="mt-3 hidden lg:block">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${summaryData.currentMonthRevenue > 0 ? 
                      Math.min((summaryData.currentMonthRevenue / (summaryData.currentMonthRevenue + summaryData.currentMonthExpense)) * 100, 100) : 0}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 text-center mt-2 font-medium">
                {summaryData.currentMonthRevenue > 0 ? 
                  Math.round((summaryData.currentMonthRevenue / (summaryData.currentMonthRevenue + summaryData.currentMonthExpense)) * 100) : 0}% da movimentação
              </p>
            </div>
          </div>
          
          {/* Despesas - Fundo branco */}
          <div className="bg-white p-3 rounded-xl shadow border border-gray-200 flex-1">
            <div className="text-center mb-2">
              <h3 className="text-xs font-medium text-red-600 mb-1">Despesas</h3>
              <p className="text-xl font-black text-red-700">
                {formatCurrency(summaryData.currentMonthExpense)}
              </p>
            </div>
            
            {/* Mini barra de progresso mais grossa - Ocultada no mobile */}
            <div className="mt-3 hidden lg:block">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-red-400 to-red-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${summaryData.currentMonthExpense > 0 ? 
                      Math.min((summaryData.currentMonthExpense / (summaryData.currentMonthRevenue + summaryData.currentMonthExpense)) * 100, 100) : 0}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 text-center mt-2 font-medium">
                {summaryData.currentMonthExpense > 0 ? 
                  Math.round((summaryData.currentMonthExpense / (summaryData.currentMonthRevenue + summaryData.currentMonthExpense)) * 100) : 0}% da movimentação
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Grid original */}
      <div className="hidden lg:grid grid-cols-3 gap-6">
        {/* Saldo Atual */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">💰</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Saldo Atual</h3>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(summaryData.currentBalance)}
          </p>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              summaryData.balancePercentage >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(summaryData.balancePercentage)}
            </span>
            <span className="text-sm text-gray-500">desde o mês passado</span>
          </div>
        </div>

        {/* Receitas */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xl">📈</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Receitas</h3>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(summaryData.currentMonthRevenue)}
          </p>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              summaryData.revenuePercentage >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(summaryData.revenuePercentage)}
            </span>
            <span className="text-sm text-gray-500">desde o mês passado</span>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">📉</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Despesas</h3>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(summaryData.currentMonthExpense)}
          </p>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              summaryData.expensePercentage <= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(summaryData.expensePercentage)}
            </span>
            <span className="text-sm text-gray-500">desde o mês passado</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SummaryCards

