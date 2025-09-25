// Exportar configuração do Firebase
export { db, auth, storage, analytics } from './config';

// Exportar tipos
export type { User, Transaction, Category, Budget } from './types';

// Exportar serviços
export { transactionService } from './services/transactions';
export { categoryService } from './services/categories';
