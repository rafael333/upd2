import React, { useState } from 'react'
import { useTransactionsContext } from '../contexts/TransactionsContext'
import { useCategories } from '../hooks/useCategories'
import { useAuth } from '../contexts/AuthContext'

const Settings = () => {
  const { user } = useAuth()
  const { transactions, deleteTransaction } = useTransactionsContext()
  const { categories, deleteCategory } = useCategories(user?.uid || 'test-user-123')
  const [isDeleting, setIsDeleting] = useState<'transactions' | 'categories' | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleDeleteAllTransactions = async () => {
    if (confirmText !== 'EXCLUIR') {
      alert('Por favor, digite "EXCLUIR" para confirmar a exclusão de todas as transações.')
      return
    }

    setIsDeleting('transactions')
    try {
      // Deletar todas as transações
      for (const transaction of transactions) {
        await deleteTransaction(transaction.id)
      }
      alert('✅ Todas as transações foram excluídas com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir transações:', error)
      alert('❌ Erro ao excluir transações. Tente novamente.')
    } finally {
      setIsDeleting(null)
      setShowConfirm(false)
      setConfirmText('')
    }
  }

  const handleDeleteAllCategories = async () => {
    if (confirmText !== 'EXCLUIR') {
      alert('Por favor, digite "EXCLUIR" para confirmar a exclusão de todas as categorias.')
      return
    }

    setIsDeleting('categories')
    try {
      // Deletar todas as categorias
      for (const category of categories) {
        await deleteCategory(category.id)
      }
      alert('✅ Todas as categorias foram excluídas com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir categorias:', error)
      alert('❌ Erro ao excluir categorias. Tente novamente.')
    } finally {
      setIsDeleting(null)
      setShowConfirm(false)
      setConfirmText('')
    }
  }

  const openConfirmDialog = (type: 'transactions' | 'categories') => {
    setShowConfirm(true)
    setIsDeleting(type)
    setConfirmText('')
  }

  const closeConfirmDialog = () => {
    setShowConfirm(false)
    setIsDeleting(null)
    setConfirmText('')
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie suas categorias e transações</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Transações</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{transactions.length}</p>
              <p className="text-sm text-gray-500">Total de transações</p>
            </div>
            <div className="text-4xl">🔄</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Categorias</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{categories.length}</p>
              <p className="text-sm text-gray-500">Total de categorias</p>
            </div>
            <div className="text-4xl">📂</div>
          </div>
        </div>
      </div>

      {/* Ações de Exclusão */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações de Limpeza</h3>
        <p className="text-gray-600 mb-6">
          Use estas opções para limpar todos os dados. <strong>Atenção:</strong> Estas ações não podem ser desfeitas!
        </p>

        <div className="space-y-4">
          {/* Excluir Transações */}
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Excluir Todas as Transações</h4>
              <p className="text-sm text-gray-600">
                Remove todas as transações do sistema ({transactions.length} transações)
              </p>
            </div>
            <button
              onClick={() => openConfirmDialog('transactions')}
              disabled={transactions.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Excluir Transações
            </button>
          </div>

          {/* Excluir Categorias */}
          <div className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Excluir Todas as Categorias</h4>
              <p className="text-sm text-gray-600">
                Remove todas as categorias do sistema ({categories.length} categorias)
              </p>
            </div>
            <button
              onClick={() => openConfirmDialog('categories')}
              disabled={categories.length === 0}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Excluir Categorias
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="text-4xl mr-3">⚠️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar Exclusão
                </h3>
                <p className="text-sm text-gray-600">
                  {isDeleting === 'transactions' 
                    ? `Você está prestes a excluir TODAS as ${transactions.length} transações.`
                    : `Você está prestes a excluir TODAS as ${categories.length} categorias.`
                  }
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digite "EXCLUIR" para confirmar:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="EXCLUIR"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeConfirmDialog}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={isDeleting === 'transactions' ? handleDeleteAllTransactions : handleDeleteAllCategories}
                disabled={confirmText !== 'EXCLUIR' || (isDeleting === 'transactions' ? transactions.length === 0 : categories.length === 0)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting === 'transactions' ? 'Excluir Transações' : 'Excluir Categorias'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings





