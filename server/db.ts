import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

// ============================================================================
// FAZENDAS
// ============================================================================

import { and, desc, sql } from "drizzle-orm";
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
  return result[0].insertId;
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
  return result[0].insertId;
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
  return result[0].insertId;
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
  return result[0].insertId;
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
  return result[0].insertId;
}

export async function createPagamento(data: InsertPagamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pagamentos).values(data);
  return result[0].insertId;
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
