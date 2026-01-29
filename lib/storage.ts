/**
 * Abstração Unificada de Storage
 * Funciona em mobile (AsyncStorage) e web (IndexedDB)
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================
// IndexedDB para Web
// ============================================

class IndexedDBManager {
  private dbName = "fazenda_digital";
  private version = 1;
  private db: IDBDatabase | null = null;

  async init() {
    if (Platform.OS !== "web") return;

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Criar object stores (tabelas)
        const stores = [
          "usuario",
          "fazenda",
          "animais",
          "vendas",
          "custos",
          "sync_queue",
        ];

        stores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
          }
        });
      };
    });
  }

  async save(storeName: string, data: any) {
    if (!this.db) await this.init();
    if (!this.db) throw new Error("IndexedDB not initialized");

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName: string) {
    if (!this.db) await this.init();
    if (!this.db) throw new Error("IndexedDB not initialized");

    return new Promise<any[]>((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string | number) {
    if (!this.db) await this.init();
    if (!this.db) throw new Error("IndexedDB not initialized");

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string) {
    if (!this.db) await this.init();
    if (!this.db) throw new Error("IndexedDB not initialized");

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const indexedDBManager = new IndexedDBManager();

// ============================================
// Storage Manager Unificado
// ============================================

export class StorageManager {
  /**
   * Salva dados no storage (AsyncStorage ou IndexedDB)
   */
  async save(key: string, data: any): Promise<void> {
    if (Platform.OS === "web") {
      await indexedDBManager.save(key, data);
    } else {
      await AsyncStorage.setItem(`@${key}`, JSON.stringify(data));
    }
  }

  /**
   * Carrega dados do storage
   */
  async get(key: string): Promise<any> {
    if (Platform.OS === "web") {
      const data = await indexedDBManager.getAll(key);
      return data.length > 0 ? data : null;
    } else {
      const data = await AsyncStorage.getItem(`@${key}`);
      return data ? JSON.parse(data) : null;
    }
  }

  /**
   * Deleta dados do storage
   */
  async delete(key: string, id?: string | number): Promise<void> {
    if (Platform.OS === "web") {
      if (id) {
        await indexedDBManager.delete(key, id);
      } else {
        await indexedDBManager.clear(key);
      }
    } else {
      await AsyncStorage.removeItem(`@${key}`);
    }
  }

  /**
   * Limpa todos os dados
   */
  async clearAll(): Promise<void> {
    if (Platform.OS === "web") {
      const stores = ["usuario", "fazenda", "animais", "vendas", "custos", "sync_queue"];
      for (const store of stores) {
        await indexedDBManager.clear(store);
      }
    } else {
      await AsyncStorage.clear();
    }
  }

  /**
   * Verifica se uma chave existe
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }
}

// Exporta instância singleton
export const storage = new StorageManager();

// Exporta chaves de storage para consistência
export const STORAGE_KEYS = {
  USUARIO: "usuario",
  FAZENDA: "fazenda",
  ANIMAIS: "animais",
  VENDAS: "vendas",
  CUSTOS: "custos",
  SYNC_QUEUE: "sync_queue",
  LAST_SYNC: "last_sync",
} as const;
