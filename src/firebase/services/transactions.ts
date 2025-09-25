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
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config';
import { Transaction } from '../types';

const COLLECTION_NAME = 'transactions';

export const transactionService = {
  // Criar nova transação
  async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    
    // Remover campos undefined para evitar erro no Firebase
    const cleanTransaction = Object.fromEntries(
      Object.entries(transaction).filter(([_, value]) => value !== undefined)
    );
    
    // Converter a data para Timestamp para evitar problemas de fuso horário
    const transactionData = {
      ...cleanTransaction,
      date: Timestamp.fromDate(transaction.date),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), transactionData);
    return docRef.id;
  },

  // Buscar transações por usuário
  async getByUser(userId: string): Promise<Transaction[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const transaction = {
        id: doc.id,
        userId: data.userId,
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: data.date.toDate(),
        paymentMethod: data.paymentMethod,
        installments: data.installments,
        installmentNumber: data.installmentNumber,
        totalInstallmentAmount: data.totalInstallmentAmount,
        installmentGroupId: data.installmentGroupId,
        isPaid: data.isPaid,
        notes: data.notes,
        recurring: data.recurring,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Transaction;
      
      return transaction;
    });
    
    // Ordenar por data no JavaScript (mais recente primeiro)
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  },

  // Buscar transações por período
  async getByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Transaction[];
  },

  // Buscar transações por categoria
  async getByCategory(userId: string, category: string): Promise<Transaction[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('category', '==', category),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Transaction[];
  },

  // Atualizar transação
  async update(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Remover campos undefined para evitar erro no Firebase
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    console.log('🔄 Firebase Service: Atualizando transação:', {
      id,
      updates: JSON.stringify(updates),
      cleanUpdates: JSON.stringify(cleanUpdates)
    });
    
    await updateDoc(docRef, {
      ...cleanUpdates,
      updatedAt: Timestamp.fromDate(new Date()),
    });
    
    console.log('✅ Firebase Service: Transação atualizada no Firebase');
  },

  // Deletar transação
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  // Buscar transação por ID
  async getById(id: string): Promise<Transaction | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        date: docSnap.data().date.toDate(),
        createdAt: docSnap.data().createdAt.toDate(),
        updatedAt: docSnap.data().updatedAt.toDate(),
      } as Transaction;
    }
    
    return null;
  },

  // Buscar últimas transações
  async getRecent(userId: string, limitCount: number = 10): Promise<Transaction[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Transaction[];
  },

  // Marcar parcela como paga
  async markAsPaid(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      isPaid: true,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // Marcar parcela como não paga
  async markAsUnpaid(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      isPaid: false,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }
};







