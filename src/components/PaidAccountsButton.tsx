import React from 'react'

interface PaidAccountsButtonProps {
  onClick: () => void
  className?: string
  notificationCount?: number
}

const PaidAccountsButton: React.FC<PaidAccountsButtonProps> = ({ 
  onClick, 
  className = '', 
  notificationCount = 0 
}) => {
  return (
    <button
      onClick={onClick}
      className={`rounded-full font-medium transition-all duration-200 relative ${className}`}
    >
      Pagas
      {/* Badge de notificação */}
      {notificationCount > 0 && (
        <div className="absolute top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-lg border border-white animate-pulse" style={{ animationDuration: '2s' }}>
          {notificationCount > 99 ? '99+' : notificationCount}
        </div>
      )}
    </button>
  )
}

export default PaidAccountsButton


