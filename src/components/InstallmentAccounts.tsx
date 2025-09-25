import React from 'react'
import { useTransactionsContext } from '../contexts/TransactionsContext'
import { useCategories } from '../hooks/useCategories'
import { useAuth } from '../contexts/AuthContext'

const InstallmentAccounts: React.FC = () => {
  const { transactions, loading, error, updateTransaction } = useTransactionsContext()
  const { user } = useAuth()
  const { categories } = useCategories(user?.uid || 'test-user-123')
  
  // Estado para controlar visibilidade das parcelas
  const [visibleParcels, setVisibleParcels] = React.useState<{ [key: string]: number }>({})

  // Função para mostrar mais parcelas
  const showMoreParcels = (groupKey: string, totalParcels: number) => {
    setVisibleParcels(prev => ({
      ...prev,
      [groupKey]: totalParcels
    }))
  }

  // Função para mostrar menos parcelas
  const showLessParcels = (groupKey: string) => {
    setVisibleParcels(prev => ({
      ...prev,
      [groupKey]: 3
    }))
  }

  // Filtrar e agrupar transações parceladas
  const installmentGroups = React.useMemo(() => {
    const installmentTransactions = transactions.filter(transaction => 
      transaction.installments && transaction.installments > 1
    )

    // Agrupar por installmentGroupId ou por descrição + totalInstallmentAmount
    const groups: { [key: string]: any[] } = {}
    
    installmentTransactions.forEach(transaction => {
      const groupKey = transaction.installmentGroupId || 
        `${transaction.description}_${transaction.totalInstallmentAmount || transaction.amount}`
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(transaction)
    })

    // Converter para array e ordenar por data
    return Object.values(groups).map(group => {
      const sortedGroup = group.sort((a, b) => a.installmentNumber! - b.installmentNumber!)
      const firstTransaction = sortedGroup[0]
      const lastTransaction = sortedGroup[sortedGroup.length - 1]
      
      return {
        id: firstTransaction.installmentGroupId || `${firstTransaction.description}_${firstTransaction.totalInstallmentAmount}`,
        description: firstTransaction.description.replace(/\s*\(\d+\/\d+\)$/, ''), // Remove (1/2) da descrição
        totalInstallments: firstTransaction.installments!,
        paidInstallments: sortedGroup.filter(t => t.isPaid === true).length, // Apenas transações explicitamente marcadas como pagas
        totalAmount: firstTransaction.totalInstallmentAmount || firstTransaction.amount,
        installmentAmount: firstTransaction.amount,
        firstDate: firstTransaction.date,
        lastDate: lastTransaction.date,
        type: firstTransaction.type,
        category: firstTransaction.category,
        transactions: sortedGroup
      }
    }).sort((a, b) => {
      // Verificar se a transação está completamente paga
      const aIsCompleted = a.paidInstallments === a.totalInstallments
      const bIsCompleted = b.paidInstallments === b.totalInstallments

      // Se uma está completa e outra não, a não completa vem primeiro
      if (aIsCompleted && !bIsCompleted) return 1
      if (!aIsCompleted && bIsCompleted) return -1

      // Se ambas têm o mesmo status de pagamento, ordenar por data (mais recente primeiro)
      return new Date(b.firstDate).getTime() - new Date(a.firstDate).getTime()
    })
  }, [transactions])

  // Debug: Log das transações parceladas (removido para produção)

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contas Parceladas</h3>
        <div className="text-red-600">
          <p>Erro ao carregar dados: {error}</p>
        </div>
      </div>
    )
  }

  // Função para obter categoria por nome
  const getCategoryByName = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName)
    return category || { 
      name: categoryName, 
      color: '#9CA3AF', 
      icon: '📦',
      type: 'despesa' as const
    }
  }

  // Função para marcar/desmarcar parcela como paga
  const togglePaymentStatus = async (transactionId: string, isPaid: boolean) => {
    try {
      console.log(`🔄 [InstallmentAccounts] Iniciando atualização da parcela:`, {
        transactionId,
        isPaid,
        timestamp: new Date().toISOString()
      })
      
      await updateTransaction(transactionId, { isPaid })
      
      console.log(`✅ [InstallmentAccounts] Parcela ${isPaid ? 'marcada como paga' : 'desmarcada'}:`, {
        transactionId,
        isPaid,
        timestamp: new Date().toISOString()
      })
      
      // Forçar re-render do componente
      setTimeout(() => {
        console.log('🔄 [InstallmentAccounts] Forçando re-render após 1 segundo...')
      }, 1000)
      
    } catch (error) {
      console.error('❌ [InstallmentAccounts] Erro ao atualizar status da parcela:', error)
      alert('Erro ao atualizar status da parcela. Tente novamente.')
    }
  }

  return (
    <div className="bg-white p-4 lg:p-6 rounded-lg shadow border">
      <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Contas Parceladas</h3>
      <div className="space-y-4">
        {installmentGroups.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma transação parcelada encontrada.</p>
        ) : (
          installmentGroups.map((group) => {
            const category = getCategoryByName(group.category)
            const progressPercentage = (group.paidInstallments / group.totalInstallments) * 100
            const remainingAmount = group.totalAmount - (group.paidInstallments * group.installmentAmount)
            const isCompleted = group.paidInstallments === group.totalInstallments
            
            // Criar groupKey para este grupo
            const groupKey = group.id || `${group.description}_${group.totalAmount}`
            
            return (
              <div key={group.id} className="border border-gray-200 rounded-lg p-3 lg:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 lg:space-x-3 mb-1 lg:mb-2">
                      <div 
                        className="flex h-6 w-6 lg:h-8 lg:w-8 items-center justify-center rounded-xl" 
                        style={{backgroundColor: `${category.color}20`}}
                      >
                        <span className="text-xs lg:text-sm">{category.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-xs lg:text-sm font-medium text-gray-900">
                            {group.category}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-[10px] lg:text-xs font-medium ${
                            group.type === 'receita' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {group.type === 'receita' ? 'Receita' : 'Despesa'}
                          </span>
                        </div>
                        <p className="text-[10px] lg:text-xs text-gray-500">{group.description}</p>
                        {'description' in category && category.description && (
                          <p className="text-[8px] lg:text-[10px] text-gray-400 mt-1 leading-tight">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 text-[10px] lg:text-xs text-gray-600 space-y-1 lg:space-y-0">
                      <span>
                        {group.firstDate.toLocaleDateString('pt-BR')} - {group.lastDate.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs lg:text-sm font-semibold ${
                      group.type === 'receita' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {group.type === 'receita' ? '+' : '-'}R$ {group.installmentAmount.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-[10px] lg:text-xs text-gray-500">R$ {group.installmentAmount.toLocaleString('pt-BR')}/parcela</p>
                  </div>
                </div>
                <div className="mt-2 lg:mt-3">
                  <div className="flex items-center justify-between text-[10px] lg:text-xs text-gray-600 mb-1">
                    <span>Progresso do pagamento</span>
                    <span>{group.paidInstallments}/{group.totalInstallments} parcelas</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 lg:h-2">
                    <div 
                      className={`h-1.5 lg:h-2 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{width: `${progressPercentage}%`}}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] lg:text-xs text-gray-500 mt-1">
                    <span>
                      {isCompleted ? '✅ Completamente pago' : ''}
                    </span>
                    <span className={`font-bold ${
                      group.type === 'receita' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Restante: R$ {remainingAmount.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  
                  {/* Botões para marcar parcelas como pagas */}
                  <div className="mt-2 lg:mt-3 pt-2 lg:pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-1 lg:gap-2">
                      {group.transactions
                        .slice(0, visibleParcels[groupKey] || 3)
                        .map((transaction, index) => (
                          <button
                            key={transaction.id}
                            onClick={() => togglePaymentStatus(transaction.id, !transaction.isPaid)}
                            className={`px-2 lg:px-3 py-1 text-[10px] lg:text-xs rounded-full transition-colors ${
                              transaction.isPaid
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {transaction.isPaid ? '✅' : ''} Parcela {transaction.installmentNumber}
                          </button>
                        ))}
                      
                      {/* Botão "Mostrar mais" quando há mais de 3 parcelas */}
                      {group.transactions.length > 3 && (visibleParcels[groupKey] || 3) < group.transactions.length && (
                        <button
                          onClick={() => showMoreParcels(groupKey, group.transactions.length)}
                          className="px-2 lg:px-3 py-1 text-[10px] lg:text-xs rounded-full transition-colors bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          +{group.transactions.length - (visibleParcels[groupKey] || 3)} mais
                        </button>
                      )}
                      
                      {/* Botão "Mostrar menos" quando todas as parcelas estão visíveis */}
                      {group.transactions.length > 3 && (visibleParcels[groupKey] || 3) >= group.transactions.length && (
                        <button
                          onClick={() => showLessParcels(groupKey)}
                          className="px-2 lg:px-3 py-1 text-[10px] lg:text-xs rounded-full transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          Mostrar menos
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default InstallmentAccounts


