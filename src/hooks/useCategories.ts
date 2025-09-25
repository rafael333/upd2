import { useState, useEffect } from 'react';
import { categoryService, Category } from '../firebase';

export const useCategories = (userId: string) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar categorias
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getByUser(userId);
      setCategories(data);
    } catch (err) {
      setError('Erro ao carregar categorias');
      console.error('❌ Hook useCategories: Erro ao carregar categorias:', err);
    } finally {
      setLoading(false);
    }
  };


  // Criar nova categoria
  const createCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const id = await categoryService.create(categoryData);
      await loadCategories(); // Recarregar lista
      return id;
    } catch (err) {
      setError('Erro ao criar categoria');
      console.error('❌ Hook useCategories: Erro ao criar categoria:', err);
      throw err;
    }
  };

  // Atualizar categoria
  const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      setError(null);
      await categoryService.update(id, updates);
      await loadCategories(); // Recarregar lista
    } catch (err) {
      setError('Erro ao atualizar categoria');
      console.error('Erro ao atualizar categoria:', err);
      throw err;
    }
  };

  // Deletar categoria
  const deleteCategory = async (id: string) => {
    try {
      setError(null);
      await categoryService.delete(id);
      await loadCategories(); // Recarregar lista
    } catch (err) {
      setError('Erro ao deletar categoria');
      console.error('Erro ao deletar categoria:', err);
      throw err;
    }
  };

  // Carregar categorias por tipo
  const loadCategoriesByType = async (type: 'receita' | 'despesa') => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getByType(userId, type);
      setCategories(data);
    } catch (err) {
      setError('Erro ao carregar categorias por tipo');
      console.error('Erro ao carregar categorias por tipo:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar categorias na inicialização
  useEffect(() => {
    if (userId) {
      loadCategories();
    }
  }, [userId]);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    loadCategories,
    loadCategoriesByType,
  };
};







