import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config';
import { Category } from '../types';

const COLLECTION_NAME = 'categories';

export const categoryService = {
  // Criar nova categoria
  async create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...category,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
      return docRef.id;
    } catch (error) {
      console.error('❌ Firebase Service: Erro ao criar categoria:', error);
      throw error;
    }
  },

  // Buscar categorias por usuário
  async getByUser(userId: string): Promise<Category[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Category[];
    
    // Ordenar localmente para evitar necessidade de índice
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  },

  // Buscar categorias por tipo
  async getByType(userId: string, type: 'receita' | 'despesa'): Promise<Category[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('type', '==', type)
    );
    
    const querySnapshot = await getDocs(q);
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Category[];
    
    // Ordenar localmente para evitar necessidade de índice
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  },

  // Atualizar categoria
  async update(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // Deletar categoria
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  // Buscar categoria por ID
  async getById(id: string): Promise<Category | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate(),
        updatedAt: docSnap.data().updatedAt.toDate(),
      } as Category;
    }
    
    return null;
  }
};







