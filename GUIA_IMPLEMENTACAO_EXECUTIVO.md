# Guia de Implementação Executivo
## Fazenda Digital - Modo Offline + Dashboard Admin

**Versão:** 5.1  
**Data:** Janeiro 2026  
**Estimativa Total:** 40-60 horas de desenvolvimento  
**Custo Estimado:** R$ 8.000 - R$ 20.000 (desenvolvedor React Native sênior)

---

## 📋 Sumário Executivo

Este documento contém **tudo** que um desenvolvedor precisa para implementar:

1. **Modo Offline Completo** (mobile + web)
2. **Sistema de Gestão Empresarial** (dashboard admin)
3. **Sistema Freemium** (planos e pagamentos)

**O que já está pronto:**
- ✅ Interface completa do app (todas as telas)
- ✅ Backend estruturado (Express + tRPC + PostgreSQL)
- ✅ Sistema de sincronização (`lib/sync-manager.ts`)
- ✅ Storage unificado (`lib/storage.ts`)
- ✅ Autenticação (Manus OAuth)

**O que falta implementar:**
- 🔧 Tabelas de dados principais (animais, vendas, custos)
- 🔧 Endpoints tRPC para CRUD
- 🔧 Integração das telas com backend
- 🔧 Dashboard admin
- 🔧 Sistema freemium

---

## 🎯 Parte 1: Modo Offline Completo

### Estimativa: 20-30 horas

---

### 1.1. Criar Tabelas no Banco de Dados

**Arquivo:** `drizzle/schema.ts`

**Adicionar no final do arquivo:**

```typescript
// ============================================================================
// GESTÃO DE REBANHO - TABELAS PRINCIPAIS
// ============================================================================

/**
 * Tabela de fazendas - Cada usuário pode ter múltiplas fazendas
 */
export const fazendas = mysqlTable("fazendas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Dono da fazenda
  nome: varchar("nome", { length: 200 }).notNull(),
  localizacao: varchar("localizacao", { length: 300 }),
  area: decimal("area", { precision: 10, scale: 2 }), // Área em hectares
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Fazenda = typeof fazendas.$inferSelect;
export type InsertFazenda = typeof fazendas.$inferInsert;

/**
 * Tabela de animais - Rebanho
 */
export const animais = mysqlTable("animais", {
  id: int("id").autoincrement().primaryKey(),
  fazendaId: int("fazendaId").notNull(),
  identificacao: varchar("identificacao", { length: 50 }).notNull(), // Brinco/chip
  raca: varchar("raca", { length: 100 }),
  sexo: mysqlEnum("sexo", ["macho", "femea"]).notNull(),
  dataNascimento: timestamp("dataNascimento"),
  pesoAtual: decimal("pesoAtual", { precision: 8, scale: 2 }), // kg
  status: mysqlEnum("status", ["ativo", "vendido", "morto"]).default("ativo").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Animal = typeof animais.$inferSelect;
export type InsertAnimal = typeof animais.$inferInsert;

/**
 * Tabela de vendas
 */
export const vendas = mysqlTable("vendas", {
  id: int("id").autoincrement().primaryKey(),
  fazendaId: int("fazendaId").notNull(),
  animalId: int("animalId"), // Pode ser null se for venda em lote
  comprador: varchar("comprador", { length: 200 }).notNull(),
  quantidade: int("quantidade").notNull(), // Número de animais
  pesoTotal: decimal("pesoTotal", { precision: 10, scale: 2 }), // kg
  valorTotal: decimal("valorTotal", { precision: 12, scale: 2 }).notNull(), // R$
  valorPorKg: decimal("valorPorKg", { precision: 8, scale: 2 }), // R$/kg
  dataVenda: timestamp("dataVenda").notNull(),
  formaPagamento: varchar("formaPagamento", { length: 50 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Venda = typeof vendas.$inferSelect;
export type InsertVenda = typeof vendas.$inferInsert;

/**
 * Tabela de custos
 */
export const custos = mysqlTable("custos", {
  id: int("id").autoincrement().primaryKey(),
  fazendaId: int("fazendaId").notNull(),
  categoria: mysqlEnum("categoria", [
    "alimentacao",
    "veterinario",
    "manutencao",
    "mao_de_obra",
    "outros"
  ]).notNull(),
  descricao: varchar("descricao", { length: 300 }).notNull(),
  valor: decimal("valor", { precision: 12, scale: 2 }).notNull(), // R$
  dataCusto: timestamp("dataCusto").notNull(),
  fornecedor: varchar("fornecedor", { length: 200 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Custo = typeof custos.$inferSelect;
export type InsertCusto = typeof custos.$inferInsert;

// ============================================================================
// SISTEMA FREEMIUM - TABELAS
// ============================================================================

/**
 * Tabela de planos
 */
export const planos = mysqlTable("planos", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(), // "Gratuito", "Premium", "Enterprise"
  descricao: text("descricao"),
  precoMensal: decimal("precoMensal", { precision: 10, scale: 2 }).notNull(),
  precoAnual: decimal("precoAnual", { precision: 10, scale: 2 }),
  limiteAnimais: int("limiteAnimais"), // null = ilimitado
  limiteVendas: int("limiteVendas"), // null = ilimitado
  features: json("features").$type<string[]>().notNull(), // ["peso_ia", "curral_ia", "relatorios"]
  ativo: mysqlEnum("ativo", ["sim", "nao"]).default("sim").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Plano = typeof planos.$inferSelect;
export type InsertPlano = typeof planos.$inferInsert;

/**
 * Tabela de assinaturas
 */
export const assinaturas = mysqlTable("assinaturas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planoId: int("planoId").notNull(),
  status: mysqlEnum("status", ["ativa", "cancelada", "expirada", "trial"]).default("trial").notNull(),
  dataInicio: timestamp("dataInicio").notNull(),
  dataFim: timestamp("dataFim"),
  renovacaoAutomatica: mysqlEnum("renovacaoAutomatica", ["sim", "nao"]).default("sim").notNull(),
  metodoPagamento: varchar("metodoPagamento", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assinatura = typeof assinaturas.$inferSelect;
export type InsertAssinatura = typeof assinaturas.$inferInsert;

/**
 * Tabela de pagamentos
 */
export const pagamentos = mysqlTable("pagamentos", {
  id: int("id").autoincrement().primaryKey(),
  assinaturaId: int("assinaturaId").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pendente", "aprovado", "recusado", "estornado"]).default("pendente").notNull(),
  metodoPagamento: varchar("metodoPagamento", { length: 50 }).notNull(),
  transacaoId: varchar("transacaoId", { length: 200 }), // ID do gateway de pagamento
  dataPagamento: timestamp("dataPagamento"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Pagamento = typeof pagamentos.$inferSelect;
export type InsertPagamento = typeof pagamentos.$inferInsert;

/**
 * Tabela de métricas de uso - Para analytics do dashboard admin
 */
export const metricas = mysqlTable("metricas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  evento: varchar("evento", { length: 100 }).notNull(), // "tela_rebanho_aberta", "animal_cadastrado", etc
  dados: json("dados"), // Dados adicionais do evento
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Metrica = typeof metricas.$inferSelect;
export type InsertMetrica = typeof metricas.$inferInsert;
```

**Executar migration:**

```bash
cd /home/ubuntu/fazenda-digital-app
pnpm db:push
```

---

### 1.2. Criar Funções de Banco de Dados

**Arquivo:** `server/db.ts`

**Adicionar no final do arquivo:**

```typescript
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./_core/db";
import {
  fazendas,
  animais,
  vendas,
  custos,
  planos,
  assinaturas,
  pagamentos,
  metricas,
  InsertFazenda,
  InsertAnimal,
  InsertVenda,
  InsertCusto,
  InsertAssinatura,
  InsertPagamento,
  InsertMetrica,
} from "../drizzle/schema";

// ============================================================================
// FAZENDAS
// ============================================================================

export async function getFazendaByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(fazendas).where(eq(fazendas.userId, userId)).limit(1);
  return result[0] || null;
}

export async function createFazenda(data: InsertFazenda) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(fazendas).values(data);
  return result.insertId;
}

// ============================================================================
// ANIMAIS
// ============================================================================

export async function getAnimaisByFazenda(fazendaId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(animais).where(eq(animais.fazendaId, fazendaId)).orderBy(desc(animais.createdAt));
}

export async function createAnimal(data: InsertAnimal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(animais).values(data);
  return result.insertId;
}

export async function updateAnimal(id: number, data: Partial<InsertAnimal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(animais).set(data).where(eq(animais.id, id));
}

export async function deleteAnimal(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(animais).where(eq(animais.id, id));
}

// ============================================================================
// VENDAS
// ============================================================================

export async function getVendasByFazenda(fazendaId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(vendas).where(eq(vendas.fazendaId, fazendaId)).orderBy(desc(vendas.dataVenda));
}

export async function createVenda(data: InsertVenda) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vendas).values(data);
  return result.insertId;
}

export async function updateVenda(id: number, data: Partial<InsertVenda>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(vendas).set(data).where(eq(vendas.id, id));
}

export async function deleteVenda(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(vendas).where(eq(vendas.id, id));
}

// ============================================================================
// CUSTOS
// ============================================================================

export async function getCustosByFazenda(fazendaId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(custos).where(eq(custos.fazendaId, fazendaId)).orderBy(desc(custos.dataCusto));
}

export async function createCusto(data: InsertCusto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(custos).values(data);
  return result.insertId;
}

export async function updateCusto(id: number, data: Partial<InsertCusto>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(custos).set(data).where(eq(custos.id, id));
}

export async function deleteCusto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(custos).where(eq(custos.id, id));
}

// ============================================================================
// ASSINATURAS E PLANOS
// ============================================================================

export async function getAssinaturaAtiva(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(assinaturas)
    .where(and(eq(assinaturas.userId, userId), eq(assinaturas.status, "ativa")))
    .limit(1);

  return result[0] || null;
}

export async function getPlanos() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(planos).where(eq(planos.ativo, "sim"));
}

export async function createAssinatura(data: InsertAssinatura) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(assinaturas).values(data);
  return result.insertId;
}

export async function createPagamento(data: InsertPagamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pagamentos).values(data);
  return result.insertId;
}

// ============================================================================
// MÉTRICAS
// ============================================================================

export async function registrarMetrica(data: InsertMetrica) {
  const db = await getDb();
  if (!db) return;

  await db.insert(metricas).values(data);
}

// ============================================================================
// DASHBOARD ADMIN - QUERIES
// ============================================================================

export async function getTotalUsuarios() {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  return result[0]?.count || 0;
}

export async function getTotalAssinaturasAtivas() {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(assinaturas)
    .where(eq(assinaturas.status, "ativa"));

  return result[0]?.count || 0;
}

export async function getReceitaMensal() {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ total: sql<number>`SUM(valor)` })
    .from(pagamentos)
    .where(
      and(
        eq(pagamentos.status, "aprovado"),
        sql`MONTH(dataPagamento) = MONTH(CURRENT_DATE())`,
        sql`YEAR(dataPagamento) = YEAR(CURRENT_DATE())`
      )
    );

  return result[0]?.total || 0;
}

export async function getUsuariosRecentes(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit);
}

export async function getAssinaturasRecentes(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(assinaturas).orderBy(desc(assinaturas.createdAt)).limit(limit);
}
```

---

### 1.3. Criar Endpoints tRPC

**Arquivo:** `server/routers.ts`

**Substituir o conteúdo por:**

```typescript
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ========================================================================
  // FAZENDAS
  // ========================================================================
  fazendas: router({
    getMinha: protectedProcedure.query(({ ctx }) => {
      return db.getFazendaByUserId(ctx.user.id);
    }),

    criar: protectedProcedure
      .input(
        z.object({
          nome: z.string().min(1).max(200),
          localizacao: z.string().max(300).optional(),
          area: z.number().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        return db.createFazenda({
          userId: ctx.user.id,
          ...input,
        });
      }),
  }),

  // ========================================================================
  // ANIMAIS
  // ========================================================================
  animais: router({
    listar: protectedProcedure.input(z.object({ fazendaId: z.number() })).query(({ input }) => {
      return db.getAnimaisByFazenda(input.fazendaId);
    }),

    criar: protectedProcedure
      .input(
        z.object({
          fazendaId: z.number(),
          identificacao: z.string().min(1).max(50),
          raca: z.string().max(100).optional(),
          sexo: z.enum(["macho", "femea"]),
          dataNascimento: z.date().optional(),
          pesoAtual: z.number().optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        return db.createAnimal(input);
      }),

    atualizar: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          identificacao: z.string().min(1).max(50).optional(),
          raca: z.string().max(100).optional(),
          pesoAtual: z.number().optional(),
          status: z.enum(["ativo", "vendido", "morto"]).optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateAnimal(id, data);
      }),

    deletar: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
      return db.deleteAnimal(input.id);
    }),
  }),

  // ========================================================================
  // VENDAS
  // ========================================================================
  vendas: router({
    listar: protectedProcedure.input(z.object({ fazendaId: z.number() })).query(({ input }) => {
      return db.getVendasByFazenda(input.fazendaId);
    }),

    criar: protectedProcedure
      .input(
        z.object({
          fazendaId: z.number(),
          animalId: z.number().optional(),
          comprador: z.string().min(1).max(200),
          quantidade: z.number().min(1),
          pesoTotal: z.number().optional(),
          valorTotal: z.number().min(0),
          valorPorKg: z.number().optional(),
          dataVenda: z.date(),
          formaPagamento: z.string().max(50).optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        return db.createVenda(input);
      }),

    atualizar: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          comprador: z.string().min(1).max(200).optional(),
          valorTotal: z.number().min(0).optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateVenda(id, data);
      }),

    deletar: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
      return db.deleteVenda(input.id);
    }),
  }),

  // ========================================================================
  // CUSTOS
  // ========================================================================
  custos: router({
    listar: protectedProcedure.input(z.object({ fazendaId: z.number() })).query(({ input }) => {
      return db.getCustosByFazenda(input.fazendaId);
    }),

    criar: protectedProcedure
      .input(
        z.object({
          fazendaId: z.number(),
          categoria: z.enum(["alimentacao", "veterinario", "manutencao", "mao_de_obra", "outros"]),
          descricao: z.string().min(1).max(300),
          valor: z.number().min(0),
          dataCusto: z.date(),
          fornecedor: z.string().max(200).optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        return db.createCusto(input);
      }),

    atualizar: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          descricao: z.string().min(1).max(300).optional(),
          valor: z.number().min(0).optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateCusto(id, data);
      }),

    deletar: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
      return db.deleteCusto(input.id);
    }),
  }),

  // ========================================================================
  // ASSINATURAS E PLANOS
  // ========================================================================
  planos: router({
    listar: publicProcedure.query(() => {
      return db.getPlanos();
    }),
  }),

  assinaturas: router({
    getMinha: protectedProcedure.query(({ ctx }) => {
      return db.getAssinaturaAtiva(ctx.user.id);
    }),

    criar: protectedProcedure
      .input(
        z.object({
          planoId: z.number(),
          metodoPagamento: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const assinaturaId = await db.createAssinatura({
          userId: ctx.user.id,
          planoId: input.planoId,
          status: "trial",
          dataInicio: new Date(),
          renovacaoAutomatica: "sim",
          metodoPagamento: input.metodoPagamento,
        });

        return { assinaturaId };
      }),
  }),

  // ========================================================================
  // SINCRONIZAÇÃO
  // ========================================================================
  sync: router({
    processar: protectedProcedure
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
            switch (action.entity) {
              case "animal":
                if (action.type === "create") {
                  await db.createAnimal(action.data);
                } else if (action.type === "update") {
                  await db.updateAnimal(action.data.id, action.data);
                } else if (action.type === "delete") {
                  await db.deleteAnimal(action.data.id);
                }
                break;

              case "venda":
                if (action.type === "create") {
                  await db.createVenda(action.data);
                } else if (action.type === "update") {
                  await db.updateVenda(action.data.id, action.data);
                } else if (action.type === "delete") {
                  await db.deleteVenda(action.data.id);
                }
                break;

              case "custo":
                if (action.type === "create") {
                  await db.createCusto(action.data);
                } else if (action.type === "update") {
                  await db.updateCusto(action.data.id, action.data);
                } else if (action.type === "delete") {
                  await db.deleteCusto(action.data.id);
                }
                break;
            }

            results.push({ id: action.id, success: true });
          } catch (error) {
            results.push({ id: action.id, success: false, error: String(error) });
          }
        }

        return { results };
      }),
  }),

  // ========================================================================
  // DASHBOARD ADMIN
  // ========================================================================
  admin: router({
    metricas: protectedProcedure.query(async ({ ctx }) => {
      // Verificar se é admin
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return {
        totalUsuarios: await db.getTotalUsuarios(),
        assinaturasAtivas: await db.getTotalAssinaturasAtivas(),
        receitaMensal: await db.getReceitaMensal(),
      };
    }),

    usuarios: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return db.getUsuariosRecentes(50);
    }),

    assinaturas: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return db.getAssinaturasRecentes(50);
    }),
  }),
});

export type AppRouter = typeof appRouter;
```

---

### 1.4. Integrar Telas com Backend

**Exemplo: Tela de Rebanho**

**Arquivo:** `app/(tabs)/rebanho.tsx`

**Modificar para usar tRPC:**

```typescript
import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { trpc } from "@/lib/trpc";
import { syncManager } from "@/lib/sync-manager";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { StatusIndicator } from "@/components/status-indicator";

export default function RebanhoScreen() {
  const [fazendaId, setFazendaId] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState(syncManager.getStatus());

  // Buscar fazenda do usuário
  const { data: fazenda } = trpc.fazendas.getMinha.useQuery();

  // Buscar animais (online)
  const { data: animaisOnline, isLoading, refetch } = trpc.animais.listar.useQuery(
    { fazendaId: fazendaId! },
    { enabled: !!fazendaId && syncStatus === "online" }
  );

  // Buscar animais (offline)
  const [animaisOffline, setAnimaisOffline] = useState([]);

  useEffect(() => {
    if (fazenda) {
      setFazendaId(fazenda.id);
    }
  }, [fazenda]);

  useEffect(() => {
    // Escutar mudanças de status
    const unsubscribe = syncManager.onStatusChange(setSyncStatus);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Carregar dados offline
    if (syncStatus === "offline") {
      carregarAnimaisOffline();
    }
  }, [syncStatus]);

  async function carregarAnimaisOffline() {
    const dados = await storage.get(STORAGE_KEYS.ANIMAIS);
    setAnimaisOffline(dados || []);
  }

  const animais = syncStatus === "online" ? animaisOnline : animaisOffline;

  async function adicionarAnimal(animal: any) {
    if (syncStatus === "online") {
      // Salvar no servidor
      await trpc.animais.criar.mutate(animal);
      refetch();
    } else {
      // Salvar localmente
      const novosAnimais = [...animaisOffline, animal];
      setAnimaisOffline(novosAnimais);
      await storage.save(STORAGE_KEYS.ANIMAIS, novosAnimais);

      // Adicionar à fila de sincronização
      await syncManager.addToQueue({
        type: "create",
        entity: "animal",
        data: animal,
      });
    }
  }

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <StatusIndicator status={syncStatus} />

      <FlatList
        data={animais}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1 }}>
            <Text>{item.identificacao}</Text>
            <Text>{item.raca}</Text>
          </View>
        )}
      />

      <TouchableOpacity onPress={() => adicionarAnimal({ identificacao: "001", raca: "Nelore" })}>
        <Text>Adicionar Animal</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**Repetir para:**
- `app/(tabs)/vendas.tsx`
- `app/(tabs)/custos.tsx`
- Outras telas que modificam dados

---

## 🎯 Parte 2: Dashboard Admin

### Estimativa: 20-30 horas

---

### 2.1. Criar Rota Admin

**Arquivo:** `app/admin/_layout.tsx`

```typescript
import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Dashboard Admin" }} />
      <Stack.Screen name="usuarios" options={{ title: "Usuários" }} />
      <Stack.Screen name="assinaturas" options={{ title: "Assinaturas" }} />
    </Stack>
  );
}
```

---

### 2.2. Dashboard Principal

**Arquivo:** `app/admin/index.tsx`

```typescript
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { trpc } from "@/lib/trpc";
import { Link } from "expo-router";

export default function AdminDashboard() {
  const { data: metricas, isLoading } = trpc.admin.metricas.useQuery();

  if (isLoading) {
    return <Text>Carregando...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard Administrativo</Text>

      {/* Cards de Métricas */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metricas?.totalUsuarios || 0}</Text>
          <Text style={styles.metricLabel}>Total de Usuários</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metricas?.assinaturasAtivas || 0}</Text>
          <Text style={styles.metricLabel}>Assinaturas Ativas</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            R$ {metricas?.receitaMensal?.toFixed(2) || "0.00"}
          </Text>
          <Text style={styles.metricLabel}>Receita Mensal</Text>
        </View>
      </View>

      {/* Links de Navegação */}
      <View style={styles.linksContainer}>
        <Link href="/admin/usuarios" style={styles.link}>
          <Text>Ver Usuários</Text>
        </Link>

        <Link href="/admin/assinaturas" style={styles.link}>
          <Text>Ver Assinaturas</Text>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0a7ea4",
  },
  metricLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  linksContainer: {
    gap: 12,
  },
  link: {
    backgroundColor: "#0a7ea4",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
});
```

---

### 2.3. Tela de Usuários

**Arquivo:** `app/admin/usuarios.tsx`

```typescript
import { View, Text, FlatList, StyleSheet } from "react-native";
import { trpc } from "@/lib/trpc";

export default function UsuariosScreen() {
  const { data: usuarios, isLoading } = trpc.admin.usuarios.useQuery();

  if (isLoading) {
    return <Text>Carregando...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Usuários Cadastrados</Text>

      <FlatList
        data={usuarios}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <Text style={styles.userName}>{item.name || "Sem nome"}</Text>
            <Text style={styles.userEmail}>{item.email || "Sem email"}</Text>
            <Text style={styles.userDate}>
              Cadastrado em: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  userCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  userDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
});
```

---

## 📊 Checklist de Implementação

### Fase 1: Backend (8-12 horas)
- [ ] Adicionar tabelas ao schema.ts
- [ ] Executar `pnpm db:push`
- [ ] Criar funções em db.ts
- [ ] Criar endpoints em routers.ts
- [ ] Testar endpoints com Postman/Insomnia

### Fase 2: Integração Mobile (8-12 horas)
- [ ] Modificar tela de Rebanho
- [ ] Modificar tela de Vendas
- [ ] Modificar tela de Custos
- [ ] Adicionar StatusIndicator em todas as telas
- [ ] Testar fluxo offline → online

### Fase 3: Dashboard Admin (8-12 horas)
- [ ] Criar rota /admin
- [ ] Criar dashboard principal
- [ ] Criar tela de usuários
- [ ] Criar tela de assinaturas
- [ ] Adicionar gráficos (opcional)

### Fase 4: Sistema Freemium (8-12 horas)
- [ ] Criar tela de planos
- [ ] Implementar bloqueio de features
- [ ] Integrar com gateway de pagamento
- [ ] Testar fluxo de upgrade

### Fase 5: Testes (4-8 horas)
- [ ] Testar offline/online
- [ ] Testar sincronização
- [ ] Testar dashboard admin
- [ ] Testar em dispositivos reais

---

## 💰 Orçamento Estimado

| Item | Horas | Valor/Hora | Total |
|------|-------|------------|-------|
| Backend | 8-12h | R$ 150-250 | R$ 1.200 - R$ 3.000 |
| Integração Mobile | 8-12h | R$ 150-250 | R$ 1.200 - R$ 3.000 |
| Dashboard Admin | 8-12h | R$ 150-250 | R$ 1.200 - R$ 3.000 |
| Sistema Freemium | 8-12h | R$ 150-250 | R$ 1.200 - R$ 3.000 |
| Testes | 4-8h | R$ 150-250 | R$ 600 - R$ 2.000 |
| **TOTAL** | **40-60h** | - | **R$ 6.000 - R$ 14.000** |

**Margem de segurança:** +30% = **R$ 8.000 - R$ 20.000**

---

## 🎯 Próximos Passos

1. **Contratar desenvolvedor React Native sênior**
   - Mostrar este documento
   - Pedir orçamento baseado nas horas estimadas
   - Solicitar cronograma de entrega

2. **Ou implementar você mesmo**
   - Seguir o checklist passo a passo
   - Testar cada fase antes de avançar
   - Voltar aqui se precisar de ajuda

3. **Validar com usuários**
   - Testar app offline em fazendas reais
   - Coletar feedback
   - Ajustar conforme necessário

---

**Boa sorte com a implementação! 🚀**
