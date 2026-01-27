/**
 * Vision Router - APIs para Visão Computacional
 * 
 * Este módulo implementa as APIs para:
 * 1. Contagem de gado no curral (tempo real)
 * 2. Estimativa de peso por câmera no corredor
 * 
 * @author Fazenda Digital
 * @version 4.0.0
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { 
  cameras, 
  pens, 
  penCounts, 
  weighStations, 
  weightEstimates, 
  calibrations,
  visionLogs 
} from "../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const CameraStatusSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.enum(["online", "offline", "error"]),
  lastSeenAt: z.string().nullable(),
  position: z.string().nullable(),
});

const PenCountSchema = z.object({
  penId: z.number(),
  count: z.number(),
  confidence: z.number(),
  capturedAt: z.string(),
  cameras: z.array(z.object({
    cameraId: z.number(),
    count: z.number(),
    confidence: z.number(),
  })),
});

const WeightEstimateSchema = z.object({
  id: z.number(),
  estimatedKg: z.number(),
  confidence: z.number(),
  capturedAt: z.string(),
  calibrationVersion: z.number(),
  meta: z.any().optional(),
});

// Schema para ingestão de dados do Vision Agent
const VisionIngestSchema = z.object({
  type: z.enum(["count", "weight"]),
  apiKey: z.string(),
  data: z.object({
    // Para contagem
    penId: z.number().optional(),
    cameraId: z.number().optional(),
    count: z.number().optional(),
    confidence: z.number().optional(),
    // Para peso
    stationId: z.number().optional(),
    estimatedKg: z.number().optional(),
    calibrationVersion: z.number().optional(),
    // Comum
    capturedAt: z.string(),
    meta: z.any().optional(),
  }),
});

// ============================================================================
// ROUTER DE VISÃO COMPUTACIONAL
// ============================================================================

export const visionRouter = router({
  // ==========================================================================
  // CÂMERAS
  // ==========================================================================

  /**
   * GET /cameras/status - Retorna status de todas as câmeras
   */
  getCamerasStatus: protectedProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return { success: false, error: "Database não disponível", data: [], timestamp: new Date().toISOString() };
      const allCameras = await db.select().from(cameras).orderBy(cameras.name);
      
      return {
        success: true,
        data: allCameras.map((cam: typeof cameras.$inferSelect) => ({
          id: cam.id,
          name: cam.name,
          status: cam.status,
          lastSeenAt: cam.lastSeenAt?.toISOString() || null,
          position: cam.position,
          type: cam.type,
          penId: cam.penId,
          weighStationId: cam.weighStationId,
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[Vision] Erro ao buscar status das câmeras:", error);
      return {
        success: false,
        error: "Erro ao buscar status das câmeras",
        data: [],
        timestamp: new Date().toISOString(),
      };
    }
  }),

  /**
   * Criar/atualizar câmera
   */
  upsertCamera: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string(),
      rtspUrl: z.string(),
      type: z.enum(["rtsp", "onvif", "rgb", "depth"]),
      position: z.string().optional(),
      penId: z.number().optional(),
      weighStationId: z.number().optional(),
      roiConfig: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database não disponível" };
        
        if (input.id) {
          // Update
          await db.update(cameras)
            .set({
              name: input.name,
              rtspUrl: input.rtspUrl,
              type: input.type,
              position: input.position,
              penId: input.penId,
              weighStationId: input.weighStationId,
              roiConfig: input.roiConfig,
            })
            .where(eq(cameras.id, input.id));
          
          return { success: true, id: input.id, action: "updated" };
        } else {
          // Insert
          const result = await db.insert(cameras).values({
            name: input.name,
            rtspUrl: input.rtspUrl,
            type: input.type,
            position: input.position,
            penId: input.penId,
            weighStationId: input.weighStationId,
            roiConfig: input.roiConfig,
          });
          
          return { success: true, id: result[0].insertId, action: "created" };
        }
      } catch (error) {
        console.error("[Vision] Erro ao salvar câmera:", error);
        return { success: false, error: "Erro ao salvar câmera" };
      }
    }),

  // ==========================================================================
  // CURRAIS (PENS)
  // ==========================================================================

  /**
   * GET /pens - Lista todos os currais
   */
  getPens: protectedProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return { success: false, error: "Database não disponível", data: [] };
      const allPens = await db.select().from(pens).orderBy(pens.name);
      return { success: true, data: allPens };
    } catch (error) {
      console.error("[Vision] Erro ao buscar currais:", error);
      return { success: false, error: "Erro ao buscar currais", data: [] };
    }
  }),

  /**
   * GET /pens/:id/count - Retorna contagem atual do curral
   */
  getPenCount: protectedProcedure
    .input(z.object({ penId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database não disponível" };
        
        // Buscar última contagem agregada
        const latestCount = await db.select()
          .from(penCounts)
          .where(eq(penCounts.penId, input.penId))
          .orderBy(desc(penCounts.capturedAt))
          .limit(1);

        if (latestCount.length === 0) {
          return {
            success: true,
            data: {
              penId: input.penId,
              count: 0,
              confidence: 0,
              capturedAt: null,
              cameras: [],
            },
          };
        }

        // Buscar contagens por câmera (últimos 30 segundos)
        const thirtySecondsAgo = new Date(Date.now() - 30000);
        const cameraCounts = await db.select()
          .from(penCounts)
          .where(
            and(
              eq(penCounts.penId, input.penId),
              gte(penCounts.capturedAt, thirtySecondsAgo)
            )
          )
          .orderBy(desc(penCounts.capturedAt));

        // Agrupar por câmera (pegar mais recente de cada)
        const cameraMap = new Map<number, typeof cameraCounts[0]>();
        for (const count of cameraCounts) {
          if (!cameraMap.has(count.cameraId)) {
            cameraMap.set(count.cameraId, count);
          }
        }

        const latest = latestCount[0];
        return {
          success: true,
          data: {
            penId: input.penId,
            count: latest.aggregatedCount || latest.count,
            confidence: parseFloat(latest.confidence?.toString() || "0"),
            capturedAt: latest.capturedAt.toISOString(),
            cameras: Array.from(cameraMap.values()).map(c => ({
              cameraId: c.cameraId,
              count: c.count,
              confidence: parseFloat(c.confidence?.toString() || "0"),
            })),
          },
        };
      } catch (error) {
        console.error("[Vision] Erro ao buscar contagem do curral:", error);
        return { success: false, error: "Erro ao buscar contagem" };
      }
    }),

  /**
   * GET /pens/:id/count/history - Histórico de contagens
   */
  getPenCountHistory: protectedProcedure
    .input(z.object({
      penId: z.number(),
      range: z.enum(["hour", "day", "week", "month"]).default("day"),
    }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database não disponível" };
        
        // Calcular data de início baseado no range
        const now = new Date();
        let startDate: Date;
        let groupBy: "minute" | "hour" | "day";

        switch (input.range) {
          case "hour":
            startDate = new Date(now.getTime() - 60 * 60 * 1000);
            groupBy = "minute";
            break;
          case "day":
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            groupBy = "hour";
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            groupBy = "day";
            break;
          case "month":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            groupBy = "day";
            break;
        }

        // Buscar contagens no período
        const counts = await db.select()
          .from(penCounts)
          .where(
            and(
              eq(penCounts.penId, input.penId),
              gte(penCounts.capturedAt, startDate)
            )
          )
          .orderBy(penCounts.capturedAt);

        // Agrupar por período
        const grouped = new Map<string, { count: number; samples: number }>();
        
        for (const count of counts) {
          let key: string;
          const date = count.capturedAt;
          
          switch (groupBy) {
            case "minute":
              key = `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
              break;
            case "hour":
              key = `${date.getHours()}:00`;
              break;
            case "day":
              key = `${date.getDate()}/${date.getMonth() + 1}`;
              break;
          }

          const existing = grouped.get(key) || { count: 0, samples: 0 };
          existing.count += count.aggregatedCount || count.count;
          existing.samples += 1;
          grouped.set(key, existing);
        }

        // Calcular médias
        const history = Array.from(grouped.entries()).map(([label, data]) => ({
          label,
          count: Math.round(data.count / data.samples),
          samples: data.samples,
        }));

        return {
          success: true,
          data: {
            penId: input.penId,
            range: input.range,
            groupBy,
            history,
          },
        };
      } catch (error) {
        console.error("[Vision] Erro ao buscar histórico:", error);
        return { success: false, error: "Erro ao buscar histórico" };
      }
    }),

  /**
   * Criar/atualizar curral
   */
  upsertPen: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string(),
      location: z.string().optional(),
      dimensions: z.string().optional(),
      maxCapacity: z.number().optional(),
      aggregationRule: z.enum(["principal", "median", "sum", "max"]).default("median"),
      primaryCameraId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database não disponível" };
        
        if (input.id) {
          await db.update(pens)
            .set({
              name: input.name,
              location: input.location,
              dimensions: input.dimensions,
              maxCapacity: input.maxCapacity,
              aggregationRule: input.aggregationRule,
              primaryCameraId: input.primaryCameraId,
            })
            .where(eq(pens.id, input.id));
          
          return { success: true, id: input.id, action: "updated" };
        } else {
          const result = await db.insert(pens).values({
            name: input.name,
            location: input.location,
            dimensions: input.dimensions,
            maxCapacity: input.maxCapacity,
            aggregationRule: input.aggregationRule,
            primaryCameraId: input.primaryCameraId,
          });
          
          return { success: true, id: result[0].insertId, action: "created" };
        }
      } catch (error) {
        console.error("[Vision] Erro ao salvar curral:", error);
        return { success: false, error: "Erro ao salvar curral" };
      }
    }),

  // ==========================================================================
  // ESTAÇÕES DE PESAGEM
  // ==========================================================================

  /**
   * GET /weigh-stations - Lista todas as estações
   */
  getWeighStations: protectedProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return { success: false, error: "Database não disponível", data: [] };
      const stations = await db.select().from(weighStations).orderBy(weighStations.name);
      return { success: true, data: stations };
    } catch (error) {
      console.error("[Vision] Erro ao buscar estações:", error);
      return { success: false, error: "Erro ao buscar estações", data: [] };
    }
  }),

  /**
   * GET /weigh-stations/:id/latest - Última estimativa de peso
   */
  getWeighStationLatest: protectedProcedure
    .input(z.object({ stationId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database não disponível" };
        
        const latest = await db.select()
          .from(weightEstimates)
          .where(eq(weightEstimates.stationId, input.stationId))
          .orderBy(desc(weightEstimates.capturedAt))
          .limit(1);

        if (latest.length === 0) {
          return {
            success: true,
            data: null,
          };
        }

        const estimate = latest[0];
        return {
          success: true,
          data: {
            id: estimate.id,
            estimatedKg: parseFloat(estimate.estimatedKg.toString()),
            confidence: parseFloat(estimate.confidence.toString()),
            capturedAt: estimate.capturedAt.toISOString(),
            calibrationVersion: estimate.calibrationVersion,
            meta: estimate.metaJson,
          },
        };
      } catch (error) {
        console.error("[Vision] Erro ao buscar última estimativa:", error);
        return { success: false, error: "Erro ao buscar estimativa" };
      }
    }),

  /**
   * GET /weigh-stations/:id/history - Histórico de estimativas
   */
  getWeighStationHistory: protectedProcedure
    .input(z.object({
      stationId: z.number(),
      limit: z.number().default(50),
      range: z.enum(["day", "week", "month"]).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database não disponível", data: [] };
        
        let query = db.select()
          .from(weightEstimates)
          .where(eq(weightEstimates.stationId, input.stationId))
          .orderBy(desc(weightEstimates.capturedAt))
          .limit(input.limit);

        const estimates = await query;

        return {
          success: true,
          data: estimates.map((e: typeof weightEstimates.$inferSelect) => ({
            id: e.id,
            estimatedKg: parseFloat(e.estimatedKg.toString()),
            confidence: parseFloat(e.confidence.toString()),
            capturedAt: e.capturedAt.toISOString(),
            calibrationVersion: e.calibrationVersion,
            animalId: e.animalId,
          })),
        };
      } catch (error) {
        console.error("[Vision] Erro ao buscar histórico de peso:", error);
        return { success: false, error: "Erro ao buscar histórico" };
      }
    }),

  /**
   * POST /weigh-stations/:id/calibrations - Salvar calibração
   */
  saveCalibration: protectedProcedure
    .input(z.object({
      stationId: z.number(),
      params: z.object({
        coefficients: z.array(z.number()),
        modelType: z.enum(["linear", "polynomial", "custom"]),
        polynomialDegree: z.number().optional(),
        metrics: z.object({
          r2: z.number(),
          mae: z.number(),
          rmse: z.number(),
          sampleSize: z.number(),
        }).optional(),
        trainingSamples: z.array(z.object({
          realWeight: z.number(),
          measurements: z.array(z.number()),
        })).optional(),
      }),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database não disponível" };
        
        // Buscar última versão
        const lastCalibration = await db.select()
          .from(calibrations)
          .where(eq(calibrations.stationId, input.stationId))
          .orderBy(desc(calibrations.version))
          .limit(1);

        const newVersion = lastCalibration.length > 0 ? lastCalibration[0].version + 1 : 1;

        // Inserir nova calibração
        const result = await db.insert(calibrations).values({
          stationId: input.stationId,
          version: newVersion,
          paramsJson: input.params,
          notes: input.notes,
          status: "active",
          createdBy: ctx.user?.id,
        });

        // Atualizar estação com nova versão
        await db.update(weighStations)
          .set({ currentCalibrationVersion: newVersion })
          .where(eq(weighStations.id, input.stationId));

        // Arquivar calibrações anteriores
        if (lastCalibration.length > 0) {
          await db.update(calibrations)
            .set({ status: "archived" })
            .where(
              and(
                eq(calibrations.stationId, input.stationId),
                eq(calibrations.status, "active")
              )
            );
        }

        return {
          success: true,
          data: {
            id: result[0].insertId,
            version: newVersion,
          },
        };
      } catch (error) {
        console.error("[Vision] Erro ao salvar calibração:", error);
        return { success: false, error: "Erro ao salvar calibração" };
      }
    }),

  /**
   * Criar/atualizar estação de pesagem
   */
  upsertWeighStation: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string(),
      cameraId: z.number().optional(),
      cameraType: z.enum(["rgb", "depth"]).default("rgb"),
      config: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database não disponível" };
        
        if (input.id) {
          await db.update(weighStations)
            .set({
              name: input.name,
              cameraId: input.cameraId,
              cameraType: input.cameraType,
              config: input.config,
            })
            .where(eq(weighStations.id, input.id));
          
          return { success: true, id: input.id, action: "updated" };
        } else {
          const result = await db.insert(weighStations).values({
            name: input.name,
            cameraId: input.cameraId,
            cameraType: input.cameraType,
            config: input.config,
          });
          
          return { success: true, id: result[0].insertId, action: "created" };
        }
      } catch (error) {
        console.error("[Vision] Erro ao salvar estação:", error);
        return { success: false, error: "Erro ao salvar estação" };
      }
    }),

  // ==========================================================================
  // INGESTÃO DE DADOS (VISION AGENT)
  // ==========================================================================

  /**
   * POST /vision/ingest - Endpoint interno para o Vision Agent enviar dados
   * Autenticado por API Key
   */
  ingest: publicProcedure
    .input(VisionIngestSchema)
    .mutation(async ({ input }) => {
      // Validar API Key
      const validApiKey = process.env.VISION_AGENT_API_KEY || "dev-vision-key";
      if (input.apiKey !== validApiKey) {
        console.error("[Vision] API Key inválida");
        return { success: false, error: "Unauthorized" };
      }

      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database não disponível" };
        
        const { type, data } = input;

        if (type === "count") {
          // Inserir contagem
          if (!data.penId || !data.cameraId || data.count === undefined) {
            return { success: false, error: "Dados incompletos para contagem" };
          }

          // Buscar regra de agregação do curral
          const pen = await db.select()
            .from(pens)
            .where(eq(pens.id, data.penId))
            .limit(1);

          let aggregatedCount = data.count;

          if (pen.length > 0) {
            // Buscar contagens recentes de outras câmeras
            const recentCounts = await db.select()
              .from(penCounts)
              .where(
                and(
                  eq(penCounts.penId, data.penId),
                  gte(penCounts.capturedAt, new Date(Date.now() - 10000)) // últimos 10s
                )
              );

            const counts = [...recentCounts.map((c: typeof penCounts.$inferSelect) => c.count), data.count];
            
            switch (pen[0].aggregationRule) {
              case "median":
                counts.sort((a, b) => a - b);
                aggregatedCount = counts[Math.floor(counts.length / 2)];
                break;
              case "sum":
                aggregatedCount = counts.reduce((a, b) => a + b, 0);
                break;
              case "max":
                aggregatedCount = Math.max(...counts);
                break;
              case "principal":
                if (pen[0].primaryCameraId === data.cameraId) {
                  aggregatedCount = data.count;
                }
                break;
            }
          }

          await db.insert(penCounts).values({
            penId: data.penId,
            cameraId: data.cameraId,
            count: data.count,
            aggregatedCount,
            confidence: data.confidence?.toString() || "0.9",
            capturedAt: new Date(data.capturedAt),
            metaJson: data.meta,
          });

          // Atualizar status da câmera
          await db.update(cameras)
            .set({ status: "online", lastSeenAt: new Date() })
            .where(eq(cameras.id, data.cameraId));

          console.log(`[Vision] Contagem recebida: Curral ${data.penId}, Câmera ${data.cameraId}, Count ${data.count}, Agregado ${aggregatedCount}`);
          
          return { success: true, aggregatedCount };

        } else if (type === "weight") {
          // Inserir estimativa de peso
          if (!data.stationId || data.estimatedKg === undefined || data.calibrationVersion === undefined) {
            return { success: false, error: "Dados incompletos para peso" };
          }

          await db.insert(weightEstimates).values({
            stationId: data.stationId,
            estimatedKg: data.estimatedKg.toString(),
            confidence: (data.confidence || 0.8).toString(),
            capturedAt: new Date(data.capturedAt),
            calibrationVersion: data.calibrationVersion,
            metaJson: data.meta,
          });

          console.log(`[Vision] Peso estimado: Estação ${data.stationId}, ${data.estimatedKg}kg, Confiança ${data.confidence}`);
          
          return { success: true };
        }

        return { success: false, error: "Tipo de dados desconhecido" };
      } catch (error) {
        console.error("[Vision] Erro ao processar ingestão:", error);
        return { success: false, error: "Erro interno" };
      }
    }),

  // ==========================================================================
  // LOGS E DIAGNÓSTICO
  // ==========================================================================

  /**
   * Buscar logs recentes
   */
  getLogs: protectedProcedure
    .input(z.object({
      limit: z.number().default(100),
      severity: z.enum(["debug", "info", "warning", "error", "critical"]).optional(),
      cameraId: z.number().optional(),
      penId: z.number().optional(),
      stationId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      try {
        let conditions = [];
        
        if (input.severity) {
          conditions.push(eq(visionLogs.severity, input.severity));
        }
        if (input.cameraId) {
          conditions.push(eq(visionLogs.cameraId, input.cameraId));
        }
        if (input.penId) {
          conditions.push(eq(visionLogs.penId, input.penId));
        }
        if (input.stationId) {
          conditions.push(eq(visionLogs.stationId, input.stationId));
        }

        const db = await getDb();
        if (!db) return { success: false, error: "Database não disponível", data: [] };
        
        const logs = await db.select()
          .from(visionLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(visionLogs.createdAt))
          .limit(input.limit);

        return { success: true, data: logs };
      } catch (error) {
        console.error("[Vision] Erro ao buscar logs:", error);
        return { success: false, error: "Erro ao buscar logs", data: [] };
      }
    }),
});

export type VisionRouter = typeof visionRouter;
