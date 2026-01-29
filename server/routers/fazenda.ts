import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

/**
 * Router para gestão de fazendas, animais, vendas e custos
 */
export const fazendaRouter = router({
  // ============================================================================
  // FAZENDA
  // ============================================================================

  getFazenda: publicProcedure.query(async ({ ctx }: { ctx: any }) => {
    if (!ctx.user) throw new Error("Não autenticado");
    return db.getFazendaByUserId(ctx.user.id);
  }),

  createFazenda: publicProcedure
    .input(
      z.object({
        nome: z.string(),
        localizacao: z.string().optional(),
        area: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      if (!ctx.user) throw new Error("Não autenticado");

      const fazendaId = await db.createFazenda({
        userId: ctx.user.id,
        ...input,
      });

      return { fazendaId };
    }),

  // ============================================================================
  // ANIMAIS
  // ============================================================================

  getAnimais: publicProcedure
    .input(z.object({ fazendaId: z.number() }))
    .query(async ({ input }: { input: any }) => {
      return db.getAnimaisByFazenda(input.fazendaId);
    }),

  createAnimal: publicProcedure
    .input(
      z.object({
        fazendaId: z.number(),
        identificacao: z.string(),
        raca: z.string().optional(),
        sexo: z.enum(["macho", "femea"]),
        dataNascimento: z.date().optional(),
        pesoAtual: z.number().optional(),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const animalId = await db.createAnimal(input);
      return { animalId };
    }),

  updateAnimal: publicProcedure
    .input(
      z.object({
        id: z.number(),
        identificacao: z.string().optional(),
        raca: z.string().optional(),
        sexo: z.enum(["macho", "femea"]).optional(),
        dataNascimento: z.date().optional(),
        pesoAtual: z.number().optional(),
        status: z.enum(["ativo", "vendido", "morto"]).optional(),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const { id, ...data } = input;
      await db.updateAnimal(id, data);
      return { success: true };
    }),

  deleteAnimal: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }: { input: any }) => {
      await db.deleteAnimal(input.id);
      return { success: true };
    }),

  // ============================================================================
  // VENDAS
  // ============================================================================

  getVendas: publicProcedure
    .input(z.object({ fazendaId: z.number() }))
    .query(async ({ input }: { input: any }) => {
      return db.getVendasByFazenda(input.fazendaId);
    }),

  createVenda: publicProcedure
    .input(
      z.object({
        fazendaId: z.number(),
        animalId: z.number().optional(),
        comprador: z.string(),
        quantidade: z.number(),
        pesoTotal: z.number().optional(),
        valorTotal: z.number(),
        valorPorKg: z.number().optional(),
        dataVenda: z.date(),
        formaPagamento: z.string().optional(),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const vendaId = await db.createVenda(input);
      return { vendaId };
    }),

  updateVenda: publicProcedure
    .input(
      z.object({
        id: z.number(),
        comprador: z.string().optional(),
        quantidade: z.number().optional(),
        pesoTotal: z.number().optional(),
        valorTotal: z.number().optional(),
        valorPorKg: z.number().optional(),
        dataVenda: z.date().optional(),
        formaPagamento: z.string().optional(),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const { id, ...data } = input;
      await db.updateVenda(id, data);
      return { success: true };
    }),

  deleteVenda: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }: { input: any }) => {
      await db.deleteVenda(input.id);
      return { success: true };
    }),

  // ============================================================================
  // CUSTOS
  // ============================================================================

  getCustos: publicProcedure
    .input(z.object({ fazendaId: z.number() }))
    .query(async ({ input }: { input: any }) => {
      return db.getCustosByFazenda(input.fazendaId);
    }),

  createCusto: publicProcedure
    .input(
      z.object({
        fazendaId: z.number(),
        categoria: z.enum(["alimentacao", "veterinario", "manutencao", "mao_de_obra", "outros"]),
        descricao: z.string(),
        valor: z.number(),
        dataCusto: z.date(),
        fornecedor: z.string().optional(),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const custoId = await db.createCusto(input);
      return { custoId };
    }),

  updateCusto: publicProcedure
    .input(
      z.object({
        id: z.number(),
        categoria: z.enum(["alimentacao", "veterinario", "manutencao", "mao_de_obra", "outros"]).optional(),
        descricao: z.string().optional(),
        valor: z.number().optional(),
        dataCusto: z.date().optional(),
        fornecedor: z.string().optional(),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const { id, ...data } = input;
      await db.updateCusto(id, data);
      return { success: true };
    }),

  deleteCusto: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }: { input: any }) => {
      await db.deleteCusto(input.id);
      return { success: true };
    }),
});
