import { useState } from 'react'
import Sidebar from './components/Sidebar'
import SummaryCards from './components/SummaryCards'
import ExpenseChart from './components/ExpenseChart'
import FinancialEvolution from './components/FinancialEvolution'
import Transactions from './components/Transactions'
import Budgets from './components/Budgets'
import Budget from './components/Budget'
import InstallmentAccounts from './components/InstallmentAccounts'
import PaidAccountsButton from './components/PaidAccountsButton'
import Settings from './components/Settings'
import Login from './components/Login'
import AdminSettings from './components/AdminSettings'
import ErrorBoundary from './components/ErrorBoundary'
import { TransactionsProvider } from './contexts/TransactionsContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function AppContent() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'transactions':
        return (
          <>
            <Transactions />
            <div className="hidden lg:block">
              <Budget />
            </div>
          </>
        )
      case 'budgets':
        return <Budgets />
      case 'settings':
        return <Settings />
      case 'admin':
        return <AdminSettings />
      default:
        return (
          <>
            <SummaryCards />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 lg:gap-6">
              <ExpenseChart />
              <FinancialEvolution selectedMonth={new Date().getMonth()} selectedYear={new Date().getFullYear()} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
              <div className="bg-white p-3 lg:p-6 rounded-lg shadow border">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 lg:mb-4 space-y-2 sm:space-y-0">
                  <h3 className="text-sm lg:text-lg font-semibold text-gray-900">Atividades Recentes</h3>
                  <PaidAccountsButton onClick={() => {}} />
                </div>
                <p className="text-xs lg:text-base text-gray-600">Lista de atividades recentes será exibida aqui.</p>
              </div>
              <InstallmentAccounts />
            </div>
          </>
        )
    }
  }

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'transactions':
        return 'Transações'
      case 'budgets':
        return 'Relatórios'
      case 'settings':
        return 'Configurações'
      case 'admin':
        return 'Configurações do Sistema'
      case 'dashboard':
        return 'Dashboard Financeiro'
      default:
        return 'Dashboard Financeiro'
    }
  }

  return (
    <TransactionsProvider userId={user.uid}>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <div className="flex max-w-full">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 lg:ml-0 ml-0 min-w-0 overflow-x-hidden">
            <main className="px-3 lg:px-6 py-4 lg:py-6 space-y-3 lg:space-y-6 pb-24 lg:pb-6 max-w-full overflow-x-hidden">
              {renderContent()}
            </main>
          </div>
        </div>
      </div>
    </TransactionsProvider>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App;