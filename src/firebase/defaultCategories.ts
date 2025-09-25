import { Category } from './types';

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Categorias de Despesas
  {
    userId: '', // Será preenchido dinamicamente
    name: 'Alimentação',
    color: '#FF6B6B',
    icon: '🍕',
    type: 'despesa'
  },
  {
    userId: '',
    name: 'Transporte',
    color: '#4ECDC4',
    icon: '🚗',
    type: 'despesa'
  },
  {
    userId: '',
    name: 'Moradia',
    color: '#45B7D1',
    icon: '🏠',
    type: 'despesa'
  },
  {
    userId: '',
    name: 'Saúde',
    color: '#96CEB4',
    icon: '💊',
    type: 'despesa'
  },
  {
    userId: '',
    name: 'Lazer',
    color: '#FFEAA7',
    icon: '🎮',
    type: 'despesa'
  },
  {
    userId: '',
    name: 'Educação',
    color: '#DDA0DD',
    icon: '📚',
    type: 'despesa'
  },
  {
    userId: '',
    name: 'Roupas',
    color: '#F8BBD9',
    icon: '👕',
    type: 'despesa'
  },
  {
    userId: '',
    name: 'Contas',
    color: '#FFB347',
    icon: '💡',
    type: 'despesa'
  },
  {
    userId: '',
    name: 'Outros',
    color: '#D3D3D3',
    icon: '📦',
    type: 'despesa'
  },
  
  // Categorias de Receitas
  {
    userId: '',
    name: 'Salário',
    color: '#2ECC71',
    icon: '💰',
    type: 'receita'
  },
  {
    userId: '',
    name: 'Freelance',
    color: '#3498DB',
    icon: '💼',
    type: 'receita'
  },
  {
    userId: '',
    name: 'Investimentos',
    color: '#9B59B6',
    icon: '📈',
    type: 'receita'
  },
  {
    userId: '',
    name: 'Vendas',
    color: '#E67E22',
    icon: '🛒',
    type: 'receita'
  },
  {
    userId: '',
    name: 'Outros',
    color: '#95A5A6',
    icon: '💵',
    type: 'receita'
  }
];

export const initializeDefaultCategories = async (userId: string, categoryService: any) => {
  console.log('🚀 [DefaultCategories] Inicializando categorias padrão para usuário:', userId);
  
  try {
    // Verificar se o usuário já tem categorias
    const existingCategories = await categoryService.getByUser(userId);
    
    if (existingCategories.length > 0) {
      console.log('ℹ️ [DefaultCategories] Usuário já possui categorias, pulando inicialização');
      return;
    }
    
    console.log('📝 [DefaultCategories] Criando categorias padrão...');
    
    // Criar todas as categorias padrão
    const createPromises = DEFAULT_CATEGORIES.map(category => 
      categoryService.create({
        ...category,
        userId
      })
    );
    
    await Promise.all(createPromises);
    
    console.log('✅ [DefaultCategories] Categorias padrão criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ [DefaultCategories] Erro ao inicializar categorias padrão:', error);
    throw error;
  }
};

