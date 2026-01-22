import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Platform, Alert } from "react-native";

// Tipos
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string; // CPF ou CNPJ
  tipoDocumento: "CPF" | "CNPJ";
  dataCadastro: string;
  biometriaAtivada: boolean;
}

export interface Fazenda {
  id: string;
  nome: string;
  localizacao: string;
  cidade: string;
  estado: string;
  tamanhoHectares: number;
  tipoProducao: string;
  usuarioId: string;
}

interface AuthState {
  usuario: Usuario | null;
  fazenda: Fazenda | null;
  isAuthenticated: boolean;
  isFirstAccess: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  cadastrar: (usuario: Omit<Usuario, "id" | "dataCadastro" | "biometriaAtivada">, fazenda: Omit<Fazenda, "id" | "usuarioId">) => Promise<boolean>;
  login: (email: string, senha: string) => Promise<boolean>;
  loginBiometrico: () => Promise<boolean>;
  logout: () => Promise<void>;
  ativarBiometria: () => Promise<boolean>;
  atualizarUsuario: (dados: Partial<Usuario>) => Promise<void>;
  atualizarFazenda: (dados: Partial<Fazenda>) => Promise<void>;
  verificarBiometriaDisponivel: () => Promise<boolean>;
}

const STORAGE_KEYS = {
  USUARIO: "@fazenda_digital_usuario",
  FAZENDA: "@fazenda_digital_fazenda",
  SENHA: "@fazenda_digital_senha",
  SESSAO: "@fazenda_digital_sessao",
  PRIMEIRO_ACESSO: "@fazenda_digital_primeiro_acesso",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    usuario: null,
    fazenda: null,
    isAuthenticated: false,
    isFirstAccess: true,
    isLoading: true,
  });

  // Carregar dados salvos ao iniciar
  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [usuarioData, fazendaData, sessaoData, primeiroAcessoData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USUARIO),
        AsyncStorage.getItem(STORAGE_KEYS.FAZENDA),
        AsyncStorage.getItem(STORAGE_KEYS.SESSAO),
        AsyncStorage.getItem(STORAGE_KEYS.PRIMEIRO_ACESSO),
      ]);

      const usuario = usuarioData ? JSON.parse(usuarioData) : null;
      const fazenda = fazendaData ? JSON.parse(fazendaData) : null;
      const isFirstAccess = primeiroAcessoData !== "false";
      
      // Se tem sessão ativa e biometria ativada, aguarda autenticação biométrica
      const sessaoAtiva = sessaoData === "true";

      setState({
        usuario,
        fazenda,
        isAuthenticated: false, // Sempre começa como não autenticado
        isFirstAccess: !usuario, // É primeiro acesso se não tem usuário
        isLoading: false,
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const cadastrar = async (
    usuarioData: Omit<Usuario, "id" | "dataCadastro" | "biometriaAtivada">,
    fazendaData: Omit<Fazenda, "id" | "usuarioId">
  ): Promise<boolean> => {
    try {
      const usuarioId = Date.now().toString();
      const novoUsuario: Usuario = {
        ...usuarioData,
        id: usuarioId,
        dataCadastro: new Date().toISOString(),
        biometriaAtivada: false,
      };

      const novaFazenda: Fazenda = {
        ...fazendaData,
        id: Date.now().toString() + "_fazenda",
        usuarioId,
      };

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(novoUsuario)),
        AsyncStorage.setItem(STORAGE_KEYS.FAZENDA, JSON.stringify(novaFazenda)),
        AsyncStorage.setItem(STORAGE_KEYS.PRIMEIRO_ACESSO, "false"),
        AsyncStorage.setItem(STORAGE_KEYS.SESSAO, "true"),
      ]);

      setState({
        usuario: novoUsuario,
        fazenda: novaFazenda,
        isAuthenticated: true,
        isFirstAccess: false,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      return false;
    }
  };

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      const usuarioData = await AsyncStorage.getItem(STORAGE_KEYS.USUARIO);
      if (!usuarioData) {
        Alert.alert("Erro", "Usuário não encontrado. Faça o cadastro primeiro.");
        return false;
      }

      const usuario: Usuario = JSON.parse(usuarioData);
      
      // Verifica se o email corresponde
      if (usuario.email.toLowerCase() !== email.toLowerCase()) {
        Alert.alert("Erro", "Email não encontrado.");
        return false;
      }

      // Em produção, verificaria a senha com hash
      // Por simplicidade, aceita qualquer senha para o usuário cadastrado
      
      const fazendaData = await AsyncStorage.getItem(STORAGE_KEYS.FAZENDA);
      const fazenda = fazendaData ? JSON.parse(fazendaData) : null;

      await AsyncStorage.setItem(STORAGE_KEYS.SESSAO, "true");

      setState({
        usuario,
        fazenda,
        isAuthenticated: true,
        isFirstAccess: false,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error("Erro no login:", error);
      return false;
    }
  };

  const verificarBiometriaDisponivel = async (): Promise<boolean> => {
    if (Platform.OS === "web") return false;
    
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch {
      return false;
    }
  };

  const loginBiometrico = async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      // No web, simula sucesso se tem usuário cadastrado
      const usuarioData = await AsyncStorage.getItem(STORAGE_KEYS.USUARIO);
      if (usuarioData) {
        const usuario = JSON.parse(usuarioData);
        const fazendaData = await AsyncStorage.getItem(STORAGE_KEYS.FAZENDA);
        const fazenda = fazendaData ? JSON.parse(fazendaData) : null;
        
        setState({
          usuario,
          fazenda,
          isAuthenticated: true,
          isFirstAccess: false,
          isLoading: false,
        });
        return true;
      }
      return false;
    }

    try {
      const biometriaDisponivel = await verificarBiometriaDisponivel();
      if (!biometriaDisponivel) {
        Alert.alert("Aviso", "Biometria não disponível neste dispositivo.");
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Autentique-se para acessar o Fazenda Digital",
        fallbackLabel: "Usar senha",
        cancelLabel: "Cancelar",
        disableDeviceFallback: false,
      });

      if (result.success) {
        const usuarioData = await AsyncStorage.getItem(STORAGE_KEYS.USUARIO);
        const fazendaData = await AsyncStorage.getItem(STORAGE_KEYS.FAZENDA);
        
        if (usuarioData) {
          const usuario = JSON.parse(usuarioData);
          const fazenda = fazendaData ? JSON.parse(fazendaData) : null;

          await AsyncStorage.setItem(STORAGE_KEYS.SESSAO, "true");

          setState({
            usuario,
            fazenda,
            isAuthenticated: true,
            isFirstAccess: false,
            isLoading: false,
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Erro na autenticação biométrica:", error);
      return false;
    }
  };

  const ativarBiometria = async (): Promise<boolean> => {
    if (!state.usuario) return false;

    try {
      const biometriaDisponivel = await verificarBiometriaDisponivel();
      if (!biometriaDisponivel) {
        Alert.alert("Aviso", "Biometria não disponível neste dispositivo.");
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirme sua identidade para ativar a biometria",
        fallbackLabel: "Usar senha",
      });

      if (result.success) {
        const usuarioAtualizado = { ...state.usuario, biometriaAtivada: true };
        await AsyncStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(usuarioAtualizado));
        
        setState((prev) => ({
          ...prev,
          usuario: usuarioAtualizado,
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao ativar biometria:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSAO, "false");
      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
      }));
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  const atualizarUsuario = async (dados: Partial<Usuario>): Promise<void> => {
    if (!state.usuario) return;

    try {
      const usuarioAtualizado = { ...state.usuario, ...dados };
      await AsyncStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(usuarioAtualizado));
      setState((prev) => ({ ...prev, usuario: usuarioAtualizado }));
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
    }
  };

  const atualizarFazenda = async (dados: Partial<Fazenda>): Promise<void> => {
    if (!state.fazenda) return;

    try {
      const fazendaAtualizada = { ...state.fazenda, ...dados };
      await AsyncStorage.setItem(STORAGE_KEYS.FAZENDA, JSON.stringify(fazendaAtualizada));
      setState((prev) => ({ ...prev, fazenda: fazendaAtualizada }));
    } catch (error) {
      console.error("Erro ao atualizar fazenda:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        cadastrar,
        login,
        loginBiometrico,
        logout,
        ativarBiometria,
        atualizarUsuario,
        atualizarFazenda,
        verificarBiometriaDisponivel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
