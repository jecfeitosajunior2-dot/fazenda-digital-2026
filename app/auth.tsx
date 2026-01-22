import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#1B4332",
  primaryLight: "#2D6A4F",
  secondary: "#40916C",
  gold: "#C9A227",
  background: "#F8F9FA",
  white: "#FFFFFF",
  lightGray: "#E9ECEF",
  gray: "#6C757D",
  darkGray: "#495057",
  danger: "#E63946",
  border: "#DEE2E6",
  text: "#212529",
};

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

type AuthMode = "login" | "cadastro" | "biometria";
type CadastroStep = "usuario" | "fazenda";

export default function AuthScreen() {
  const router = useRouter();
  const { 
    usuario, 
    isFirstAccess, 
    cadastrar, 
    login, 
    loginBiometrico,
    verificarBiometriaDisponivel,
    isAuthenticated 
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [cadastroStep, setCadastroStep] = useState<CadastroStep>("usuario");
  const [loading, setLoading] = useState(false);
  const [biometriaDisponivel, setBiometriaDisponivel] = useState(false);

  // Dados do login
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // Dados do cadastro - Usuário
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<"CPF" | "CNPJ">("CPF");

  // Dados do cadastro - Fazenda
  const [nomeFazenda, setNomeFazenda] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("SP");
  const [tamanhoHectares, setTamanhoHectares] = useState("");
  const [tipoProducao, setTipoProducao] = useState("Corte");

  useEffect(() => {
    checkBiometria();
    
    // Se já tem usuário cadastrado, mostra opção de biometria
    if (usuario && !isFirstAccess) {
      setMode("biometria");
    } else if (isFirstAccess || !usuario) {
      setMode("cadastro");
    }
  }, [usuario, isFirstAccess]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)" as any);
    }
  }, [isAuthenticated]);

  const checkBiometria = async () => {
    const disponivel = await verificarBiometriaDisponivel();
    setBiometriaDisponivel(disponivel);
  };

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const formatarDocumento = (value: string, tipo: "CPF" | "CNPJ") => {
    const numbers = value.replace(/\D/g, "");
    if (tipo === "CPF") {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
  };

  const validarCadastroUsuario = () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "Informe seu nome completo.");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Erro", "Informe um email válido.");
      return false;
    }
    if (!telefone.trim() || telefone.replace(/\D/g, "").length < 10) {
      Alert.alert("Erro", "Informe um telefone válido.");
      return false;
    }
    if (!documento.trim()) {
      Alert.alert("Erro", `Informe seu ${tipoDocumento}.`);
      return false;
    }
    return true;
  };

  const validarCadastroFazenda = () => {
    if (!nomeFazenda.trim()) {
      Alert.alert("Erro", "Informe o nome da fazenda.");
      return false;
    }
    if (!cidade.trim()) {
      Alert.alert("Erro", "Informe a cidade.");
      return false;
    }
    if (!tamanhoHectares.trim() || isNaN(Number(tamanhoHectares))) {
      Alert.alert("Erro", "Informe o tamanho em hectares.");
      return false;
    }
    return true;
  };

  const handleProximoStep = () => {
    triggerHaptic();
    if (validarCadastroUsuario()) {
      setCadastroStep("fazenda");
    }
  };

  const handleCadastrar = async () => {
    if (!validarCadastroFazenda()) return;

    triggerHaptic();
    setLoading(true);

    try {
      const sucesso = await cadastrar(
        {
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          telefone: telefone.trim(),
          documento: documento.trim(),
          tipoDocumento,
        },
        {
          nome: nomeFazenda.trim(),
          localizacao: localizacao.trim(),
          cidade: cidade.trim(),
          estado,
          tamanhoHectares: Number(tamanhoHectares),
          tipoProducao,
        }
      );

      if (sucesso) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert(
          "Bem-vindo!",
          "Cadastro realizado com sucesso. Você já pode começar a usar o Fazenda Digital!",
          [{ text: "Começar", onPress: () => router.replace("/(tabs)" as any) }]
        );
      } else {
        Alert.alert("Erro", "Não foi possível completar o cadastro. Tente novamente.");
      }
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Erro", "Preencha email e senha.");
      return;
    }

    triggerHaptic();
    setLoading(true);

    try {
      const sucesso = await login(email.trim(), senha.trim());
      if (sucesso) {
        router.replace("/(tabs)" as any);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível fazer login.");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometria = async () => {
    triggerHaptic();
    setLoading(true);

    try {
      const sucesso = await loginBiometrico();
      if (sucesso) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        router.replace("/(tabs)" as any);
      } else {
        // Se biometria falhar, mostra login normal
        setMode("login");
      }
    } catch (error) {
      setMode("login");
    } finally {
      setLoading(false);
    }
  };

  // Tela de Biometria
  if (mode === "biometria" && usuario) {
    return (
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.container}
      >
        <View style={styles.biometriaContainer}>
          <View style={styles.biometriaIcon}>
            <MaterialIcons name="face" size={80} color={COLORS.primary} />
          </View>
          
          <Text style={styles.biometriaTitle}>Olá, {usuario.nome.split(" ")[0]}!</Text>
          <Text style={styles.biometriaSubtitle}>
            Use o reconhecimento facial para entrar
          </Text>

          <TouchableOpacity
            style={styles.biometriaButton}
            onPress={handleBiometria}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialIcons name="fingerprint" size={24} color={COLORS.white} />
                <Text style={styles.biometriaButtonText}>Autenticar</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              triggerHaptic();
              setMode("login");
            }}
          >
            <Text style={styles.linkText}>Usar email e senha</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Tela de Login
  if (mode === "login") {
    return (
      <ScreenContainer>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoSmall}>
                <MaterialIcons name="eco" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.headerTitle}>Fazenda Digital</Text>
              <Text style={styles.headerSubtitle}>Entre na sua conta</Text>
            </View>

            {/* Formulário */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="email" size={20} color={COLORS.gray} />
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor={COLORS.gray}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="lock" size={20} color={COLORS.gray} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.gray}
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Entrar</Text>
                )}
              </TouchableOpacity>

              {usuario && biometriaDisponivel && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    triggerHaptic();
                    setMode("biometria");
                  }}
                >
                  <MaterialIcons name="fingerprint" size={20} color={COLORS.primary} />
                  <Text style={styles.secondaryButtonText}>Usar biometria</Text>
                </TouchableOpacity>
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => {
                  triggerHaptic();
                  setMode("cadastro");
                  setCadastroStep("usuario");
                }}
              >
                <Text style={styles.outlineButtonText}>Criar nova conta</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  // Tela de Cadastro
  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoSmall}>
              <MaterialIcons name="eco" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.headerTitle}>Criar Conta</Text>
            <Text style={styles.headerSubtitle}>
              {cadastroStep === "usuario" ? "Seus dados pessoais" : "Dados da fazenda"}
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressStep, styles.progressStepActive]}>
              <Text style={styles.progressStepText}>1</Text>
            </View>
            <View style={[styles.progressLine, cadastroStep === "fazenda" && styles.progressLineActive]} />
            <View style={[styles.progressStep, cadastroStep === "fazenda" && styles.progressStepActive]}>
              <Text style={[styles.progressStepText, cadastroStep !== "fazenda" && styles.progressStepTextInactive]}>2</Text>
            </View>
          </View>

          {/* Formulário - Step 1: Usuário */}
          {cadastroStep === "usuario" && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome Completo</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="person" size={20} color={COLORS.gray} />
                  <TextInput
                    style={styles.input}
                    placeholder="João da Silva"
                    placeholderTextColor={COLORS.gray}
                    value={nome}
                    onChangeText={setNome}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="email" size={20} color={COLORS.gray} />
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor={COLORS.gray}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="phone" size={20} color={COLORS.gray} />
                  <TextInput
                    style={styles.input}
                    placeholder="(11) 99999-9999"
                    placeholderTextColor={COLORS.gray}
                    value={telefone}
                    onChangeText={(text) => setTelefone(formatarTelefone(text))}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    maxLength={15}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tipo de Documento</Text>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[
                      styles.segmentedButton,
                      tipoDocumento === "CPF" && styles.segmentedButtonActive,
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setTipoDocumento("CPF");
                      setDocumento("");
                    }}
                  >
                    <Text
                      style={[
                        styles.segmentedButtonText,
                        tipoDocumento === "CPF" && styles.segmentedButtonTextActive,
                      ]}
                    >
                      CPF
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentedButton,
                      tipoDocumento === "CNPJ" && styles.segmentedButtonActive,
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setTipoDocumento("CNPJ");
                      setDocumento("");
                    }}
                  >
                    <Text
                      style={[
                        styles.segmentedButtonText,
                        tipoDocumento === "CNPJ" && styles.segmentedButtonTextActive,
                      ]}
                    >
                      CNPJ
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{tipoDocumento}</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="badge" size={20} color={COLORS.gray} />
                  <TextInput
                    style={styles.input}
                    placeholder={tipoDocumento === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                    placeholderTextColor={COLORS.gray}
                    value={documento}
                    onChangeText={(text) => setDocumento(formatarDocumento(text, tipoDocumento))}
                    keyboardType="numeric"
                    returnKeyType="done"
                    maxLength={tipoDocumento === "CPF" ? 14 : 18}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleProximoStep}
              >
                <Text style={styles.primaryButtonText}>Próximo</Text>
                <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
              </TouchableOpacity>

              {usuario && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => {
                    triggerHaptic();
                    setMode("login");
                  }}
                >
                  <Text style={styles.linkTextDark}>Já tenho uma conta</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Formulário - Step 2: Fazenda */}
          {cadastroStep === "fazenda" && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome da Fazenda</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="home" size={20} color={COLORS.gray} />
                  <TextInput
                    style={styles.input}
                    placeholder="Fazenda Boa Vista"
                    placeholderTextColor={COLORS.gray}
                    value={nomeFazenda}
                    onChangeText={setNomeFazenda}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cidade</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="location-city" size={20} color={COLORS.gray} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ribeirão Preto"
                    placeholderTextColor={COLORS.gray}
                    value={cidade}
                    onChangeText={setCidade}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Estado</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.estadoScroll}
                >
                  {ESTADOS_BRASIL.map((uf) => (
                    <TouchableOpacity
                      key={uf}
                      style={[
                        styles.estadoChip,
                        estado === uf && styles.estadoChipActive,
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setEstado(uf);
                      }}
                    >
                      <Text
                        style={[
                          styles.estadoChipText,
                          estado === uf && styles.estadoChipTextActive,
                        ]}
                      >
                        {uf}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Localização / Endereço</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="place" size={20} color={COLORS.gray} />
                  <TextInput
                    style={styles.input}
                    placeholder="Rodovia SP-330, Km 45"
                    placeholderTextColor={COLORS.gray}
                    value={localizacao}
                    onChangeText={setLocalizacao}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tamanho (hectares)</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="landscape" size={20} color={COLORS.gray} />
                  <TextInput
                    style={styles.input}
                    placeholder="500"
                    placeholderTextColor={COLORS.gray}
                    value={tamanhoHectares}
                    onChangeText={setTamanhoHectares}
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tipo de Produção</Text>
                <View style={styles.segmentedControl}>
                  {["Corte", "Leite", "Misto"].map((tipo) => (
                    <TouchableOpacity
                      key={tipo}
                      style={[
                        styles.segmentedButton,
                        tipoProducao === tipo && styles.segmentedButtonActive,
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setTipoProducao(tipo);
                      }}
                    >
                      <Text
                        style={[
                          styles.segmentedButtonText,
                          tipoProducao === tipo && styles.segmentedButtonTextActive,
                        ]}
                      >
                        {tipo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    triggerHaptic();
                    setCadastroStep("usuario");
                  }}
                >
                  <MaterialIcons name="arrow-back" size={20} color={COLORS.primary} />
                  <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, { flex: 1 }]}
                  onPress={handleCadastrar}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Criar Conta</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
  },
  logoSmall: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.gray,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  progressStepActive: {
    backgroundColor: COLORS.primary,
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.white,
  },
  progressStepTextInactive: {
    color: COLORS.gray,
  },
  progressLine: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: COLORS.primary,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    padding: 4,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentedButtonActive: {
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray,
  },
  segmentedButtonTextActive: {
    color: COLORS.primary,
  },
  estadoScroll: {
    marginTop: 4,
  },
  estadoChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    marginRight: 8,
  },
  estadoChipActive: {
    backgroundColor: COLORS.primary,
  },
  estadoChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.gray,
  },
  estadoChipTextActive: {
    color: COLORS.white,
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
  secondaryButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary + "10",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
  outlineButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: COLORS.gray,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.white + "CC",
    textDecorationLine: "underline",
  },
  linkTextDark: {
    fontSize: 14,
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
  // Biometria
  biometriaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  biometriaIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  biometriaTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 8,
  },
  biometriaSubtitle: {
    fontSize: 15,
    color: COLORS.white + "CC",
    textAlign: "center",
    marginBottom: 40,
  },
  biometriaButton: {
    flexDirection: "row",
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  biometriaButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
});
