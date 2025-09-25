import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../config';

const COLLECTION_NAME = 'userSettings';

export interface UserSettings {
  userId: string;
  monthlyGoal: number;
  createdAt: Date;
  updatedAt: Date;
}

export const settingsService = {
  // Salvar ou atualizar configurações do usuário
  async saveSettings(userId: string, settings: Partial<Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const now = new Date();
    
    // Verificar se o documento já existe
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Atualizar configurações existentes
      await updateDoc(docRef, {
        ...settings,
        updatedAt: now,
      });
    } else {
      // Criar novas configurações
      await setDoc(docRef, {
        userId,
        ...settings,
        createdAt: now,
        updatedAt: now,
      });
    }
  },

  // Buscar configurações do usuário
  async getSettings(userId: string): Promise<UserSettings | null> {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        userId: data.userId,
        monthlyGoal: data.monthlyGoal || 25000,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as UserSettings;
    }
    
    return null;
  },

  // Salvar meta mensal
  async saveMonthlyGoal(userId: string, monthlyGoal: number): Promise<void> {
    await this.saveSettings(userId, { monthlyGoal });
  }
};
