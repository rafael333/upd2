// Tipos para as coleções do Firestore

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  date: Date;
  paymentMethod: 'dinheiro' | 'cartao' | 'pix' | 'transferencia';
  installments?: number;
  installmentNumber?: number; // Número da parcela atual (1, 2, 3...)
  totalInstallmentAmount?: number; // Valor total original da transação parcelada
  installmentGroupId?: string; // ID para agrupar parcelas da mesma transação
  isPaid?: boolean; // Se a parcela foi paga (check-in manual)
  notes?: string;
  recurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  description?: string; // Descrição opcional da categoria
  color: string;
  icon: string;
  type: 'receita' | 'despesa' | 'geral';
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  period: 'mensal' | 'anual';
  startDate: Date;
  endDate: Date;
  notifications: {
    budget50: boolean;
    budget80: boolean;
    budgetExceeded: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}








