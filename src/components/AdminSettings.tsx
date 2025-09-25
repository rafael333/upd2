import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

const AdminSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: "AIzaSyAKOQ_7Q6pR6UvinMwtzrNdLgpBxZ-QTxk",
    authDomain: "apprafael-c7411.firebaseapp.com",
    projectId: "apprafael-c7411",
    storageBucket: "apprafael-c7411.firebasestorage.app",
    messagingSenderId: "389810659865",
    appId: "1:389810659865:web:3392a3c2fe3aef4710c088",
    measurementId: "G-0P0HZ6ST2P"
  });
  const [environment, setEnvironment] = useState<'development' | 'production'>('development');
  const [message, setMessage] = useState('');

  const handleConfigChange = (field: keyof FirebaseConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveConfig = () => {
    // Aqui você pode implementar a lógica para salvar as configurações
    // Por exemplo, salvar no localStorage ou enviar para um servidor
    localStorage.setItem('firebaseConfig', JSON.stringify(config));
    localStorage.setItem('environment', environment);
    setMessage('Configurações salvas com sucesso!');
    setTimeout(() => setMessage(''), 3000);
  };

  const resetToDefault = () => {
    setConfig({
      apiKey: "AIzaSyAKOQ_7Q6pR6UvinMwtzrNdLgpBxZ-QTxk",
      authDomain: "apprafael-c7411.firebaseapp.com",
      projectId: "apprafael-c7411",
      storageBucket: "apprafael-c7411.firebasestorage.app",
      messagingSenderId: "389810659865",
      appId: "1:389810659865:web:3392a3c2fe3aef4710c088",
      measurementId: "G-0P0HZ6ST2P"
    });
    setEnvironment('development');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Configurações do Sistema
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Logado como: {user?.email}
                </span>
                <button
                  onClick={logout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Sair
                </button>
              </div>
            </div>

            {message && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                {message}
              </div>
            )}

            <div className="space-y-6">
              {/* Seleção de Ambiente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ambiente
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="development"
                      checked={environment === 'development'}
                      onChange={(e) => setEnvironment(e.target.value as 'development' | 'production')}
                      className="mr-2"
                    />
                    Desenvolvimento
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="production"
                      checked={environment === 'production'}
                      onChange={(e) => setEnvironment(e.target.value as 'development' | 'production')}
                      className="mr-2"
                    />
                    Produção
                  </label>
                </div>
              </div>

              {/* Configurações do Firebase */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Configurações do Firebase
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key
                    </label>
                    <input
                      type="text"
                      value={config.apiKey}
                      onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auth Domain
                    </label>
                    <input
                      type="text"
                      value={config.authDomain}
                      onChange={(e) => handleConfigChange('authDomain', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project ID
                    </label>
                    <input
                      type="text"
                      value={config.projectId}
                      onChange={(e) => handleConfigChange('projectId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Storage Bucket
                    </label>
                    <input
                      type="text"
                      value={config.storageBucket}
                      onChange={(e) => handleConfigChange('storageBucket', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Messaging Sender ID
                    </label>
                    <input
                      type="text"
                      value={config.messagingSenderId}
                      onChange={(e) => handleConfigChange('messagingSenderId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      App ID
                    </label>
                    <input
                      type="text"
                      value={config.appId}
                      onChange={(e) => handleConfigChange('appId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Measurement ID
                    </label>
                    <input
                      type="text"
                      value={config.measurementId}
                      onChange={(e) => handleConfigChange('measurementId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-between">
                <button
                  onClick={resetToDefault}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Restaurar Padrão
                </button>
                <button
                  onClick={saveConfig}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

