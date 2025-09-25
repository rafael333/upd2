import { useState, useEffect, useMemo } from 'react';
import { useTransactionsContext } from '../contexts/TransactionsContext';
import { useCategories } from './useCategories';
import { Category } from '../firebase/types';

interface BudgetItem {
  name: string;
  actual: number;
  budget: number;
  color: string;
}

interface UseBudgetReturn {
  budgetData: BudgetItem[];
  categories: Category[];
  loading: boolean;
  error: string | null;
}

export const useBudget = (selectedPeriod?: string, userId?: string, typeFilter?: 'receita' | 'despesa' | 'all'): UseBudgetReturn => {
  const { transactions, loading, error } = useTransactionsContext();
  const { categories: allCategories } = useCategories(userId || '');

  const budgetData = useMemo(() => {
    if (!transactions || !allCategories) return [];

    // Filtrar transações por período
    const now = new Date();
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      
      switch (selectedPeriod) {
        case 'current-month':
          return transactionDate.getMonth() === now.getMonth() && 
                 transactionDate.getFullYear() === now.getFullYear();
        case 'last-month':
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          return transactionDate.getMonth() === lastMonth && 
                 transactionDate.getFullYear() === lastYear;
        case 'current-year':
          return transactionDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    // Filtrar por tipo se especificado
    const typeFilteredTransactions = typeFilter === 'all' 
      ? filteredTransactions 
      : filteredTransactions.filter(transaction => transaction.type === typeFilter);

    // Agrupar por categoria
    const categoryTotals = typeFilteredTransactions.reduce((acc, transaction) => {
      const categoryId = transaction.category;
      if (!acc[categoryId]) {
        acc[categoryId] = 0;
      }
      acc[categoryId] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    // Criar dados do orçamento
    return allCategories
      .filter((category: Category) => category.type === (typeFilter === 'all' ? 'despesa' : typeFilter))
      .map((category: Category) => ({
        name: category.name,
        actual: categoryTotals[category.id] || 0,
        budget: 1000, // Valor padrão do orçamento
        color: category.color || '#3B82F6'
      }))
      .sort((a: BudgetItem, b: BudgetItem) => b.actual - a.actual);
  }, [transactions, allCategories, selectedPeriod, typeFilter]);

  return {
    budgetData,
    categories: allCategories || [],
    loading,
    error
  };
};


