import React, { useState, useEffect, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const ErrorBoundary: React.FC<Props> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.message));
      console.error('🚨 ErrorBoundary capturou um erro:', event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setError(new Error(event.reason));
      console.error('🚨 ErrorBoundary capturou um erro de promise:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Algo deu errado!</h1>
          <p className="text-gray-600 mb-6">
            Ocorreu um erro inesperado. Recarregue a página para tentar novamente.
          </p>
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <p className="text-sm text-red-800 font-mono">
              {error?.message || 'Erro desconhecido'}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ErrorBoundary;


