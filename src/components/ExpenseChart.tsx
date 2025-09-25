import React, { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts'
import { useTransactionsContext } from '../contexts/TransactionsContext'
import { useCategories } from '../hooks/useCategories'
import { useAuth } from '../contexts/AuthContext'

const ExpenseChart = () => {
  const [activeFilter, setActiveFilter] = useState('receita-vs-despesa')
  const [hoveredData, setHoveredData] = useState<any>(null)
  const [legendHovered, setLegendHovered] = useState<string | null>(null)
  
  // Hooks para dados
  const { user } = useAuth()
  const { transactions, loading: transactionsLoading, error: transactionsError } = useTransactionsContext()
  const { categories } = useCategories(user?.uid || 'test-user-123')
  
  // Processar dados das transações
  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return []
    }
    
    // Filtrar transações pelo tipo selecionado e excluir parcelas pagas
    const filteredTransactions = transactions.filter(transaction => {
      // Filtrar parcelas pagas - se for uma parcela e estiver marcada como paga, não incluir no gráfico
      const isPaidInstallment = transaction.installmentNumber && transaction.isPaid === true;
      if (isPaidInstallment) {
        return false;
      }
      
      if (activeFilter === 'receita-vs-despesa') {
        return true // Mostrar todas as transações (exceto parcelas pagas)
      }
      return transaction.type === activeFilter
    })
    
    if (filteredTransactions.length === 0) {
      return []
    }
    
    // Se for "Receita vs Despesa", agrupar por tipo (receita/despesa)
    if (activeFilter === 'receita-vs-despesa') {
      const typeTotals = filteredTransactions.reduce((acc, transaction) => {
        const typeName = transaction.type === 'receita' ? 'Receitas' : 'Despesas'
        if (!acc[typeName]) {
          acc[typeName] = 0
        }
        
        // Para transações parceladas, usar apenas o valor da parcela individual
        acc[typeName] += transaction.amount
        
        return acc
      }, {} as Record<string, number>)
      
      // Calcular total para percentuais
      const total = Object.values(typeTotals).reduce((sum, amount) => sum + amount, 0)
      
      // Converter para formato do gráfico com cores específicas
      return Object.entries(typeTotals).map(([typeName, amount]) => {
        const percentage = total > 0 ? (amount / total) * 100 : 0
        const color = typeName === 'Receitas' ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)'
        
        return {
          name: typeName,
          value: percentage,
          color: color,
          amount: `R$ ${amount.toFixed(2).replace('.', ',')}`,
          totalAmount: amount
        }
      }).sort((a, b) => b.totalAmount - a.totalAmount)
    }
    
    // Agrupar por categoria (para outros filtros)
    const categoryTotals = filteredTransactions.reduce((acc, transaction) => {
      const categoryName = transaction.category
      if (!acc[categoryName]) {
        acc[categoryName] = 0
      }
      
      // Para transações parceladas, usar apenas o valor da parcela individual
      // transaction.amount = valor da parcela individual
      // transaction.totalInstallmentAmount = valor total original
      acc[categoryName] += transaction.amount
      
      return acc
    }, {} as Record<string, number>)
    
    // Calcular total para percentuais
    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)
    
    // Converter para formato do gráfico
    return Object.entries(categoryTotals).map(([categoryName, amount]) => {
      // Buscar categoria para pegar cor e ícone
      const category = categories.find(cat => cat.name === categoryName)
      const percentage = total > 0 ? (amount / total) * 100 : 0
      
      return {
        name: categoryName,
        value: percentage,
        color: category?.color || '#6b7280',
        amount: `R$ ${amount.toFixed(2).replace('.', ',')}`,
        totalAmount: amount
      }
    }).sort((a, b) => b.totalAmount - a.totalAmount) // Ordenar por valor decrescente
  }, [transactions, activeFilter, categories])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-gray-600">{data.amount}</p>
          <p className="text-gray-500">{data.value.toFixed(1).replace('.', ',')}% do total</p>
        </div>
      )
    }
    return null
  }

  // Loading state
  if (transactionsLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Carregando dados...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (transactionsError) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-600">
            <p>Erro ao carregar dados</p>
            <p className="text-sm mt-1">{transactionsError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 lg:p-6 rounded-lg shadow border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
        <h3 className="text-base lg:text-lg font-semibold text-gray-900">
          {activeFilter === 'receita-vs-despesa' 
            ? 'Receita vs Despesa' 
            : activeFilter === 'despesa' 
            ? 'Despesas' 
            : 'Receitas'
          }
        </h3>
        <div className="flex items-center space-x-2">
          {/* Filtros: Receita, Despesa, Receita vs Despesa */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveFilter('receita-vs-despesa')}
              className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-md text-xs lg:text-sm font-medium transition-all duration-200 ${
                activeFilter === 'receita-vs-despesa'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{
                backgroundColor: activeFilter === 'receita-vs-despesa' ? 'rgba(59, 130, 246, 0.6)' : undefined,
                color: activeFilter === 'receita-vs-despesa' ? 'white' : undefined
              }}
            >
              📊 Receita vs Despesa
            </button>
            <button
              onClick={() => setActiveFilter('receita')}
              className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-md text-xs lg:text-sm font-medium transition-all duration-200 ${
                activeFilter === 'receita'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{
                backgroundColor: activeFilter === 'receita' ? 'rgba(34, 197, 94, 0.6)' : undefined,
                color: activeFilter === 'receita' ? 'white' : undefined
              }}
            >
              💰 Receita
            </button>
            <button
              onClick={() => setActiveFilter('despesa')}
              className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-md text-xs lg:text-sm font-medium transition-all duration-200 ${
                activeFilter === 'despesa'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{
                backgroundColor: activeFilter === 'despesa' ? 'rgba(239, 68, 68, 0.6)' : undefined,
                color: activeFilter === 'despesa' ? 'white' : undefined
              }}
            >
              💸 Despesa
            </button>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <p>
              {activeFilter === 'receita-vs-despesa' 
                ? 'Nenhuma transação encontrada' 
                : activeFilter === 'despesa' 
                ? 'Nenhuma despesa encontrada' 
                : 'Nenhuma receita encontrada'
              }
            </p>
            <p className="text-sm mt-1">Adicione transações para ver o gráfico</p>
          </div>
        </div>
      ) : (
        <div className="relative h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                paddingAngle={2}
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
                onMouseEnter={(data) => setHoveredData(data)}
                onMouseLeave={() => setHoveredData(null)}
              >
                {data.map((entry, index) => {
                  const isLegendHovered = legendHovered === entry.name
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      style={{
                        filter: isLegendHovered ? 'brightness(1.3) drop-shadow(0 0 12px rgba(0,0,0,0.4)) saturate(1.2)' : 'none',
                        transition: 'all 0.3s ease',
                        transform: isLegendHovered ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center'
                      }}
                    />
                  )
                })}
                <Label
                  position="center"
                  content={() => {
                    if (hoveredData) {
                      return (
                        <g>
                          <text
                            x="50%"
                            y="35%"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="14"
                            fontWeight="bold"
                            fill="#1f2937"
                          >
                            {hoveredData.name}
                          </text>
                          <text
                            x="50%"
                            y="45%"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="16"
                            fontWeight="bold"
                            fill="#1f2937"
                          >
                            {hoveredData.amount}
                          </text>
                          <text
                            x="50%"
                            y="55%"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="12"
                            fill="#6b7280"
                          >
                            {hoveredData.value.toFixed(1).replace('.', ',')}%
                          </text>
                        </g>
                      )
                    } else {
                      const totalAmount = data.reduce((sum, item) => sum + item.totalAmount, 0)
                      return (
                        <g>
                          <text
                            x="50%"
                            y="35%"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="14"
                            fontWeight="bold"
                            fill="#1f2937"
                          >
                            {activeFilter === 'receita-vs-despesa'
                              ? 'Total Geral'
                              : activeFilter === 'despesa'
                              ? 'Total Despesas'
                              : 'Total Receitas'
                            }
                          </text>
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="16"
                            fontWeight="bold"
                            fill="#1f2937"
                          >
                            R$ {totalAmount.toFixed(2).replace('.', ',')}
                          </text>
                        </g>
                      )
                    }
                  }}
                />
              </Pie>
              <Legend 
                verticalAlign="bottom" 
                height={60}
                iconType="circle"
                iconSize={12}
                wrapperStyle={{
                  fontSize: '14px',
                  lineHeight: '20px',
                  paddingTop: '20px'
                }}
                formatter={(value, entry: any) => (
                  <span 
                    className="text-gray-700 text-sm font-medium cursor-pointer hover:text-gray-900 transition-colors"
                    onMouseEnter={() => {
                      setHoveredData(entry.payload)
                      setLegendHovered(entry.payload.name)
                    }}
                    onMouseLeave={() => {
                      setHoveredData(null)
                      setLegendHovered(null)
                    }}
                  >
                    {value} {Math.round(entry.payload.value)}%
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default ExpenseChart

