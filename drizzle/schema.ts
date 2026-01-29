import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// VISÃO COMPUTACIONAL - TABELAS
// ============================================================================

/**
 * Tabela de câmeras - Armazena informações das câmeras RTSP/ONVIF
 */
export const cameras = mysqlTable("cameras", {
  id: int("id").autoincrement().primaryKey(),
  /** Nome identificador da câmera (ex: "Câmera Curral NE") */
  name: varchar("name", { length: 100 }).notNull(),
  /** URL do stream RTSP */
  rtspUrl: varchar("rtspUrl", { length: 500 }).notNull(),
  /** Tipo de câmera: rtsp, onvif, rgb, depth */
  type: mysqlEnum("type", ["rtsp", "onvif", "rgb", "depth"]).default("rtsp").notNull(),
  /** Status atual da câmera */
  status: mysqlEnum("status", ["online", "offline", "error"]).default("offline").notNull(),
  /** Última vez que a câmera foi vista online */
  lastSeenAt: timestamp("lastSeenAt"),
  /** Configuração de ROI (Region of Interest) em JSON */
  roiConfig: json("roiConfig").$type<{
    enabled: boolean;
    points: { x: number; y: number }[];
    excludeZones?: { x: number; y: number }[][];
  }>(),
  /** Posição da câmera no curral (ex: NE, NW, SE, SW) */
  position: varchar("position", { length: 20 }),
  /** ID do curral associado (se aplicável) */
  penId: int("penId"),
  /** ID da estação de pesagem associada (se aplicável) */
  weighStationId: int("weighStationId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Camera = typeof cameras.$inferSelect;
export type InsertCamera = typeof cameras.$inferInsert;

/**
 * Tabela de currais/pens - Áreas de confinamento
 */
export const pens = mysqlTable("pens", {
  id: int("id").autoincrement().primaryKey(),
  /** Nome do curral (ex: "Curral Principal", "Curral 2") */
  name: varchar("name", { length: 100 }).notNull(),
  /** Localização/descrição */
  location: varchar("location", { length: 200 }),
  /** Dimensões do curral em metros (largura x comprimento) */
  dimensions: varchar("dimensions", { length: 50 }),
  /** Capacidade máxima estimada */
  maxCapacity: int("maxCapacity"),
  /** Regra de agregação para múltiplas câmeras: principal, mediana, soma, max */
  aggregationRule: mysqlEnum("aggregationRule", ["principal", "median", "sum", "max"]).default("median").notNull(),
  /** ID da câmera principal (se aggregationRule = 'principal') */
  primaryCameraId: int("primaryCameraId"),
  /** Status do curral */
  status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pen = typeof pens.$inferSelect;
export type InsertPen = typeof pens.$inferInsert;

/**
 * Tabela de contagens do curral - Histórico de contagens por câmera
 */
export const penCounts = mysqlTable("pen_counts", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do curral */
  penId: int("penId").notNull(),
  /** ID da câmera que fez a contagem */
  cameraId: int("cameraId").notNull(),
  /** Quantidade de animais detectados */
  count: int("count").notNull(),
  /** Contagem agregada (resultado após aplicar regra de agregação) */
  aggregatedCount: int("aggregatedCount"),
  /** Confiança da detecção (0.0 a 1.0) */
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  /** Timestamp da captura */
  capturedAt: timestamp("capturedAt").notNull(),
  /** Metadados adicionais (detecções individuais, bounding boxes, etc) */
  metaJson: json("metaJson").$type<{
    detections?: { id: string; bbox: number[]; confidence: number }[];
    frameId?: string;
    processingTimeMs?: number;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PenCount = typeof penCounts.$inferSelect;
export type InsertPenCount = typeof penCounts.$inferInsert;

/**
 * Tabela de estações de pesagem - Corredores com câmeras para estimativa de peso
 */
export const weighStations = mysqlTable("weigh_stations", {
  id: int("id").autoincrement().primaryKey(),
  /** Nome da estação (ex: "Corredor de Pesagem 1") */
  name: varchar("name", { length: 100 }).notNull(),
  /** ID da câmera principal */
  cameraId: int("cameraId"),
  /** Tipo de câmera: rgb, depth (RealSense/OAK-D) */
  cameraType: mysqlEnum("cameraType", ["rgb", "depth"]).default("rgb").notNull(),
  /** Configuração da estação em JSON */
  config: json("config").$type<{
    corridorWidth: number; // largura do corredor em metros
    corridorLength: number; // comprimento do corredor em metros
    cameraHeight: number; // altura da câmera em metros
    triggerZone: { x1: number; y1: number; x2: number; y2: number }; // zona de trigger
    scaleReference?: { pixelsPerMeter: number }; // referência de escala para RGB
  }>(),
  /** Versão atual da calibração */
  currentCalibrationVersion: int("currentCalibrationVersion"),
  /** Status da estação */
  status: mysqlEnum("status", ["active", "inactive", "calibrating"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeighStation = typeof weighStations.$inferSelect;
export type InsertWeighStation = typeof weighStations.$inferInsert;

/**
 * Tabela de estimativas de peso - Histórico de passagens no corredor
 */
export const weightEstimates = mysqlTable("weight_estimates", {
  id: int("id").autoincrement().primaryKey(),
  /** ID da estação de pesagem */
  stationId: int("stationId").notNull(),
  /** Peso estimado em kg */
  estimatedKg: decimal("estimatedKg", { precision: 8, scale: 2 }).notNull(),
  /** Confiança da estimativa (0.0 a 1.0) */
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(),
  /** Timestamp da captura */
  capturedAt: timestamp("capturedAt").notNull(),
  /** Versão da calibração usada */
  calibrationVersion: int("calibrationVersion").notNull(),
  /** Metadados adicionais */
  metaJson: json("metaJson").$type<{
    animalId?: string; // ID do animal se identificado
    dimensions?: { length: number; height: number; width: number }; // dimensões estimadas
    frameIds?: string[]; // IDs dos frames usados
    processingTimeMs?: number;
    cameraType?: "rgb" | "depth";
    rawMeasurements?: { [key: string]: number };
  }>(),
  /** ID do animal associado (se identificado) */
  animalId: int("animalId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeightEstimate = typeof weightEstimates.$inferSelect;
export type InsertWeightEstimate = typeof weightEstimates.$inferInsert;

/**
 * Tabela de calibrações - Parâmetros de calibração para estimativa de peso
 */
export const calibrations = mysqlTable("calibrations", {
  id: int("id").autoincrement().primaryKey(),
  /** ID da estação de pesagem */
  stationId: int("stationId").notNull(),
  /** Versão da calibração */
  version: int("version").notNull(),
  /** Parâmetros da calibração em JSON */
  paramsJson: json("paramsJson").$type<{
    // Coeficientes de regressão linear/polinomial
    coefficients: number[];
    // Tipo de modelo: linear, polynomial, custom
    modelType: "linear" | "polynomial" | "custom";
    // Grau do polinômio (se polynomial)
    polynomialDegree?: number;
    // Métricas de validação
    metrics?: {
      r2: number; // R-squared
      mae: number; // Mean Absolute Error
      rmse: number; // Root Mean Square Error
      sampleSize: number; // Número de amostras usadas
    };
    // Amostras de treinamento (peso real vs medições)
    trainingSamples?: { realWeight: number; measurements: number[] }[];
  }>().notNull(),
  /** Notas sobre a calibração */
  notes: text("notes"),
  /** Status da calibração */
  status: mysqlEnum("status", ["active", "archived", "testing"]).default("active").notNull(),
  /** Usuário que criou a calibração */
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Calibration = typeof calibrations.$inferSelect;
export type InsertCalibration = typeof calibrations.$inferInsert;

/**
 * Tabela de logs do Vision Agent - Para auditoria e debugging
 */
export const visionLogs = mysqlTable("vision_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** Tipo de evento */
  eventType: mysqlEnum("eventType", [
    "camera_connect",
    "camera_disconnect",
    "count_update",
    "weight_estimate",
    "calibration_update",
    "error",
    "warning",
    "info"
  ]).notNull(),
  /** ID da câmera relacionada */
  cameraId: int("cameraId"),
  /** ID do curral relacionado */
  penId: int("penId"),
  /** ID da estação relacionada */
  stationId: int("stationId"),
  /** Mensagem do log */
  message: text("message").notNull(),
  /** Dados adicionais em JSON */
  dataJson: json("dataJson"),
  /** Nível de severidade */
  severity: mysqlEnum("severity", ["debug", "info", "warning", "error", "critical"]).default("info").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VisionLog = typeof visionLogs.$inferSelect;
export type InsertVisionLog = typeof visionLogs.$inferInsert;

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
