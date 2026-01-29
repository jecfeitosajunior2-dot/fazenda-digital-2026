# Guia Completo: Modo Offline + Versão Oficial

**Fazenda Digital v5.0**

Este documento contém tudo que você precisa para ter o app funcionando 100% offline (mobile + web) com sincronização inteligente e backend real.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Implementação Mobile](#implementação-mobile)
4. [Implementação Web](#implementação-web)
5. [Sistema de Sincronização](#sistema-de-sincronização)
6. [Backend Real](#backend-real)
7. [Testes](#testes)
8. [Deploy](#deploy)

---

## 1. Visão Geral

### O Que Já Está Pronto ✅

- ✅ Estrutura base do app (mobile + web)
- ✅ Interface completa (todas as telas)
- ✅ AsyncStorage configurado (mobile)
- ✅ Sistema de sincronização (`lib/sync-manager.ts`)
- ✅ Detecção de conexão (`@react-native-community/netinfo`)

### O Que Falta Implementar 🔧

- 🔧 Conectar autenticação com backend (tRPC)
- 🔧 Implementar IndexedDB para web
- 🔧 Integrar sync-manager em todas as telas
- 🔧 Criar indicadores visuais de status
- 🔧 Implementar fila de sincronização completa
- 🔧 Testes end-to-end

---

## 2. Arquitetura

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                         USUÁRIO                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    INTERFACE (UI)                            │
│  • Telas do app (rebanho, vendas, custos, etc.)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  CAMADA DE DADOS                             │
│  • Mobile: AsyncStorage                                      │
│  • Web: IndexedDB                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               SYNC MANAGER                                   │
│  • Detecta conexão (online/offline)                         │
│  • Mantém fila de ações pendentes                           │
│  • Sincroniza quando conectar                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ (quando online)
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (tRPC)                              │
│  • APIs REST                                                 │
│  • PostgreSQL                                                │
│  • Autenticação                                              │
└─────────────────────────────────────────────────────────────┘
```

### Estados do App

| Estado | Descrição | Ações Permitidas |
|--------|-----------|------------------|
| **Offline** | Sem conexão com internet | Ler/escrever localmente |
| **Online** | Conectado ao servidor | Ler/escrever + sincronizar |
| **Syncing** | Sincronizando dados | Aguardar conclusão |
| **Error** | Erro na sincronização | Tentar novamente |

---

## 3. Implementação Mobile

### 3.1. AsyncStorage (Já Configurado)

O AsyncStorage já está instalado e pronto para uso:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

// Salvar dados
await AsyncStorage.setItem("@animais", JSON.stringify(animais));

// Carregar dados
const data = await AsyncStorage.getItem("@animais");
const animais = data ? JSON.parse(data) : [];

// Remover dados
await AsyncStorage.removeItem("@animais");

// Limpar tudo
await AsyncStorage.clear();
```

### 3.2. Estrutura de Dados Local

Organize os dados por entidade:

```typescript
// Chaves do AsyncStorage
const STORAGE_KEYS = {
  USUARIO: "@usuario",
  FAZENDA: "@fazenda",
  ANIMAIS: "@animais",
  VENDAS: "@vendas",
  CUSTOS: "@custos",
  SYNC_QUEUE: "@sync_queue",
  LAST_SYNC: "@last_sync",
};
```

### 3.3. Exemplo: Salvar Animal Offline

```typescript
import { syncManager } from "@/lib/sync-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function adicionarAnimal(animal: Animal) {
  // 1. Salvar localmente
  const animais = await carregarAnimais();
  animais.push(animal);
  await AsyncStorage.setItem("@animais", JSON.stringify(animais));

  // 2. Adicionar à fila de sincronização
  await syncManager.addToQueue({
    type: "create",
    entity: "animal",
    data: animal,
  });

  // 3. Se estiver online, sincronizar automaticamente
  // (o sync-manager faz isso automaticamente)
}
```

---

## 4. Implementação Web

### 4.1. IndexedDB

Para web, use IndexedDB (mais robusto que localStorage):

```typescript
// lib/indexed-db.ts
class IndexedDBManager {
  private dbName = "fazenda_digital";
  private version = 1;
  private db: IDBDatabase | null = null;

  async init() {
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
        if (!db.objectStoreNames.contains("animais")) {
          db.createObjectStore("animais", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("vendas")) {
          db.createObjectStore("vendas", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("custos")) {
          db.createObjectStore("custos", { keyPath: "id" });
        }
      };
    });
  }

  async save(storeName: string, data: any) {
    if (!this.db) await this.init();

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

    return new Promise<any[]>((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string) {
    if (!this.db) await this.init();

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDB = new IndexedDBManager();
```

### 4.2. Abstração Unificada

Crie uma camada que funcione em mobile E web:

```typescript
// lib/storage.ts
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { indexedDB } from "./indexed-db";

class StorageManager {
  async save(key: string, data: any) {
    if (Platform.OS === "web") {
      await indexedDB.save(key, data);
    } else {
      await AsyncStorage.setItem(`@${key}`, JSON.stringify(data));
    }
  }

  async get(key: string) {
    if (Platform.OS === "web") {
      return await indexedDB.getAll(key);
    } else {
      const data = await AsyncStorage.getItem(`@${key}`);
      return data ? JSON.parse(data) : null;
    }
  }

  async delete(key: string, id?: string) {
    if (Platform.OS === "web") {
      if (id) {
        await indexedDB.delete(key, id);
      }
    } else {
      await AsyncStorage.removeItem(`@${key}`);
    }
  }
}

export const storage = new StorageManager();
```

---

## 5. Sistema de Sincronização

### 5.1. Sync Manager (Já Implementado)

O arquivo `lib/sync-manager.ts` já está pronto com:

- ✅ Detecção de conexão
- ✅ Fila de sincronização
- ✅ Listeners de status
- ✅ Sincronização automática

### 5.2. Integrar nas Telas

Em cada tela que modifica dados, use o sync-manager:

```typescript
import { syncManager } from "@/lib/sync-manager";
import { storage } from "@/lib/storage";

function TelaRebanho() {
  const [syncStatus, setSyncStatus] = useState(syncManager.getStatus());

  useEffect(() => {
    // Escutar mudanças de status
    const unsubscribe = syncManager.onStatusChange(setSyncStatus);
    return unsubscribe;
  }, []);

  async function adicionarAnimal(animal: Animal) {
    // 1. Salvar localmente
    await storage.save("animais", animal);

    // 2. Adicionar à fila de sincronização
    await syncManager.addToQueue({
      type: "create",
      entity: "animal",
      data: animal,
    });
  }

  return (
    <View>
      {/* Indicador de status */}
      <StatusIndicator status={syncStatus} />

      {/* Resto da tela */}
    </View>
  );
}
```

### 5.3. Componente de Status

```typescript
// components/status-indicator.tsx
import { View, Text } from "react-native";
import { SyncStatus } from "@/lib/sync-manager";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export function StatusIndicator({ status }: { status: SyncStatus }) {
  const config = {
    online: {
      icon: "cloud-done",
      color: "#22C55E",
      text: "Online",
    },
    offline: {
      icon: "cloud-off",
      color: "#6C757D",
      text: "Offline",
    },
    syncing: {
      icon: "cloud-sync",
      color: "#0a7ea4",
      text: "Sincronizando...",
    },
    error: {
      icon: "cloud-off",
      color: "#E63946",
      text: "Erro",
    },
  };

  const { icon, color, text } = config[status];

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <MaterialIcons name={icon as any} size={16} color={color} />
      <Text style={{ fontSize: 12, color }}>{text}</Text>
    </View>
  );
}
```

---

## 6. Backend Real

### 6.1. Estrutura Atual

O backend já está configurado com:
- ✅ Express + tRPC
- ✅ PostgreSQL + Drizzle ORM
- ✅ Autenticação (JWT)
- ✅ APIs básicas

Localização: `server/`

### 6.2. Conectar Autenticação

Atualmente o `lib/auth-context.tsx` usa AsyncStorage local. Para conectar com backend:

```typescript
// lib/auth-context.tsx (atualizar)
import { trpc } from "./trpc";

async function login(email: string, senha: string) {
  try {
    // Chamar API real
    const response = await trpc.auth.login.mutate({ email, senha });

    if (response.success) {
      // Salvar token
      await AsyncStorage.setItem("@auth_token", response.token);
      await AsyncStorage.setItem("@usuario", JSON.stringify(response.usuario));

      setUsuario(response.usuario);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Erro no login:", error);
    return false;
  }
}
```

### 6.3. Criar Endpoints tRPC

No backend, crie os endpoints necessários:

```typescript
// server/trpc/routers/animais.ts
import { router, protectedProcedure } from "../trpc";
import { z } from "zod";

export const animaisRouter = router({
  listar: protectedProcedure.query(async ({ ctx }) => {
    // ctx.user contém o usuário autenticado
    const animais = await ctx.db.query.animais.findMany({
      where: eq(animais.userId, ctx.user.id),
    });
    return animais;
  }),

  criar: protectedProcedure
    .input(
      z.object({
        identificacao: z.string(),
        raca: z.string(),
        // ... outros campos
      })
    )
    .mutation(async ({ ctx, input }) => {
      const animal = await ctx.db.insert(animais).values({
        ...input,
        userId: ctx.user.id,
      });
      return animal;
    }),

  atualizar: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        // ... campos a atualizar
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(animais)
        .set(input)
        .where(eq(animais.id, input.id));
      return { success: true };
    }),

  deletar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(animais).where(eq(animais.id, input.id));
      return { success: true };
    }),
});
```

### 6.4. Implementar Sincronização no Backend

```typescript
// server/trpc/routers/sync.ts
export const syncRouter = router({
  sync: protectedProcedure
    .input(
      z.object({
        actions: z.array(
          z.object({
            id: z.string(),
            type: z.enum(["create", "update", "delete"]),
            entity: z.string(),
            data: z.any(),
            timestamp: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = [];

      for (const action of input.actions) {
        try {
          // Processar cada ação
          switch (action.type) {
            case "create":
              // Inserir no banco
              break;
            case "update":
              // Atualizar no banco
              break;
            case "delete":
              // Deletar do banco
              break;
          }

          results.push({ id: action.id, success: true });
        } catch (error) {
          results.push({ id: action.id, success: false, error });
        }
      }

      return { results };
    }),
});
```

---

## 7. Testes

### 7.1. Testar Modo Offline

```typescript
// __tests__/offline.test.ts
import { storage } from "@/lib/storage";
import { syncManager } from "@/lib/sync-manager";

describe("Modo Offline", () => {
  it("deve salvar dados localmente", async () => {
    const animal = { id: 1, identificacao: "001", raca: "Nelore" };
    await storage.save("animais", animal);

    const animais = await storage.get("animais");
    expect(animais).toContainEqual(animal);
  });

  it("deve adicionar à fila de sincronização", async () => {
    const animal = { id: 2, identificacao: "002", raca: "Angus" };

    await syncManager.addToQueue({
      type: "create",
      entity: "animal",
      data: animal,
    });

    expect(syncManager.getPendingCount()).toBeGreaterThan(0);
  });
});
```

### 7.2. Testar Sincronização

```typescript
describe("Sincronização", () => {
  it("deve sincronizar quando voltar online", async () => {
    // Simular offline
    // Adicionar ações à fila
    // Simular online
    // Verificar se sincronizou
  });
});
```

---

## 8. Deploy

### 8.1. Mobile (iOS/Android)

```bash
# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production
```

### 8.2. Web

```bash
# Build web
npx expo export:web

# Deploy (exemplo: Vercel)
vercel deploy
```

### 8.3. Backend

```bash
# Build backend
pnpm build

# Deploy (exemplo: Railway, Render, AWS)
# Configurar variáveis de ambiente:
# - DATABASE_URL
# - JWT_SECRET
# - PORT
```

---

## 9. Checklist de Implementação

### Fase 1: Fundação (2-4 horas)
- [ ] Implementar IndexedDB para web (`lib/indexed-db.ts`)
- [ ] Criar abstração unificada de storage (`lib/storage.ts`)
- [ ] Testar salvamento/leitura em mobile e web

### Fase 2: Sincronização (4-6 horas)
- [ ] Completar implementação do sync-manager
- [ ] Integrar sync-manager em todas as telas
- [ ] Criar componente de status visual
- [ ] Testar fila de sincronização

### Fase 3: Backend (6-8 horas)
- [ ] Criar endpoints tRPC para todas as entidades
- [ ] Implementar endpoint de sincronização
- [ ] Conectar autenticação com backend
- [ ] Testar APIs

### Fase 4: Integração (4-6 horas)
- [ ] Conectar todas as telas com backend
- [ ] Implementar sincronização automática
- [ ] Adicionar tratamento de erros
- [ ] Testar fluxo completo

### Fase 5: Testes e Deploy (2-4 horas)
- [ ] Escrever testes unitários
- [ ] Testar em dispositivos reais
- [ ] Deploy backend
- [ ] Deploy mobile (TestFlight/Google Play Beta)
- [ ] Deploy web

**Tempo Total Estimado:** 18-28 horas

---

## 10. Suporte

Se precisar de ajuda durante a implementação:

1. **Documentação oficial:**
   - [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
   - [IndexedDB MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
   - [tRPC](https://trpc.io/)
   - [Expo](https://docs.expo.dev/)

2. **Comunidade:**
   - Stack Overflow
   - Discord do Expo
   - GitHub Issues

3. **Contratar desenvolvedor:**
   - Procure por "React Native + Expo developer"
   - Mostre este documento como referência
   - Estimativa: R$ 5.000 - R$ 15.000 para implementação completa

---

**Boa sorte com a implementação! 🚀**
