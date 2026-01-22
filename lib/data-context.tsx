import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Alert } from "react-native";

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

const STORAGE_KEYS = {
  ANIMAIS: "@fazenda_digital_animais",
  VENDAS: "@fazenda_digital_vendas",
  CUSTOS: "@fazenda_digital_custos",
};

// App inicia sem dados de demonstração - pronto para uso real

export function DataProvider({ children }: { children: ReactNode }) {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [custos, setCustos] = useState<Custo[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from AsyncStorage
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [animaisData, vendasData, custosData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ANIMAIS),
        AsyncStorage.getItem(STORAGE_KEYS.VENDAS),
        AsyncStorage.getItem(STORAGE_KEYS.CUSTOS),
      ]);

      // Carregar dados salvos ou iniciar vazio
      setAnimais(animaisData ? JSON.parse(animaisData) : []);
      setVendas(vendasData ? JSON.parse(vendasData) : []);
      setCustos(custosData ? JSON.parse(custosData) : []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save animais
  const saveAnimais = async (newAnimais: Animal[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.ANIMAIS, JSON.stringify(newAnimais));
    setAnimais(newAnimais);
  };

  // Save vendas
  const saveVendas = async (newVendas: Venda[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.VENDAS, JSON.stringify(newVendas));
    setVendas(newVendas);
  };

  // Save custos
  const saveCustos = async (newCustos: Custo[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOS, JSON.stringify(newCustos));
    setCustos(newCustos);
  };

  // Animal operations
  const addAnimal = async (animal: Omit<Animal, "id" | "dataCadastro">) => {
    const newAnimal: Animal = {
      ...animal,
      id: Date.now().toString(),
      dataCadastro: new Date().toISOString().split("T")[0],
    };
    await saveAnimais([...animais, newAnimal]);
  };

  const updateAnimal = async (id: string, updates: Partial<Animal>) => {
    const updated = animais.map((a) => (a.id === id ? { ...a, ...updates } : a));
    await saveAnimais(updated);
  };

  const deleteAnimal = async (id: string) => {
    const filtered = animais.filter((a) => a.id !== id);
    await saveAnimais(filtered);
  };

  // Venda operations
  const addVenda = async (venda: Omit<Venda, "id">) => {
    const newVenda: Venda = {
      ...venda,
      id: Date.now().toString(),
    };
    await saveVendas([...vendas, newVenda]);
    
    // Remover animais vendidos
    const animaisRestantes = animais.filter((a) => !venda.animais.includes(a.id));
    await saveAnimais(animaisRestantes);
  };

  const deleteVenda = async (id: string) => {
    const filtered = vendas.filter((v) => v.id !== id);
    await saveVendas(filtered);
  };

  // Custo operations
  const addCusto = async (custo: Omit<Custo, "id">) => {
    const newCusto: Custo = {
      ...custo,
      id: Date.now().toString(),
    };
    await saveCustos([...custos, newCusto]);
  };

  const deleteCusto = async (id: string) => {
    const filtered = custos.filter((c) => c.id !== id);
    await saveCustos(filtered);
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

  // Zerar todos os dados
  const zerarDados = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ANIMAIS,
        STORAGE_KEYS.VENDAS,
        STORAGE_KEYS.CUSTOS,
      ]);
      setAnimais([]);
      setVendas([]);
      setCustos([]);
    } catch (error) {
      console.error("Erro ao zerar dados:", error);
      Alert.alert("Erro", "Não foi possível zerar os dados.");
    }
  };

  // Stats
  const totalAnimais = animais.length;
  const totalArrobas = Math.round(animais.reduce((acc, a) => acc + (a.peso || 0), 0) / 30);
  const faturamentoTotal = vendas.reduce((acc, v) => acc + (v.valorTotal || 0), 0);
  const custosTotal = custos.reduce((acc, c) => acc + (c.valor || 0), 0);
  const lucroTotal = faturamentoTotal - custosTotal;
  const mediaPeso = animais.length > 0 ? Math.round(animais.reduce((acc, a) => acc + (a.peso || 0), 0) / animais.length) : 0;

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
    refreshData: loadData,
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
