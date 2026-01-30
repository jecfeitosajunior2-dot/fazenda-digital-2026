import React, { createContext, useContext, ReactNode } from "react";
import { trpc } from "./trpc";
import { useAuth } from "@/hooks/use-auth";

// ============ TYPES ============
export interface Animal {
  id: string;
  identificador: string;
  categoria: "Boi" | "Vaca" | "Bezerro" | "Novilha";
  raca: string;
  peso: number;
  lote: string;
  status: "Saudável" | "Em tratamento" | "Observação";
  foto?: string;
  dataCadastro: string;
  dataUltimaPesagem?: string;
  pesoAnterior?: number;
}

export interface Venda {
  id: string;
  animais: string[];
  quantidadeAnimais: number;
  pesoTotal: number;
  arrobas: number;
  precoArroba: number;
  valorTotal: number;
  comprador?: string;
  data: string;
}

export interface Custo {
  id: string;
  descricao: string;
  valor: number;
  categoria: "Alimentação" | "Veterinário" | "Manutenção" | "Mão de Obra" | "Outros";
  data: string;
}

interface DataContextType {
  // Animais
  animais: Animal[];
  addAnimal: (animal: Omit<Animal, "id" | "dataCadastro">) => Promise<void>;
  updateAnimal: (id: string, animal: Partial<Animal>) => Promise<void>;
  deleteAnimal: (id: string) => Promise<void>;
  
  // Vendas
  vendas: Venda[];
  addVenda: (venda: Omit<Venda, "id">) => Promise<void>;
  deleteVenda: (id: string) => Promise<void>;
  
  // Custos
  custos: Custo[];
  addCusto: (custo: Omit<Custo, "id">) => Promise<void>;
  deleteCusto: (id: string) => Promise<void>;
  
  // Calculadora
  kgParaArroba: (kg: number) => number;
  arrobaParaKg: (arroba: number) => number;
  calcularGMD: (pesoInicial: number, pesoFinal: number, dias: number) => number;
  calcularValorAnimal: (peso: number, precoArroba: number) => number;
  
  // Stats
  totalAnimais: number;
  totalArrobas: number;
  faturamentoTotal: number;
  custosTotal: number;
  lucroTotal: number;
  mediaPeso: number;
  
  // Loading
  loading: boolean;
  refreshData: () => Promise<void>;
  zerarDados: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

/**
 * DataProvider conectado ao backend via tRPC
 * Sincroniza dados entre dispositivos usando PostgreSQL
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Buscar fazenda do usuário
  const { data: fazenda } = trpc.fazenda.getFazenda.useQuery(undefined, {
    enabled: !!user,
  });

  // Buscar animais
  const { data: animaisBackend = [], isLoading: loadingAnimais } = trpc.fazenda.getAnimais.useQuery(
    { fazendaId: fazenda?.id || 0 },
    { enabled: !!fazenda }
  );

  // Buscar vendas
  const { data: vendasBackend = [], isLoading: loadingVendas } = trpc.fazenda.getVendas.useQuery(
    { fazendaId: fazenda?.id || 0 },
    { enabled: !!fazenda }
  );

  // Buscar custos
  const { data: custosBackend = [], isLoading: loadingCustos } = trpc.fazenda.getCustos.useQuery(
    { fazendaId: fazenda?.id || 0 },
    { enabled: !!fazenda }
  );

  // Mutations
  const createAnimalMutation = trpc.fazenda.createAnimal.useMutation({
    onSuccess: () => utils.fazenda.getAnimais.invalidate(),
  });

  const updateAnimalMutation = trpc.fazenda.updateAnimal.useMutation({
    onSuccess: () => utils.fazenda.getAnimais.invalidate(),
  });

  const deleteAnimalMutation = trpc.fazenda.deleteAnimal.useMutation({
    onSuccess: () => utils.fazenda.getAnimais.invalidate(),
  });

  const createVendaMutation = trpc.fazenda.createVenda.useMutation({
    onSuccess: () => {
      utils.fazenda.getVendas.invalidate();
      utils.fazenda.getAnimais.invalidate();
    },
  });

  const deleteVendaMutation = trpc.fazenda.deleteVenda.useMutation({
    onSuccess: () => utils.fazenda.getVendas.invalidate(),
  });

  const createCustoMutation = trpc.fazenda.createCusto.useMutation({
    onSuccess: () => utils.fazenda.getCustos.invalidate(),
  });

  const deleteCustoMutation = trpc.fazenda.deleteCusto.useMutation({
    onSuccess: () => utils.fazenda.getCustos.invalidate(),
  });

  // Converter dados do backend para formato do app
  const animais: Animal[] = animaisBackend.map((a: any) => ({
    id: String(a.id),
    identificador: a.identificacao || "",
    categoria: mapSexoToCategoria(a.sexo),
    raca: a.raca || "",
    peso: Number(a.pesoAtual) || 0,
    lote: "", // TODO: adicionar campo lote no backend
    status: "Saudável", // TODO: adicionar campo status no backend
    dataCadastro: a.createdAt ? new Date(a.createdAt).toISOString().split("T")[0] : "",
  }));

  const vendas: Venda[] = vendasBackend.map((v: any) => ({
    id: String(v.id),
    animais: v.animalId ? [String(v.animalId)] : [],
    quantidadeAnimais: v.quantidade || 0,
    pesoTotal: Number(v.pesoTotal) || 0,
    arrobas: Math.round((Number(v.pesoTotal) || 0) / 30),
    precoArroba: Number(v.valorPorKg) ? Number(v.valorPorKg) * 30 : 0,
    valorTotal: Number(v.valorTotal) || 0,
    comprador: v.comprador || "",
    data: v.dataVenda ? new Date(v.dataVenda).toISOString().split("T")[0] : "",
  }));

  const custos: Custo[] = custosBackend.map((c: any) => ({
    id: String(c.id),
    descricao: c.descricao || "",
    valor: Number(c.valor) || 0,
    categoria: mapCategoriaBackendToFrontend(c.categoria),
    data: c.dataCusto ? new Date(c.dataCusto).toISOString().split("T")[0] : "",
  }));

  // Animal operations
  const addAnimal = async (animal: Omit<Animal, "id" | "dataCadastro">) => {
    if (!fazenda) throw new Error("Fazenda não encontrada");
    
    await createAnimalMutation.mutateAsync({
      fazendaId: fazenda.id,
      identificacao: animal.identificador,
      raca: animal.raca,
      sexo: mapCategoriaToSexo(animal.categoria),
      pesoAtual: animal.peso,
      observacoes: "",
    });
  };

  const updateAnimal = async (id: string, updates: Partial<Animal>) => {
    await updateAnimalMutation.mutateAsync({
      id: Number(id),
      identificacao: updates.identificador,
      raca: updates.raca,
      sexo: updates.categoria ? mapCategoriaToSexo(updates.categoria) : undefined,
      pesoAtual: updates.peso,
    });
  };

  const deleteAnimal = async (id: string) => {
    await deleteAnimalMutation.mutateAsync({ id: Number(id) });
  };

  // Venda operations
  const addVenda = async (venda: Omit<Venda, "id">) => {
    if (!fazenda) throw new Error("Fazenda não encontrada");
    
    await createVendaMutation.mutateAsync({
      fazendaId: fazenda.id,
      animalId: venda.animais[0] ? Number(venda.animais[0]) : undefined,
      comprador: venda.comprador || "Cliente",
      quantidade: venda.quantidadeAnimais,
      pesoTotal: venda.pesoTotal,
      valorTotal: venda.valorTotal,
      valorPorKg: venda.precoArroba / 30,
      dataVenda: new Date(venda.data),
    });
  };

  const deleteVenda = async (id: string) => {
    await deleteVendaMutation.mutateAsync({ id: Number(id) });
  };

  // Custo operations
  const addCusto = async (custo: Omit<Custo, "id">) => {
    if (!fazenda) throw new Error("Fazenda não encontrada");
    
    await createCustoMutation.mutateAsync({
      fazendaId: fazenda.id,
      categoria: mapCategoriaFrontendToBackend(custo.categoria),
      descricao: custo.descricao,
      valor: custo.valor,
      dataCusto: new Date(custo.data),
    });
  };

  const deleteCusto = async (id: string) => {
    await deleteCustoMutation.mutateAsync({ id: Number(id) });
  };

  // Calculadora
  const kgParaArroba = (kg: number) => kg / 30;
  const arrobaParaKg = (arroba: number) => arroba * 30;
  const calcularGMD = (pesoInicial: number, pesoFinal: number, dias: number) => {
    if (dias <= 0) return 0;
    return Number(((pesoFinal - pesoInicial) / dias).toFixed(3));
  };
  const calcularValorAnimal = (peso: number, precoArroba: number) => {
    const arrobas = peso / 30;
    return Number((arrobas * precoArroba).toFixed(2));
  };

  // Zerar todos os dados (não implementado - requer endpoint no backend)
  const zerarDados = async () => {
    console.warn("zerarDados não implementado com backend");
  };

  // Stats
  const totalAnimais = animais.length;
  const totalArrobas = Math.round(animais.reduce((acc, a) => acc + (a.peso || 0), 0) / 30);
  const faturamentoTotal = vendas.reduce((acc, v) => acc + (v.valorTotal || 0), 0);
  const custosTotal = custos.reduce((acc, c) => acc + (c.valor || 0), 0);
  const lucroTotal = faturamentoTotal - custosTotal;
  const mediaPeso = animais.length > 0 ? Math.round(animais.reduce((acc, a) => acc + (a.peso || 0), 0) / animais.length) : 0;

  const loading = loadingAnimais || loadingVendas || loadingCustos;

  const refreshData = async () => {
    await Promise.all([
      utils.fazenda.getAnimais.invalidate(),
      utils.fazenda.getVendas.invalidate(),
      utils.fazenda.getCustos.invalidate(),
    ]);
  };

  const value: DataContextType = {
    animais,
    addAnimal,
    updateAnimal,
    deleteAnimal,
    vendas,
    addVenda,
    deleteVenda,
    custos,
    addCusto,
    deleteCusto,
    kgParaArroba,
    arrobaParaKg,
    calcularGMD,
    calcularValorAnimal,
    totalAnimais,
    totalArrobas,
    faturamentoTotal,
    custosTotal,
    lucroTotal,
    mediaPeso,
    loading,
    refreshData,
    zerarDados,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}

// Helper functions para mapear entre frontend e backend
function mapSexoToCategoria(sexo: "macho" | "femea"): Animal["categoria"] {
  return sexo === "macho" ? "Boi" : "Vaca";
}

function mapCategoriaToSexo(categoria: Animal["categoria"]): "macho" | "femea" {
  return categoria === "Boi" || categoria === "Bezerro" ? "macho" : "femea";
}

function mapCategoriaBackendToFrontend(categoria: string): Custo["categoria"] {
  const map: Record<string, Custo["categoria"]> = {
    alimentacao: "Alimentação",
    veterinario: "Veterinário",
    manutencao: "Manutenção",
    mao_de_obra: "Mão de Obra",
    outros: "Outros",
  };
  return map[categoria] || "Outros";
}

function mapCategoriaFrontendToBackend(categoria: Custo["categoria"]): "alimentacao" | "veterinario" | "manutencao" | "mao_de_obra" | "outros" {
  const map: Record<Custo["categoria"], "alimentacao" | "veterinario" | "manutencao" | "mao_de_obra" | "outros"> = {
    "Alimentação": "alimentacao",
    "Veterinário": "veterinario",
    "Manutenção": "manutencao",
    "Mão de Obra": "mao_de_obra",
    "Outros": "outros",
  };
  return map[categoria];
}
