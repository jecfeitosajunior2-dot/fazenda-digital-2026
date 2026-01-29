/**
 * Sistema de Sincronização Offline/Online
 * Gerencia a sincronização de dados entre o dispositivo local e o servidor
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";

export type SyncStatus = "online" | "offline" | "syncing" | "error";

export interface SyncAction {
  id: string;
  type: "create" | "update" | "delete";
  entity: string; // "animal", "venda", "custo", etc.
  data: any;
  timestamp: number;
  synced: boolean;
}

class SyncManager {
  private syncQueue: SyncAction[] = [];
  private status: SyncStatus = "offline";
  private listeners: ((status: SyncStatus) => void)[] = [];
  private syncInProgress = false;

  constructor() {
    this.init();
  }

  private async init() {
    // Carregar fila de sincronização do storage
    await this.loadSyncQueue();

    // Monitorar conexão de rede
    NetInfo.addEventListener((state: any) => {
      const wasOffline = this.status === "offline";
      this.status = state.isConnected ? "online" : "offline";
      this.notifyListeners();

      // Se voltou online, sincronizar automaticamente
      if (wasOffline && state.isConnected) {
        this.syncAll();
      }
    });

    // Verificar status inicial
    const state = await NetInfo.fetch();
    this.status = state.isConnected ? "online" : "offline";
    this.notifyListeners();
  }

  /**
   * Adiciona uma ação à fila de sincronização
   */
  async addToQueue(action: Omit<SyncAction, "id" | "timestamp" | "synced">) {
    const syncAction: SyncAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false,
    };

    this.syncQueue.push(syncAction);
    await this.saveSyncQueue();

    // Se estiver online, tentar sincronizar imediatamente
    if (this.status === "online") {
      this.syncAll();
    }

    return syncAction.id;
  }

  /**
   * Sincroniza todas as ações pendentes com o servidor
   */
  async syncAll() {
    if (this.syncInProgress || this.status === "offline") {
      return;
    }

    this.syncInProgress = true;
    this.status = "syncing";
    this.notifyListeners();

    try {
      const pendingActions = this.syncQueue.filter((action) => !action.synced);

      for (const action of pendingActions) {
        try {
          await this.syncAction(action);
          action.synced = true;
        } catch (error) {
          console.error(`Erro ao sincronizar ação ${action.id}:`, error);
          // Continua tentando as próximas ações
        }
      }

      // Remove ações sincronizadas da fila
      this.syncQueue = this.syncQueue.filter((action) => !action.synced);
      await this.saveSyncQueue();

      this.status = "online";
    } catch (error) {
      console.error("Erro na sincronização:", error);
      this.status = "error";
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  /**
   * Sincroniza uma ação específica com o servidor
   */
  private async syncAction(action: SyncAction): Promise<void> {
    // TODO: Implementar chamada real para o backend via tRPC
    // Por enquanto, simula sucesso
    return new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  /**
   * Salva a fila de sincronização no storage
   */
  private async saveSyncQueue() {
    try {
      await AsyncStorage.setItem("@sync_queue", JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error("Erro ao salvar fila de sincronização:", error);
    }
  }

  /**
   * Carrega a fila de sincronização do storage
   */
  private async loadSyncQueue() {
    try {
      const data = await AsyncStorage.getItem("@sync_queue");
      if (data) {
        this.syncQueue = JSON.parse(data);
      }
    } catch (error) {
      console.error("Erro ao carregar fila de sincronização:", error);
    }
  }

  /**
   * Registra um listener para mudanças de status
   */
  onStatusChange(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    // Retorna função para remover o listener
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notifica todos os listeners sobre mudança de status
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.status));
  }

  /**
   * Retorna o status atual
   */
  getStatus(): SyncStatus {
    return this.status;
  }

  /**
   * Retorna o número de ações pendentes
   */
  getPendingCount(): number {
    return this.syncQueue.filter((action) => !action.synced).length;
  }

  /**
   * Limpa a fila de sincronização (usar com cuidado!)
   */
  async clearQueue() {
    this.syncQueue = [];
    await this.saveSyncQueue();
  }
}

// Exporta instância singleton
export const syncManager = new SyncManager();
