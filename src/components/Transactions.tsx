import React, { useState, useRef } from 'react'
import NewTransactionModal from './NewTransactionModal'
import { useTransactionsContext } from '../contexts/TransactionsContext'
import { useCategories } from '../hooks/useCategories'
import { useAuth } from '../contexts/AuthContext'
import PaidAccountsButton from './PaidAccountsButton'

const Transactions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [selectedInstallmentIds, setSelectedInstallmentIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [transactionsPerPage] = useState(5)
  const [visibleTransactionsCount, setVisibleTransactionsCount] = useState(5) // Para mobile "Ver mais"
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false)
  
  // Estados para mobile
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  
  // Estados para o modal de filtros
  const [periodFilter, setPeriodFilter] = useState('personalizado')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('todas')
  
  // Estados para filtros de tags
  const [activeTagFilter, setActiveTagFilter] = useState('all')
  
  // Estado para contador de notificações de contas pagas
  const [paidNotificationCount, setPaidNotificationCount] = useState(0)
  const [lastViewedPaidCount, setLastViewedPaidCount] = useState(0)
  
  // Usar useRef para armazenar o estado anterior sem causar re-renderizações
  const previousPaidTransactionsRef = useRef<Set<string>>(new Set())
  
  // Hooks do contexto e Firebase
  const { user } = useAuth()
  const transactionsContext = useTransactionsContext()
  const { categories } = useCategories(user?.uid || 'test-user-123')
  
  if (!transactionsContext) {
    return <div>Erro: Contexto não encontrado</div>
  }
  
  const { transactions, loading: transactionsLoading, error: transactionsError, loadTransactions, deleteTransaction, updateTransaction } = transactionsContext

  // Calcular contador de notificações de contas pagas
  React.useEffect(() => {
    if (!transactions || transactions.length === 0) return

    // Contar todas as transações pagas (únicas e parceladas)
    const paidTransactions = transactions.filter(transaction => {
      if (transaction.installments && transaction.installments > 1) {
        // Para transações parceladas, verificar se todas as parcelas estão pagas
        const groupTransactions = transactions.filter(t => 
          t.installmentGroupId === transaction.installmentGroupId
        )
        return groupTransactions.every(t => t.isPaid === true)
      } else {
        // Para transações únicas, verificar se está paga
        return transaction.isPaid === true
      }
    })

    // Criar um Set com IDs das transações pagas atuais
    const currentPaidTransactionIds = new Set(paidTransactions.map(t => t.id))
    
    // Detectar transações que voltaram a ser pagas (estavam não pagas antes, agora estão pagas)
    const newlyPaidTransactions = Array.from(currentPaidTransactionIds).filter(id => 
      !previousPaidTransactionsRef.current.has(id)
    )
    
    // Atualizar o estado anterior usando useRef
    previousPaidTransactionsRef.current = currentPaidTransactionIds
    
    // Calcular notificações baseado em transações recém-pagas
    const currentPaidCount = paidTransactions.length
    const newNotificationCount = Math.max(0, currentPaidCount - lastViewedPaidCount + newlyPaidTransactions.length)

    setPaidNotificationCount(newNotificationCount)
  }, [transactions, lastViewedPaidCount]) // Removido previousPaidTransactions das dependências

  // Aplicar filtro de período quando o período mudar
  React.useEffect(() => {
    if (periodFilter !== 'personalizado') {
      const { start, end } = getDateRange(periodFilter)
      setStartDate(start)
      setEndDate(end)
    }
  }, [periodFilter])


  // Função para buscar categoria por nome
  const getCategoryByName = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName)
    return category || { name: categoryName, color: '#9CA3AF', icon: '📦' }
  }

  // Função para calcular datas baseadas no período selecionado
  const getDateRange = (period: string) => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    switch (period) {
      case 'este-mes':
        const firstDay = new Date(currentYear, currentMonth, 1)
        const lastDay = new Date(currentYear, currentMonth + 1, 0)
        return {
          start: firstDay.toISOString().split('T')[0],
          end: lastDay.toISOString().split('T')[0]
        }
      case 'mes-passado':
        const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1)
        const lastDayLastMonth = new Date(currentYear, currentMonth, 0)
        return {
          start: firstDayLastMonth.toISOString().split('T')[0],
          end: lastDayLastMonth.toISOString().split('T')[0]
        }
      case 'ultimos-3-meses':
        const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1)
        const lastDayCurrentMonth = new Date(currentYear, currentMonth + 1, 0)
        return {
          start: threeMonthsAgo.toISOString().split('T')[0],
          end: lastDayCurrentMonth.toISOString().split('T')[0]
        }
      default:
        return { start: '', end: '' }
    }
  }

  // Função para abrir modal de confirmação de pagamento
  const handleOpenPaymentModal = (transaction: any) => {
    setSelectedTransaction(transaction)
    setSelectedInstallmentIds([]) // Resetar seleção de faturas
    setIsPaymentModalOpen(true)
  }

  // Função para lidar com clique na tag "Pagas" e resetar contador
  const handlePaidTagClick = () => {
    // Contar transações pagas atuais para atualizar o lastViewedPaidCount
    const currentPaidTransactions = transactions.filter(transaction => {
      if (transaction.installments && transaction.installments > 1) {
        const groupTransactions = transactions.filter(t => 
          t.installmentGroupId === transaction.installmentGroupId
        )
        return groupTransactions.every(t => t.isPaid === true)
      } else {
        return transaction.isPaid === true
      }
    })

    const currentPaidCount = currentPaidTransactions.length
    const currentPaidTransactionIds = new Set(currentPaidTransactions.map(t => t.id))

    setLastViewedPaidCount(currentPaidCount)
    previousPaidTransactionsRef.current = currentPaidTransactionIds
    setPaidNotificationCount(0)
    setActiveTagFilter('paid')
  }


  // Função para excluir transação
  const handleDeleteTransaction = async (transaction: any) => {
    try {
      // Verificar se é uma transação parcelada
      const isInstallmentGroup = transaction.installmentGroupId || transaction.id.startsWith('installment_')
      
      let confirmMessage = `Tem certeza que deseja excluir a transação "${transaction.description}"?\n\nEsta ação não pode ser desfeita.`
      
      if (isInstallmentGroup && transaction.installments > 1) {
        confirmMessage = `Tem certeza que deseja excluir TODAS as ${transaction.installments} parcelas da transação "${transaction.description}"?\n\nEsta ação não pode ser desfeita e excluirá todas as parcelas.`
      }
      
      const confirmDelete = window.confirm(confirmMessage)
      
      if (confirmDelete) {
        if (isInstallmentGroup && transaction.installments > 1) {
          // Excluir todas as parcelas do grupo
          const groupId = transaction.installmentGroupId || transaction.id
          const groupTransactions = transactions.filter(t => 
            t.installmentGroupId === groupId
          )
          
          // Mostrar loading
          alert(`Excluindo ${groupTransactions.length} parcelas...`)
          
          // Excluir todas as parcelas de uma vez usando o contexto
          for (const groupTransaction of groupTransactions) {
            await deleteTransaction(groupTransaction.id)
          }
          
          alert(`Todas as ${groupTransactions.length} parcelas foram excluídas com sucesso!`)
        } else {
          // Excluir transação individual
          await deleteTransaction(transaction.id)
          alert('Transação excluída com sucesso!')
        }
        // A lista será atualizada automaticamente pelo contexto
      }
    } catch (error) {
      alert('Erro ao excluir transação. Tente novamente.')
      
      // Em caso de erro, tentar recarregar as transações para evitar estado inconsistente
      try {
        await loadTransactions()
      } catch (reloadError) {
        // Erro silencioso
      }
    }
  }

  // Função para confirmar pagamento
  const handleConfirmPayment = async () => {
    if (!selectedTransaction) return
    
    try {
      // Se é uma transação agrupada (parcelada)
      if (selectedTransaction.isGrouped) {
        // Para transações agrupadas, vamos marcar a próxima parcela como paga
        // Primeiro, precisamos encontrar as parcelas individuais
        const individualTransactions = transactions.filter(t => 
          t.installmentGroupId === selectedTransaction.installmentGroupId
        )
        
        // Se faturas específicas foram selecionadas, usar elas
        if (selectedInstallmentIds.length > 0) {
          const selectedTransactions = individualTransactions.filter(t => 
            selectedInstallmentIds.includes(t.id)
          )
          
          if (selectedTransactions.length === 0) {
            alert('Nenhuma fatura foi selecionada!')
            return
          }
          
          // Separar faturas pagas e não pagas
          const unpaidTransactions = selectedTransactions.filter(t => !t.isPaid)
          const paidTransactions = selectedTransactions.filter(t => t.isPaid)
          
          // Marcar faturas não pagas como pagas
          for (const transaction of unpaidTransactions) {
            await updateTransaction(transaction.id, { isPaid: true })
          }
          
          // Desmarcar faturas pagas como não pagas
          for (const transaction of paidTransactions) {
            await updateTransaction(transaction.id, { isPaid: false })
          }
        } else {
          // Ordenar parcelas por data (mais antiga primeiro) e encontrar a próxima não paga
          const sortedTransactions = individualTransactions.sort((a, b) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            return dateA - dateB // Ordem crescente (mais antiga primeiro)
          })
          
          // Encontrar a próxima parcela não paga (primeira cronologicamente)
          const nextUnpaidTransaction = sortedTransactions.find(t => !t.isPaid)
          
          if (nextUnpaidTransaction) {
            await updateTransaction(nextUnpaidTransaction.id, { isPaid: true })
          } else {
            alert('🎉 Todas as faturas desta transação já foram pagas!')
            return
          }
        }
      } else {
        // Para transações únicas
        if (selectedTransaction.isPaid) {
          await updateTransaction(selectedTransaction.id, { isPaid: false })
        } else {
          await updateTransaction(selectedTransaction.id, { isPaid: true })
        }
      }
      
      // Fechar modal
      setIsPaymentModalOpen(false)
      setSelectedTransaction(null)
    } catch (error) {
      // Erro silencioso
    }
  }

  // Função para desmarcar parcelas pagas
  const handleUnmarkPaid = async () => {
    if (!selectedTransaction) return
    
    try {
      // Se há parcelas selecionadas, desmarcar apenas as selecionadas que estão pagas
      if (selectedInstallmentIds.length > 0) {
        const selectedTransactions = transactions.filter(t => 
          t.installmentGroupId === selectedTransaction.installmentGroupId && 
          selectedInstallmentIds.includes(t.id) &&
          t.isPaid === true
        )
        
        // Desmarcar todas as parcelas pagas selecionadas
        for (const transaction of selectedTransactions) {
          await updateTransaction(transaction.id, { isPaid: false })
        }
      } else {
        // Se não há parcelas selecionadas, desmarcar a última parcela paga (comportamento original)
        const individualTransactions = transactions.filter(t => 
          t.installmentGroupId === selectedTransaction.installmentGroupId
        )
        
        // Ordenar parcelas por data (mais recente primeiro) e encontrar a última paga
        const sortedTransactions = individualTransactions.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return dateB - dateA // Ordem decrescente (mais recente primeiro)
        })
        
        // Encontrar a última parcela paga (mais recente cronologicamente)
        const paidTransactions = sortedTransactions.filter(t => t.isPaid === true)
        const lastPaidTransaction = paidTransactions[0] // Primeira da lista ordenada (mais recente)
        
        if (lastPaidTransaction) {
          await updateTransaction(lastPaidTransaction.id, { isPaid: false })
        }
      }
      
      // Fechar modal
      setIsPaymentModalOpen(false)
      setSelectedTransaction(null)
      
    } catch (error) {
      // Erro silencioso
    }
  }

  // Função para cancelar pagamento
  const handleCancelPayment = () => {
    setIsPaymentModalOpen(false)
    setSelectedTransaction(null)
  }

  // Função para agrupar transações parceladas
  const groupInstallmentTransactions = (transactions: any[], currentTagFilter?: string) => {
    try {
      const grouped = new Map()
      const standalone: any[] = []
      
      // Verificar se transactions é um array válido
      if (!Array.isArray(transactions)) {
        return []
      }
      
      // Calcular datas do filtro
      const { start, end } = getDateRange(periodFilter)
      const effectiveStartDate = periodFilter === 'personalizado' ? startDate : start
      const effectiveEndDate = periodFilter === 'personalizado' ? endDate : end
      
      // Primeiro, agrupar todas as transações parceladas
      transactions.forEach(transaction => {
        if (transaction.installmentGroupId && transaction.installments && transaction.installments > 1) {
          // É uma transação parcelada - agrupar
          if (!grouped.has(transaction.installmentGroupId)) {
            grouped.set(transaction.installmentGroupId, {
              id: transaction.installmentGroupId,
              description: transaction.description.replace(/ \(\d+\/\d+\)$/, ''), // Remove (1/2), (2/2), etc.
              category: transaction.category,
              type: transaction.type,
              installments: transaction.installments,
              installmentAmount: transaction.amount,
              totalAmount: transaction.totalInstallmentAmount || (transaction.amount * transaction.installments),
              firstDate: transaction.date,
              lastDate: transaction.date,
              installmentGroupId: transaction.installmentGroupId,
              isGrouped: true,
              paidInstallments: 0,
              totalInstallments: 1, // Será recalculado baseado nas parcelas visíveis
              allTransactions: [] // Armazenar todas as transações do grupo
            })
          }
          
          const group = grouped.get(transaction.installmentGroupId)
          group.allTransactions.push(transaction)
          
          if (transaction.date < group.firstDate) {
            group.firstDate = transaction.date
          }
          if (transaction.date > group.lastDate) {
            group.lastDate = transaction.date
          }
        } else {
          // É uma transação única - não agrupar
          standalone.push(transaction)
        }
      })
      
      // Agora contar as parcelas pagas para cada grupo e aplicar filtro de data
      grouped.forEach(group => {
        // Filtrar parcelas que estão no período selecionado
        const transactionsInPeriod = group.allTransactions.filter((transaction: any) => {
          if (filterDate) {
            return transaction.date.toISOString().split('T')[0] === filterDate
          } else if (effectiveStartDate && effectiveEndDate) {
            const transactionDate = transaction.date.toISOString().split('T')[0]
            const isInPeriod = transactionDate >= effectiveStartDate && transactionDate <= effectiveEndDate
            return isInPeriod
          }
          return true
        })
        
        // Se não há parcelas no período, marcar o grupo para remoção
        if (transactionsInPeriod.length === 0) {
          group.shouldRemove = true
          return
        }
        
        // Contar parcelas marcadas como pagas manualmente (apenas as que estão no período)
        group.paidInstallments = transactionsInPeriod.filter((transaction: any) => 
          transaction.isPaid === true
        ).length
        
        // Recalcular total de parcelas baseado apenas nas parcelas visíveis (dentro do filtro)
        group.totalInstallments = transactionsInPeriod.length
        
        // Manter o totalAmount original (não alterar baseado nas parcelas visíveis)
        // O totalAmount deve sempre mostrar o valor total da transação parcelada
        // Recalcular o totalAmount baseado no valor original da transação
        if (group.allTransactions && group.allTransactions.length > 0) {
          const firstTransaction = group.allTransactions[0]
          group.totalAmount = firstTransaction.totalInstallmentAmount || (firstTransaction.amount * firstTransaction.installments)
        }
        
        // Atualizar as datas do grupo baseado nas parcelas no período
        if (transactionsInPeriod.length > 0) {
          group.firstDate = transactionsInPeriod.reduce((earliest: any, current: any) => 
            current.date < earliest.date ? current : earliest
          ).date
          group.lastDate = transactionsInPeriod.reduce((latest: any, current: any) => 
            current.date > latest.date ? current : latest
          ).date
        }
        
        // Remover o array temporário
        delete group.allTransactions
      })
      
      // Remover grupos que não têm parcelas no período
      grouped.forEach((group, key) => {
        if (group.shouldRemove) {
          grouped.delete(key)
        }
      })
      
      // Converter Map para array e combinar com transações únicas
      const groupedArray = Array.from(grouped.values())
      
      // Se o filtro "paid" estiver ativo, retornar apenas transações pagas
      if (currentTagFilter === 'paid') {
        const paidStandalone = standalone.filter((transaction: any) => transaction.isPaid)
        
        // Para transações agrupadas (parceladas), filtrar apenas grupos que têm todas as parcelas pagas
        const paidGroupedArray = groupedArray.filter(group => {
          // Se é um grupo de parcelas, verificar se todas as parcelas estão pagas
          if (group.isGrouped) {
            return group.paidInstallments === group.totalInstallments
          }
          // Se não é um grupo, verificar se a transação está paga
          return group.isPaid
        })
        
        return [...paidGroupedArray, ...paidStandalone]
      } else if (currentTagFilter === 'pending') {
        // Se o filtro "pending" estiver ativo, retornar apenas transações não pagas
        const pendingStandalone = standalone.filter((transaction: any) => !transaction.isPaid)
        
        // Para transações agrupadas (parceladas), filtrar apenas grupos que têm parcelas não pagas
        const pendingGroupedArray = groupedArray.filter(group => {
          // Se é um grupo de parcelas, verificar se tem parcelas não pagas
          if (group.isGrouped) {
            return group.paidInstallments < group.totalInstallments
          }
          // Se não é um grupo, verificar se a transação não está paga
          return !group.isPaid
        })
        
        return [...pendingGroupedArray, ...pendingStandalone]
      } else {
        // Para "Todas" e outros filtros, retornar todas as transações
        // Ordenar para que transações pagas fiquem por último
        const allTransactions = [...groupedArray, ...standalone]
        
        return allTransactions.sort((a, b) => {
          // Verificar se a transação está paga
          const aIsPaid = a.isGrouped ? a.paidInstallments === a.totalInstallments : a.isPaid
          const bIsPaid = b.isGrouped ? b.paidInstallments === b.totalInstallments : b.isPaid
          
          // Se uma está paga e outra não, a não paga vem primeiro
          if (aIsPaid && !bIsPaid) return 1
          if (!aIsPaid && bIsPaid) return -1
          
          // Se ambas têm o mesmo status de pagamento, ordenar por data (mais recente primeiro)
          const aDate = a.isGrouped ? a.firstDate : a.date
          const bDate = b.isGrouped ? b.firstDate : b.date
          return new Date(bDate).getTime() - new Date(aDate).getTime()
        })
      }
    } catch (error) {
      // Em caso de erro, retornar array vazio para evitar crash
      return []
    }
  }

  // Filtrar transações (sem filtro de data para parceladas)
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro de tipo melhorado
    let matchesType = true
    if (filterType === 'all') {
      matchesType = true
    } else if (filterType === 'receita') {
      matchesType = transaction.type === 'receita'
    } else if (filterType === 'despesa') {
      matchesType = transaction.type === 'despesa'
    } else if (filterType === 'parceladas') {
      matchesType = !!(transaction.installments && transaction.installments > 1)
    } else if (filterType === 'receitas-parceladas') {
      matchesType = transaction.type === 'receita' && !!(transaction.installments && transaction.installments > 1)
    }
    
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory
    
    // Para transações únicas, aplicar filtro de data
    // Para transações parceladas, não aplicar filtro de data aqui (será aplicado depois do agrupamento)
    let matchesDate = true
    if (!transaction.installmentGroupId || !transaction.installments || transaction.installments <= 1) {
      // É uma transação única - aplicar filtro de data
      if (filterDate) {
        matchesDate = transaction.date.toISOString().split('T')[0] === filterDate
      } else {
        // Usar as datas baseadas no período selecionado
        const { start, end } = getDateRange(periodFilter)
        const effectiveStartDate = periodFilter === 'personalizado' ? startDate : start
        const effectiveEndDate = periodFilter === 'personalizado' ? endDate : end
        
        if (effectiveStartDate && effectiveEndDate) {
          const transactionDate = transaction.date.toISOString().split('T')[0]
          matchesDate = transactionDate >= effectiveStartDate && transactionDate <= effectiveEndDate
        }
      }
    }
    
    return matchesSearch && matchesType && matchesCategory && matchesDate
  })

  // Aplicar filtros de tags
  let finalFilteredTransactions = [...filteredTransactions]
  
  if (activeTagFilter === 'near-due') {
    // Perto de vencer - despesas (parceladas e à vista) não pagas dos próximos 7 dias
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    finalFilteredTransactions = finalFilteredTransactions.filter(transaction => {
      // Apenas despesas
      if (transaction.type !== 'despesa') return false
      
      // Para transações parceladas, verificar se alguma parcela não paga está vencendo
      if (transaction.installments && transaction.installments > 1) {
        // É uma transação parcelada - verificar se esta parcela específica não paga está vencendo
        return !transaction.isPaid && 
               transaction.date >= today && 
               transaction.date <= nextWeek
      } else {
        // É uma transação à vista
        return !transaction.isPaid && 
               transaction.date >= today && 
               transaction.date <= nextWeek
      }
    })
  } else if (activeTagFilter === 'high-expenses') {
    // Maiores despesas - as 5 maiores despesas ordenadas por valor
    const expenses = finalFilteredTransactions.filter(transaction => 
      transaction.type === 'despesa'
    )
    // Ordenar por valor (maior para menor) e pegar apenas as 5 primeiras
    finalFilteredTransactions = expenses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  } else if (activeTagFilter === 'high-revenues') {
    // Maiores receitas - as 5 maiores receitas ordenadas por valor
    const revenues = finalFilteredTransactions.filter(transaction => 
      transaction.type === 'receita'
    )
    // Ordenar por valor (maior para menor) e pegar apenas as 5 primeiras
    finalFilteredTransactions = revenues
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  } else if (activeTagFilter === 'paid') {
    // Contas pagas - apenas transações COMPLETAMENTE pagas (sem pendências ou parciais)
    finalFilteredTransactions = finalFilteredTransactions.filter(transaction => {
      // Para transações parceladas, verificar se TODAS as parcelas foram pagas
      if (transaction.installments && transaction.installments > 1) {
        return transaction.isPaid === true
      } else {
        // Para transações à vista, verificar se está paga
        return transaction.isPaid === true
      }
    })
  }

  // Agrupar transações parceladas com tratamento de erro
  let groupedTransactions: any[] = []
  try {
    // Verificar se finalFilteredTransactions é válido antes de chamar a função
    if (!Array.isArray(finalFilteredTransactions)) {
      groupedTransactions = []
    } else {
      groupedTransactions = groupInstallmentTransactions(finalFilteredTransactions, activeTagFilter)
    }
  } catch (error) {
    groupedTransactions = []
  }

  // Lógica de paginação com proteção
  const safeGroupedTransactions = Array.isArray(groupedTransactions) ? groupedTransactions : []
  const totalPages = Math.ceil(safeGroupedTransactions.length / transactionsPerPage)
  const startIndex = (currentPage - 1) * transactionsPerPage
  const endIndex = startIndex + transactionsPerPage
  const paginatedTransactions = safeGroupedTransactions.slice(startIndex, endIndex)
  
  // Para mobile: usar visibleTransactionsCount em vez de paginação tradicional
  const mobileVisibleTransactions = safeGroupedTransactions.slice(0, visibleTransactionsCount)
  
  // Calcular contagem correta para exibição
  const displayCount = {
    start: startIndex + 1,
    end: Math.min(endIndex, safeGroupedTransactions.length),
    total: safeGroupedTransactions.length
  }
  
  // Para mobile: contagem baseada em transações visíveis
  const mobileDisplayCount = {
    start: 1,
    end: Math.min(visibleTransactionsCount, safeGroupedTransactions.length),
    total: safeGroupedTransactions.length
  }

  // Resetar página quando filtros mudarem
  React.useEffect(() => {
    setCurrentPage(1)
    setVisibleTransactionsCount(5) // Resetar também o contador mobile
  }, [searchTerm, filterType, filterCategory, filterDate])

  // Aplicar filtros automaticamente quando mudarem
  React.useEffect(() => {
    if (periodFilter !== 'personalizado') {
      const { start, end } = getDateRange(periodFilter)
      setStartDate(start || '')
      setEndDate(end || '')
    }
    
    // Aplicar filtro de tipo automaticamente
    let mappedType = 'all'
    if (transactionTypeFilter === 'receitas') {
      mappedType = 'receita'
    } else if (transactionTypeFilter === 'despesas') {
      mappedType = 'despesa'
    } else if (transactionTypeFilter === 'contas-parceladas') {
      mappedType = 'parceladas'
    } else if (transactionTypeFilter === 'receitas-parceladas') {
      mappedType = 'receitas-parceladas'
    }
    setFilterType(mappedType)
    
    // Limpar filtro de data específica quando usar período
    if (periodFilter !== 'personalizado') {
      setFilterDate('')
    }
  }, [periodFilter, transactionTypeFilter])

  // Aplicar filtros de data personalizada automaticamente
  React.useEffect(() => {
    if (periodFilter === 'personalizado' && startDate && endDate) {
      // Quando usar datas personalizadas, limpar o filtro de data específica
      setFilterDate('')
    }
  }, [startDate, endDate, periodFilter])


  // Funções de paginação
  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Função para carregar mais transações no mobile
  const loadMoreTransactions = () => {
    setVisibleTransactionsCount(prev => Math.min(prev + 5, safeGroupedTransactions.length))
  }

  // Função para recarregar transações quando o modal for fechado
  const handleModalClose = () => {
    setIsModalOpen(false)
    setIsCreatingTransaction(false)
    // Não recarregar transações aqui pois o contexto já atualiza automaticamente
  }

  const handleModalOpen = () => {
    setIsModalOpen(true)
  }


  const clearFilters = () => {
    setPeriodFilter('personalizado')
    setStartDate('')
    setEndDate('')
    setTransactionTypeFilter('todas')
    setFilterType('all')
    setFilterDate('')
    // Fechar modal após limpar
    setIsFiltersModalOpen(false)
  }


  return (
    <div className="bg-white p-3 lg:p-6 rounded-lg shadow border">
      {/* Título e Controles Superiores */}
      <div className="mb-4 lg:mb-6">
        <div className="flex flex-row items-center justify-between gap-1 lg:gap-3 mb-3 lg:mb-4">
          <h3 className="text-base lg:text-xl font-semibold text-gray-900">Transações</h3>
          
          {/* Controles do lado direito */}
          <div className="flex items-center gap-2">
            {/* Botão de Busca - Mobile */}
            <button 
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Botão Filtros Avançados - Mobile */}
            <button 
              onClick={() => setIsFiltersModalOpen(true)}
              className="lg:hidden flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <img 
                src="/options.png" 
                alt="Configurações" 
                className="w-4 h-4"
              />
              <span>Filtros</span>
            </button>

            {/* Campo de Busca - Desktop */}
            <div className="relative max-w-[200px] lg:max-w-none hidden lg:block">
              <img 
                src="/options.png" 
                alt="Buscar" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Botão Nova Transação - Desktop */}
            <button
              onClick={handleModalOpen}
              className="hidden lg:flex items-center space-x-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: 'rgb(34 197 94)' }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgb(30 180 85)'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgb(34 197 94)'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Nova Transação</span>
            </button>
          </div>
        </div>

        {/* Campo de Busca Expandível - Mobile */}
        {isSearchExpanded && (
          <div className="mb-4 lg:hidden">
            <div className="relative">
              <img 
                src="/options.png" 
                alt="Buscar" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button 
                onClick={() => setIsSearchExpanded(false)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Informações do Filtro */}
        {filterDate && (
          <div className="mb-3 lg:mb-4 p-2 lg:p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <svg className="w-3 h-3 lg:w-4 lg:h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span className="text-xs lg:text-sm font-medium text-blue-800">
                Filtrando por: {new Date(filterDate).toLocaleDateString('pt-BR')}
              </span>
              <span className="text-xs lg:text-sm text-blue-600">
                ({safeGroupedTransactions.length} transação{safeGroupedTransactions.length !== 1 ? 'ões' : ''} encontrada{safeGroupedTransactions.length !== 1 ? 's' : ''})
              </span>
            </div>
          </div>
        )}

        {/* Filtros e Ações */}
        <div className="space-y-1 lg:space-y-3 mb-2 lg:mb-4">
          {/* Carrossel de Filtros - Mobile */}
          <div className="lg:hidden">
            <div className="flex overflow-x-auto scrollbar-hide space-x-2 pb-2">
              <button
                onClick={() => setActiveTagFilter('all')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTagFilter === 'all'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setActiveTagFilter('pending')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTagFilter === 'pending'
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pendentes
              </button>
              <PaidAccountsButton
                onClick={handlePaidTagClick}
                notificationCount={paidNotificationCount}
                className={`flex-shrink-0 px-4 py-2 text-sm rounded-full ${
                  activeTagFilter === 'paid'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              />
              <button
                onClick={() => setActiveTagFilter('near-due')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTagFilter === 'near-due'
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Perto de Vencer
              </button>
              <button
                onClick={() => setActiveTagFilter('high-expenses')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTagFilter === 'high-expenses'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Maiores Despesas
              </button>
              <button
                onClick={() => setActiveTagFilter('high-revenues')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTagFilter === 'high-revenues'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Maiores Receitas
              </button>
            </div>
          </div>

          {/* Filtros Desktop - Layout Original */}
          <div className="hidden lg:flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTagFilter('pending')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                activeTagFilter === 'pending'
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pendentes
            </button>
            <PaidAccountsButton
              onClick={handlePaidTagClick}
              notificationCount={paidNotificationCount}
              className={`px-3 py-1.5 text-xs ${
                activeTagFilter === 'paid'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            />
            <button
              onClick={() => setActiveTagFilter('near-due')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                activeTagFilter === 'near-due'
                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Perto de Vencer
            </button>
            <button
              onClick={() => setActiveTagFilter('high-expenses')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                activeTagFilter === 'high-expenses'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Maiores Despesas
            </button>
            <button
              onClick={() => setActiveTagFilter('high-revenues')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                activeTagFilter === 'high-revenues'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Maiores Receitas
            </button>
            <button
              onClick={() => setActiveTagFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                activeTagFilter === 'all'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            
            {/* Botão Filtros */}
            <button 
              onClick={() => setIsFiltersModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <img 
                src="/options.png" 
                alt="Configurações" 
                className="w-4 h-4"
              />
              <span>Filtros</span>
            </button>
          </div>

        </div>
      </div>

      {/* Loading State */}
      {transactionsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Carregando transações...</span>
        </div>
      )}

      {/* Creating Transaction State */}
      {isCreatingTransaction && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Criando transação...</span>
        </div>
      )}

      {/* Error State */}
      {transactionsError && (
        <div className="text-center py-12 text-red-600">
          <p>Erro ao carregar transações: {transactionsError}</p>
        </div>
      )}

      {/* Empty State */}
      {!transactionsLoading && !transactionsError && safeGroupedTransactions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>
            {activeTagFilter === 'near-due' 
              ? 'Nenhuma transação encontrada nos próximos 7 dias' 
              : activeTagFilter === 'high-expenses'
              ? 'Nenhuma despesa encontrada'
              : activeTagFilter === 'high-revenues'
              ? 'Nenhuma receita encontrada'
              : activeTagFilter === 'pending'
              ? 'Nenhuma transação pendente encontrada'
              : 'Nenhuma transação encontrada'
            }
          </p>
          <p className="text-sm mt-2">
            {activeTagFilter === 'near-due' 
              ? 'Não há despesas vencendo nos próximos 7 dias' 
              : activeTagFilter === 'high-expenses'
              ? 'Não há despesas para mostrar'
              : activeTagFilter === 'high-revenues'
              ? 'Não há receitas para mostrar'
              : activeTagFilter === 'pending'
              ? 'Todas as transações foram completamente pagas'
              : 'Clique em "Nova Transação" para adicionar uma'
            }
          </p>
        </div>
      )}

      {/* Cards de Transações - Mobile */}
      {!transactionsLoading && !transactionsError && safeGroupedTransactions.length > 0 && (
        <div className="lg:hidden space-y-3">
          {mobileVisibleTransactions.map((transaction) => {
            const category = getCategoryByName(transaction.category)
            
            // Se é uma transação agrupada (parcelada)
            if (transaction.isGrouped) {
              return (
                <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <span className="text-lg">{category.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {category.name}
                        </h4>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${
                            transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'receita' ? '+' : '-'}R$ {Math.max(0, transaction.totalAmount - (transaction.installmentAmount * transaction.paidInstallments)).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total: R$ {transaction.totalAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{transaction.description || ''}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.type === 'receita' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                      <button
                        onClick={() => handleOpenPaymentModal(transaction)}
                        className={`pendente-button-mobile inline-flex px-1 lg:px-2 py-0.5 lg:py-1 text-[8px] lg:text-xs font-medium rounded-full transition-colors ${
                          transaction.paidInstallments === transaction.totalInstallments
                            ? 'bg-green-500 text-white'
                            : transaction.paidInstallments > 0
                            ? 'bg-yellow-500 text-white'
                            : transaction.type === 'receita'
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                            {transaction.paidInstallments === transaction.totalInstallments
                              ? (
                                <>
                                  <span className="font-semibold">Pago</span>
                                </>
                              )
                              : transaction.paidInstallments > 0
                              ? (
                                <>
                                  <span className="font-semibold">Parcial</span>
                                </>
                              )
                              : (
                                <>
                                  <span className="font-semibold">
                                    {transaction.type === 'receita' ? 'Receber' : 'Pendente'}
                                  </span>
                                </>
                              )}
                      </button>
                    </div>
                  </div>
                  
                  
                  {/* Barra de Progresso das Parcelas */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-gray-500">{transaction.paidInstallments}/{transaction.totalInstallments} parcelas</div>
                      <span className="text-xs text-gray-500">
                        R$ {transaction.installmentAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          transaction.paidInstallments === transaction.totalInstallments
                            ? 'bg-green-500'
                            : transaction.paidInstallments > 0
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{width: `${(transaction.paidInstallments / transaction.totalInstallments) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Botão de Deletar e Datas */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.firstDate).toLocaleDateString('pt-BR')} - {new Date(transaction.lastDate).toLocaleDateString('pt-BR')}
                    </div>
                    <button
                      onClick={() => handleDeleteTransaction(transaction)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            }
            
            // Se é uma transação única (não parcelada)
            return (
              <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <span className="text-lg">{category.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {category.name}
                      </h4>
                      <div className={`text-sm font-semibold ${
                        transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'receita' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{transaction.description || ''}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.type === 'receita' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                    </span>
                    <button
                      onClick={() => handleOpenPaymentModal(transaction)}
                      className={`pendente-button-mobile inline-flex px-1 lg:px-2 py-0.5 lg:py-1 text-[8px] lg:text-xs font-medium rounded-full transition-colors ${
                        transaction.isPaid
                          ? 'bg-green-500 text-white'
                          : transaction.type === 'receita'
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {transaction.isPaid 
                        ? 'Pago' 
                        : transaction.type === 'receita' 
                          ? 'Receber' 
                          : 'Pendente'}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {transaction.date.toLocaleDateString('pt-BR')}
                  </div>
                  <button
                    onClick={() => handleDeleteTransaction(transaction)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabela de Transações - Desktop */}
      {!transactionsLoading && !transactionsError && safeGroupedTransactions.length > 0 && (
        <div className="hidden lg:block transactions-container overflow-x-hidden">
          <div className="lg:px-2 lg:px-0">
            <table className="w-full transactions-table">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 lg:py-3 px-1 lg:px-4 font-medium text-gray-700 text-[10px] lg:text-sm hidden lg:table-cell">Data</th>
                  <th className="text-left py-3 lg:py-3 px-1 lg:px-4 font-medium text-gray-700 text-[10px] lg:text-sm hidden lg:table-cell">Descrição</th>
                  <th className="text-left py-3 lg:py-3 px-1 lg:px-4 font-medium text-gray-700 text-[10px] lg:text-sm">Categoria</th>
                  <th className="text-left py-3 lg:py-3 px-1 lg:px-4 font-medium text-gray-700 text-[10px] lg:text-sm hidden lg:table-cell">Tipo</th>
                  <th className="text-center py-3 lg:py-3 px-1 lg:px-4 font-medium text-gray-700 text-[10px] lg:text-sm hidden lg:table-cell">Parcelado</th>
                  <th className="text-center py-3 lg:py-3 px-1 lg:px-4 font-medium text-gray-700 text-[10px] lg:text-sm">Status</th>
                  <th className="text-right py-3 lg:py-3 px-1 lg:px-4 font-medium text-gray-700 text-[10px] lg:text-sm">Valor</th>
                </tr>
              </thead>
            <tbody>
              {paginatedTransactions.map((transaction) => {
                const category = getCategoryByName(transaction.category)
                
                // Se é uma transação agrupada (parcelada)
                if (transaction.isGrouped) {
                  return (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 lg:py-4 px-1 lg:px-4 text-[10px] lg:text-sm text-gray-600 hidden lg:table-cell">
                        <div className="flex flex-col">
                          <span>{transaction.firstDate.toLocaleDateString('pt-BR')}</span>
                          {transaction.firstDate.getTime() !== transaction.lastDate.getTime() && (
                            <span className="text-[8px] lg:text-xs text-gray-400">
                              até {transaction.lastDate.toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-1 lg:px-4 text-[10px] lg:text-sm text-gray-900 font-medium hidden lg:table-cell">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[80px] lg:max-w-none">{transaction.description}</span>
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-1 lg:px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 lg:space-x-2">
                            <div 
                              className="flex h-5 w-5 lg:h-8 lg:w-8 items-center justify-center rounded-xl"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              <span className="text-[10px] lg:text-sm">{category.icon}</span>
                            </div>
                            <span className={`text-[10px] lg:text-sm font-bold truncate max-w-[60px] lg:max-w-none ${
                              transaction.type === 'receita' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>{category.name}</span>
                          </div>
                          <div className="flex items-center ml-2">
                            <button
                              onClick={() => handleDeleteTransaction(transaction)}
                              className="p-0.5 lg:p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir transação"
                            >
                              <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-1 lg:px-4 hidden lg:table-cell">
                        <span className={`inline-flex px-1 lg:px-2 py-0.5 lg:py-1 text-[8px] lg:text-xs font-medium rounded-full ${
                          transaction.type === 'receita' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className="py-3 lg:py-4 px-1 lg:px-4 text-center hidden lg:table-cell">
                        <div className="flex flex-col lg:flex-row lg:items-center space-y-0 lg:space-y-0 lg:space-x-2">
                          <span className="inline-flex px-1 lg:px-2 py-0.5 lg:py-1 text-[8px] lg:text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {transaction.installments}x
                          </span>
                          <span className="text-[8px] lg:text-xs text-gray-600 font-medium">
                            R$ {transaction.installmentAmount.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-1 lg:px-4 text-center">
                        <div className="flex flex-col items-center space-y-0 lg:space-y-2">
                          <button
                            onClick={() => handleOpenPaymentModal(transaction)}
                            className={`pendente-button-mobile inline-flex font-medium rounded-full transition-colors ${
                              transaction.paidInstallments === transaction.totalInstallments
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : transaction.paidInstallments > 0
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : transaction.type === 'receita'
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                          >
                            {transaction.paidInstallments === transaction.totalInstallments
                              ? 'Pago'
                              : transaction.paidInstallments > 0
                              ? 'Parcial'
                              : transaction.type === 'receita' ? 'Receber' : 'Pendente'
                            }
                          </button>
                          <div className="text-[8px] lg:text-xs text-gray-500">
                            <span className="lg:hidden">{transaction.paidInstallments}/{transaction.totalInstallments} - R$ {transaction.installmentAmount.toFixed(2)}</span>
                            <span className="hidden lg:inline">{transaction.paidInstallments}/{transaction.totalInstallments}</span>
                          </div>
                        </div>
                      </td>
                      <td className={`py-3 lg:py-4 px-1 lg:px-4 text-right text-[9px] lg:text-sm font-semibold ${
                        transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <div className="flex flex-col">
                          <span>{transaction.type === 'receita' ? '+' : '-'}R$ {transaction.totalAmount.toFixed(2)}</span>
                          <span className="text-[8px] lg:text-xs text-gray-500 hidden lg:inline">
                            Restante: R$ {Math.max(0, transaction.totalAmount - (transaction.installmentAmount * transaction.paidInstallments)).toFixed(2)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                }
                
                // Se é uma transação única (não parcelada)
                return (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 lg:py-4 px-1 lg:px-4 text-[10px] lg:text-sm text-gray-600 hidden lg:table-cell">
                        {transaction.date.toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 lg:py-4 px-1 lg:px-4 text-[10px] lg:text-sm text-gray-900 font-medium hidden lg:table-cell">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[80px] lg:max-w-none">{transaction.description}</span>
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-1 lg:px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 lg:space-x-2">
                          <div 
                            className="flex h-5 w-5 lg:h-8 lg:w-8 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <span className="text-[10px] lg:text-sm">{category.icon}</span>
                          </div>
                          <span className={`text-[10px] lg:text-sm font-bold truncate max-w-[60px] lg:max-w-none ${
                            transaction.type === 'receita' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>{category.name}</span>
                        </div>
                        <div className="flex items-center ml-2">
                          <button
                            onClick={() => handleDeleteTransaction(transaction)}
                            className="p-0.5 lg:p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir transação"
                          >
                            <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 lg:py-4 px-1 lg:px-4 hidden lg:table-cell">
                      <span className={`inline-flex px-1 lg:px-2 py-0.5 lg:py-1 text-[8px] lg:text-xs font-medium rounded-full ${
                        transaction.type === 'receita' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="py-3 lg:py-4 px-1 lg:px-4 text-center hidden lg:table-cell">
                      {/* Campo vazio para transações não parceladas */}
                    </td>
                    <td className="py-3 lg:py-4 px-1 lg:px-4 text-center">
                      <div className="flex flex-col items-center space-y-0 lg:space-y-2">
                        <button
                          onClick={() => handleOpenPaymentModal(transaction)}
                          className={`pendente-button-mobile inline-flex px-1 lg:px-2 py-0.5 lg:py-1 text-[8px] lg:text-xs font-medium rounded-full transition-colors ${
                            transaction.isPaid
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : transaction.type === 'receita'
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                        >
                          {transaction.isPaid ? (
                            <>
                              <span className="font-semibold">Pago</span>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold">
                                {transaction.type === 'receita' ? 'Receber' : 'Pendente'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className={`py-3 lg:py-4 px-1 lg:px-4 text-right text-[9px] lg:text-sm font-semibold ${
                      transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'receita' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginação - só aparece quando há mais de 5 transações */}
      {!transactionsLoading && !transactionsError && safeGroupedTransactions.length > transactionsPerPage && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 lg:mt-6 pt-3 lg:pt-4 border-t border-gray-200 space-y-3 sm:space-y-0">
          <div className="text-xs lg:text-sm text-gray-600 text-center sm:text-left">
            Mostrando <span className="lg:hidden">{mobileDisplayCount.start}-{mobileDisplayCount.end}</span><span className="hidden lg:inline">{displayCount.start}-{displayCount.end}</span> de {displayCount.total} transações
          </div>
          
          {/* Mobile: Ver mais quando há mais transações para carregar */}
          {visibleTransactionsCount < safeGroupedTransactions.length && (
            <div className="lg:hidden flex justify-center">
              <button
                onClick={loadMoreTransactions}
                className="px-6 py-2 text-white text-sm font-medium rounded-lg transition-colors bg-custom-green hover:bg-custom-green-hover"
              >
                Ver mais
              </button>
            </div>
          )}
          
          {/* Desktop: Paginação completa */}
          <div className="hidden lg:flex items-center justify-center space-x-2">
            {/* Botão anterior */}
            <button 
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Botões de página */}
            <div className="flex items-center space-x-1">
              {(() => {
                const maxVisiblePages = 5;
                const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                const pages = [];
                
                // Mostrar primeira página se não estiver visível
                if (startPage > 1) {
                  pages.push(
                    <button
                      key={1}
                      onClick={() => goToPage(1)}
                      className="w-8 h-8 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100"
                    >
                      1
                    </button>
                  );
                  
                  if (startPage > 2) {
                    pages.push(<span key="ellipsis1" className="text-gray-400">...</span>);
                  }
                }
                
                // Mostrar páginas visíveis
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => goToPage(i)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        i === currentPage
                          ? 'text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      style={i === currentPage ? { backgroundColor: 'rgb(34 197 94)' } : {}}
                      onMouseEnter={(e) => i === currentPage && ((e.target as HTMLElement).style.backgroundColor = 'rgb(30 180 85)')}
                      onMouseLeave={(e) => i === currentPage && ((e.target as HTMLElement).style.backgroundColor = 'rgb(34 197 94)')}
                    >
                      {i}
                    </button>
                  );
                }
                
                // Mostrar última página se não estiver visível
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(<span key="ellipsis2" className="text-gray-400">...</span>);
                  }
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => goToPage(totalPages)}
                      className="w-8 h-8 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100"
                    >
                      {totalPages}
                    </button>
                  );
                }
                
                return pages;
              })()}
            </div>
            
            {/* Botão próximo */}
            <button 
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button - Mobile */}
      <button 
        onClick={handleModalOpen}
        className="lg:hidden fixed bottom-28 right-6 text-white w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-50 group"
        style={{
          backgroundColor: 'rgb(34 197 94)',
          boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
        onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgb(30 180 85)'}
        onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgb(34 197 94)'}
      >
        <svg className="w-7 h-7 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        
        {/* Tooltip */}
        <div className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
          Nova Transação
          <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
        </div>
      </button>

      {/* Modal de Nova Transação */}
      <NewTransactionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        userId={user?.uid || 'test-user-123'}
        onTransactionCreating={(creating) => setIsCreatingTransaction(creating)}
      />

      {/* Modal de Confirmação de Pagamento */}
      {isPaymentModalOpen && selectedTransaction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                {selectedTransaction.isPaid ? (
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">⚠️</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-lg">✅</span>
                  </div>
                )}
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedTransaction.isPaid 
                    ? (selectedTransaction.type === 'receita' ? 'Desmarcar Recebimento' : 'Desmarcar Pagamento')
                    : (selectedTransaction.type === 'receita' ? 'Confirmar Recebimento' : 'Confirmar Pagamento')
                  }
                </h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Transação:</strong> {selectedTransaction.description}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Valor:</strong> R$ {selectedTransaction.amount?.toFixed(2) || selectedTransaction.totalAmount?.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Data:</strong> {selectedTransaction.date?.toLocaleDateString('pt-BR') || selectedTransaction.firstDate?.toLocaleDateString('pt-BR')}
              </p>
              {selectedTransaction.isGrouped && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    📋 Transação Parcelada
                  </p>
                  <p className="text-xs text-blue-600">
                    Parcelas: {selectedTransaction.paidInstallments}/{selectedTransaction.totalInstallments} pagas
                  </p>
                  <p className="text-xs text-blue-600">
                    Valor por parcela: R$ {selectedTransaction.installmentAmount?.toFixed(2)}
                  </p>
                  
                  {/* Seletor de Faturas */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-blue-800">
                        Escolha quais faturas processar:
                      </label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const allIds = transactions
                              .filter(t => t.installmentGroupId === selectedTransaction.installmentGroupId)
                              .map(t => t.id)
                            
                            // Usar callback para garantir que o estado seja atualizado corretamente
                            setSelectedInstallmentIds(prev => allIds)
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Selecionar Todas
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            // Usar callback para garantir que o estado seja atualizado corretamente
                            setSelectedInstallmentIds(prev => [])
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Limpar Seleção
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {transactions
                        .filter(t => t.installmentGroupId === selectedTransaction.installmentGroupId)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((installment) => (
                          <label key={installment.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              value={installment.id}
                              checked={selectedInstallmentIds.includes(installment.id)}
                              onChange={(e) => {
                                // Usar callback para garantir que o estado seja atualizado corretamente
                                setSelectedInstallmentIds(prev => {
                                  if (e.target.checked) {
                                    return [...prev, installment.id]
                                  } else {
                                    return prev.filter(id => id !== installment.id)
                                  }
                                })
                              }}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <span className={`text-xs ${installment.isPaid ? 'text-gray-500' : 'text-blue-700'}`}>
                                {installment.description} - {installment.date.toLocaleDateString('pt-BR')}
                              </span>
                              <span className={`pendente-button-mobile ml-2 inline-flex px-1 lg:px-2 py-0.5 lg:py-1 text-[8px] lg:text-xs font-medium rounded-full transition-colors ${
                                installment.isPaid 
                                  ? 'bg-green-100 text-green-800' 
                                  : installment.type === 'receita'
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                              }`}>
                                {installment.isPaid ? (
                                  <>
                                    <span className="font-semibold">Paga</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-semibold">
                                      {installment.type === 'receita' ? 'Receber' : 'Pendente'}
                                    </span>
                                  </>
                                )}
                              </span>
                            </div>
                          </label>
                        ))}
                    </div>
                    {selectedInstallmentIds.length > 0 && (
                      <div className="mt-2 text-xs text-blue-600">
                        {selectedInstallmentIds.length} fatura(s) selecionada(s) - 
                        {(() => {
                          const selectedTransactions = transactions.filter(t => 
                            t.installmentGroupId === selectedTransaction.installmentGroupId && 
                            selectedInstallmentIds.includes(t.id)
                          )
                          const unpaid = selectedTransactions.filter(t => !t.isPaid).length
                          const paid = selectedTransactions.filter(t => t.isPaid).length
                          
                          let actions = []
                          if (unpaid > 0) {
                            actions.push(selectedTransaction.type === 'receita' 
                              ? `${unpaid} pode(m) ser recebida(s)` 
                              : `${unpaid} pode(m) ser paga(s)`)
                          }
                          if (paid > 0) {
                            actions.push(selectedTransaction.type === 'receita' 
                              ? `${paid} pode(m) ser desmarcada(s) como não recebida(s)` 
                              : `${paid} pode(m) ser desmarcada(s) como não paga(s)`)
                          }
                          
                          return ` ${actions.join(', ')}`
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* Botões principais - Ações primárias */}
              <div className="flex space-x-3">
                {(() => {
                  // Calcular quais tipos de faturas estão selecionadas
                  const selectedTransactions = selectedTransaction.isGrouped 
                    ? transactions.filter(t => 
                        t.installmentGroupId === selectedTransaction.installmentGroupId && 
                        selectedInstallmentIds.includes(t.id)
                      )
                    : [selectedTransaction]
                  
                  const hasUnpaidSelected = selectedTransactions.some(t => !t.isPaid)
                  const hasPaidSelected = selectedTransactions.some(t => t.isPaid)
                  
                  return (
                    <>
                      {/* Botão Pagar - só habilitado se há faturas não pagas selecionadas */}
                      <button
                        onClick={handleConfirmPayment}
                        disabled={selectedTransaction.isGrouped && selectedInstallmentIds.length > 0 && !hasUnpaidSelected}
                        className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                          selectedTransaction.isPaid
                            ? 'bg-yellow-600 hover:bg-yellow-700'
                            : selectedTransaction.isGrouped && selectedInstallmentIds.length > 0 && !hasUnpaidSelected
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {selectedTransaction.isPaid 
                          ? (selectedTransaction.type === 'receita' ? 'Marcar como Não Recebido' : 'Marcar como Não Pago')
                          : selectedTransaction.isGrouped 
                            ? (selectedInstallmentIds.length > 0 
                                ? (selectedTransaction.type === 'receita' 
                                    ? `Receber ${selectedTransactions.filter(t => !t.isPaid).length} Parcela(s)` 
                                    : `Pagar ${selectedTransactions.filter(t => !t.isPaid).length} Fatura(s)`)
                                : (selectedTransaction.type === 'receita' ? 'Receber Próxima Parcela' : 'Pagar Próxima Fatura')) 
                            : (selectedTransaction.type === 'receita' ? 'Confirmar Recebimento' : 'Confirmar Pagamento')
                        }
                      </button>
                      
                      {/* Botão Desmarcar - só habilitado se há faturas pagas selecionadas */}
                      {selectedTransaction.isGrouped && (
                        <button
                          onClick={handleUnmarkPaid}
                          disabled={selectedInstallmentIds.length > 0 && !hasPaidSelected}
                          className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                            selectedInstallmentIds.length > 0 && !hasPaidSelected
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {selectedInstallmentIds.length > 0 
                            ? (selectedTransaction.type === 'receita' 
                                ? `Desmarcar ${selectedTransactions.filter(t => t.isPaid).length} Parcela(s)`
                                : `Desmarcar ${selectedTransactions.filter(t => t.isPaid).length} Fatura(s)`)
                            : (selectedTransaction.type === 'receita' ? 'Parcela Não Recebida' : 'Fatura Não Paga')
                          }
                        </button>
                      )}
                    </>
                  )
                })()}
              </div>
              
              {/* Botão secundário - Cancelar */}
              <button
                onClick={handleCancelPayment}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Filtros */}
      {isFiltersModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900">Filtros</h3>
              <button 
                onClick={() => setIsFiltersModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-lg lg:text-xl">×</span>
              </button>
            </div>
            
            <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
              {/* Período */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Período</label>
                <select 
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                >
                  <option value="personalizado">Personalizado</option>
                  <option value="este-mes">Este mês</option>
                  <option value="mes-passado">Mês passado</option>
                  <option value="ultimos-3-meses">Últimos 3 meses</option>
                </select>
              </div>
              
              {/* Data de Início */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">De</label>
                <div className="relative">
                  <input 
                    id="start-date-input"
                    type="date" 
                    disabled={periodFilter !== 'personalizado'}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:min-w-[140px] ${
                      periodFilter !== 'personalizado' 
                        ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
                        : ''
                    }`}
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if (periodFilter === 'personalizado') {
                        const input = document.getElementById('start-date-input') as HTMLInputElement
                        input?.showPicker()
                      }
                    }}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      periodFilter !== 'personalizado' 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-400 hover:text-gray-600 cursor-pointer'
                    }`}
                    disabled={periodFilter !== 'personalizado'}
                  >
                    📅
                  </button>
                </div>
              </div>
              
              {/* Data de Fim */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Até</label>
                <div className="relative">
                  <input 
                    id="end-date-input"
                    type="date" 
                    disabled={periodFilter !== 'personalizado'}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:min-w-[140px] ${
                      periodFilter !== 'personalizado' 
                        ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
                        : ''
                    }`}
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if (periodFilter === 'personalizado') {
                        const input = document.getElementById('end-date-input') as HTMLInputElement
                        input?.showPicker()
                      }
                    }}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      periodFilter !== 'personalizado' 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-400 hover:text-gray-600 cursor-pointer'
                    }`}
                    disabled={periodFilter !== 'personalizado'}
                  >
                    📅
                  </button>
                </div>
              </div>
              
              {/* Tipo */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Tipo</label>
                <select 
                  value={transactionTypeFilter}
                  onChange={(e) => setTransactionTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                >
                  <option value="todas">Todas</option>
                  <option value="receitas">Receitas</option>
                  <option value="despesas">Despesas</option>
                  <option value="contas-parceladas">Parceladas</option>
                  <option value="receitas-parceladas">Rec. Parceladas</option>
                </select>
              </div>
            </div>
            
            {/* Botões do Modal */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 lg:p-6 border-t border-gray-200 space-y-2 sm:space-y-0 sm:space-x-3">
              <button 
                onClick={clearFilters}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-xs lg:text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <span>♻️</span>
                <span>Limpar filtros</span>
              </button>
              <button 
                onClick={() => setIsFiltersModalOpen(false)}
                className="flex items-center justify-center space-x-2 px-6 py-2 text-xs lg:text-sm font-medium text-white border rounded-lg transition-colors shadow-md"
                style={{ 
                  backgroundColor: 'rgb(34 197 94)', 
                  borderColor: 'rgb(34 197 94)' 
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = 'rgb(30 180 85)';
                  (e.target as HTMLElement).style.borderColor = 'rgb(30 180 85)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = 'rgb(34 197 94)';
                  (e.target as HTMLElement).style.borderColor = 'rgb(34 197 94)';
                }}
              >
                <span>✅</span>
                <span>Aplicar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Transactions
