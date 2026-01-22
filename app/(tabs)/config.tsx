import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

const COLORS = {
  primary: "#1B4332",
  primaryLight: "#2D6A4F",
  secondary: "#40916C",
  accent: "#D4A574",
  gold: "#C9A227",
  background: "#F8F9FA",
  white: "#FFFFFF",
  lightGray: "#E9ECEF",
  gray: "#6C757D",
  darkGray: "#495057",
  success: "#2D6A4F",
  warning: "#E9C46A",
  danger: "#E63946",
  info: "#457B9D",
  border: "#DEE2E6",
  text: "#212529",
};

interface Lembrete {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  tipo: "vacinacao" | "vermifugo" | "pesagem" | "outro";
  ativo: boolean;
}

const STORAGE_KEY_LEMBRETES = "@fazenda_digital_lembretes";
const STORAGE_KEY_CONFIG = "@fazenda_digital_config";

export default function ConfigScreen() {
  const router = useRouter();
  const { usuario, fazenda, logout, ativarBiometria, verificarBiometriaDisponivel } = useAuth();
  
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [biometriaDisponivel, setBiometriaDisponivel] = useState(false);
  const [novoLembrete, setNovoLembrete] = useState<Partial<Lembrete>>({
    tipo: "vacinacao",
    ativo: true,
  });
  const [config, setConfig] = useState({
    notificacoes: true,
    lembreteVacinacao: true,
    lembretePesagem: true,
    precoArrobaDefault: "280",
    rendimentoDefault: "52",
  });

  useEffect(() => {
    loadData();
    checkBiometria();
  }, []);

  const checkBiometria = async () => {
    const disponivel = await verificarBiometriaDisponivel();
    setBiometriaDisponivel(disponivel);
  };

  const loadData = async () => {
    try {
      const lembretesData = await AsyncStorage.getItem(STORAGE_KEY_LEMBRETES);
      const configData = await AsyncStorage.getItem(STORAGE_KEY_CONFIG);
      
      if (lembretesData) {
        setLembretes(JSON.parse(lembretesData));
      }
      if (configData) {
        setConfig({ ...config, ...JSON.parse(configData) });
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const saveLembretes = async (newLembretes: Lembrete[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_LEMBRETES, JSON.stringify(newLembretes));
      setLembretes(newLembretes);
    } catch (error) {
      console.error("Erro ao salvar lembretes:", error);
    }
  };

  const saveConfig = async (newConfig: typeof config) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
  };

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAtivarBiometria = async () => {
    triggerHaptic();
    const sucesso = await ativarBiometria();
    if (sucesso) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Sucesso", "Biometria ativada! No próximo acesso, você poderá usar o reconhecimento facial.");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sair da Conta",
      "Deseja realmente sair? Você precisará fazer login novamente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            triggerHaptic();
            await logout();
            router.replace("/auth" as any);
          },
        },
      ]
    );
  };

  const handleAddLembrete = () => {
    if (!novoLembrete.titulo || !novoLembrete.data) {
      Alert.alert("Erro", "Preencha o título e a data do lembrete.");
      return;
    }

    triggerHaptic();
    const newLembrete: Lembrete = {
      id: Date.now().toString(),
      titulo: novoLembrete.titulo || "",
      descricao: novoLembrete.descricao || "",
      data: novoLembrete.data || "",
      tipo: novoLembrete.tipo || "outro",
      ativo: true,
    };

    saveLembretes([...lembretes, newLembrete]);
    setNovoLembrete({ tipo: "vacinacao", ativo: true });
    setModalVisible(false);
  };

  const handleDeleteLembrete = (id: string) => {
    Alert.alert("Confirmar", "Deseja excluir este lembrete?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          triggerHaptic();
          saveLembretes(lembretes.filter((l) => l.id !== id));
        },
      },
    ]);
  };

  const toggleLembrete = (id: string) => {
    triggerHaptic();
    const updated = lembretes.map((l) =>
      l.id === id ? { ...l, ativo: !l.ativo } : l
    );
    saveLembretes(updated);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "vacinacao":
        return "vaccines";
      case "vermifugo":
        return "medication";
      case "pesagem":
        return "fitness-center";
      default:
        return "event";
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "vacinacao":
        return COLORS.success;
      case "vermifugo":
        return COLORS.info;
      case "pesagem":
        return COLORS.gold;
      default:
        return COLORS.gray;
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configurações</Text>
          <Text style={styles.headerSubtitle}>Personalize seu aplicativo</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Perfil do Usuário */}
          {usuario && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meu Perfil</Text>
              
              <View style={styles.profileCard}>
                <View style={styles.profileAvatar}>
                  <MaterialIcons name="person" size={40} color={COLORS.primary} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{usuario.nome}</Text>
                  <Text style={styles.profileEmail}>{usuario.email}</Text>
                  <Text style={styles.profileDoc}>{usuario.tipoDocumento}: {usuario.documento}</Text>
                </View>
              </View>

              {fazenda && (
                <View style={styles.fazendaCard}>
                  <MaterialIcons name="home" size={24} color={COLORS.primary} />
                  <View style={styles.fazendaInfo}>
                    <Text style={styles.fazendaNome}>{fazenda.nome}</Text>
                    <Text style={styles.fazendaLocal}>
                      {fazenda.cidade}, {fazenda.estado} • {fazenda.tamanhoHectares} ha
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Segurança */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Segurança</Text>
            
            {biometriaDisponivel && (
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <MaterialIcons name="face" size={24} color={COLORS.primary} />
                  <View>
                    <Text style={styles.settingLabel}>Reconhecimento Facial</Text>
                    <Text style={styles.settingDesc}>
                      {usuario?.biometriaAtivada ? "Ativado" : "Desativado"}
                    </Text>
                  </View>
                </View>
                {!usuario?.biometriaAtivada ? (
                  <TouchableOpacity
                    style={styles.activateButton}
                    onPress={handleAtivarBiometria}
                  >
                    <Text style={styles.activateButtonText}>Ativar</Text>
                  </TouchableOpacity>
                ) : (
                  <MaterialIcons name="check-circle" size={24} color={COLORS.success} />
                )}
              </View>
            )}

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color={COLORS.danger} />
              <Text style={styles.logoutButtonText}>Sair da Conta</Text>
            </TouchableOpacity>
          </View>

          {/* Seção de Notificações */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notificações</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="notifications" size={24} color={COLORS.primary} />
                <Text style={styles.settingLabel}>Ativar Notificações</Text>
              </View>
              <Switch
                value={config.notificacoes}
                onValueChange={(value) => {
                  triggerHaptic();
                  saveConfig({ ...config, notificacoes: value });
                }}
                trackColor={{ false: COLORS.lightGray, true: COLORS.primary + "50" }}
                thumbColor={config.notificacoes ? COLORS.primary : COLORS.gray}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="vaccines" size={24} color={COLORS.success} />
                <Text style={styles.settingLabel}>Lembrete de Vacinação</Text>
              </View>
              <Switch
                value={config.lembreteVacinacao}
                onValueChange={(value) => {
                  triggerHaptic();
                  saveConfig({ ...config, lembreteVacinacao: value });
                }}
                trackColor={{ false: COLORS.lightGray, true: COLORS.success + "50" }}
                thumbColor={config.lembreteVacinacao ? COLORS.success : COLORS.gray}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="fitness-center" size={24} color={COLORS.gold} />
                <Text style={styles.settingLabel}>Lembrete de Pesagem</Text>
              </View>
              <Switch
                value={config.lembretePesagem}
                onValueChange={(value) => {
                  triggerHaptic();
                  saveConfig({ ...config, lembretePesagem: value });
                }}
                trackColor={{ false: COLORS.lightGray, true: COLORS.gold + "50" }}
                thumbColor={config.lembretePesagem ? COLORS.gold : COLORS.gray}
              />
            </View>
          </View>

          {/* Seção de Valores Padrão */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Valores Padrão</Text>
            
            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Preço da Arroba (R$)</Text>
              <TextInput
                style={styles.input}
                value={config.precoArrobaDefault}
                onChangeText={(value) => saveConfig({ ...config, precoArrobaDefault: value })}
                keyboardType="numeric"
                placeholder="280"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Rendimento de Carcaça (%)</Text>
              <TextInput
                style={styles.input}
                value={config.rendimentoDefault}
                onChangeText={(value) => saveConfig({ ...config, rendimentoDefault: value })}
                keyboardType="numeric"
                placeholder="52"
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </View>

          {/* Seção de Lembretes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Lembretes de Manejo</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  triggerHaptic();
                  setModalVisible(true);
                }}
              >
                <MaterialIcons name="add" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {lembretes.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="event-note" size={48} color={COLORS.lightGray} />
                <Text style={styles.emptyText}>Nenhum lembrete cadastrado</Text>
                <Text style={styles.emptySubtext}>
                  Adicione lembretes para vacinação, vermífugo e pesagem
                </Text>
              </View>
            ) : (
              lembretes.map((lembrete) => (
                <View
                  key={lembrete.id}
                  style={[
                    styles.lembreteCard,
                    !lembrete.ativo && styles.lembreteInativo,
                  ]}
                >
                  <View
                    style={[
                      styles.lembreteIcon,
                      { backgroundColor: getTipoColor(lembrete.tipo) + "20" },
                    ]}
                  >
                    <MaterialIcons
                      name={getTipoIcon(lembrete.tipo) as any}
                      size={24}
                      color={getTipoColor(lembrete.tipo)}
                    />
                  </View>
                  <View style={styles.lembreteInfo}>
                    <Text style={styles.lembreteTitulo}>{lembrete.titulo}</Text>
                    <Text style={styles.lembreteData}>{lembrete.data}</Text>
                    {lembrete.descricao && (
                      <Text style={styles.lembreteDesc}>{lembrete.descricao}</Text>
                    )}
                  </View>
                  <View style={styles.lembreteActions}>
                    <Switch
                      value={lembrete.ativo}
                      onValueChange={() => toggleLembrete(lembrete.id)}
                      trackColor={{ false: COLORS.lightGray, true: COLORS.primary + "50" }}
                      thumbColor={lembrete.ativo ? COLORS.primary : COLORS.gray}
                    />
                    <TouchableOpacity
                      onPress={() => handleDeleteLembrete(lembrete.id)}
                      style={styles.deleteBtn}
                    >
                      <MaterialIcons name="delete-outline" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Informações do App */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre o Aplicativo</Text>
            
            <View style={styles.aboutCard}>
              <View style={styles.aboutLogo}>
                <MaterialIcons name="eco" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.aboutName}>Fazenda Digital</Text>
              <Text style={styles.aboutVersion}>Versão 3.0.0</Text>
              <Text style={styles.aboutDesc}>
                Sistema completo de gestão pecuária para produtores de todo o Brasil.
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Modal de Novo Lembrete */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Novo Lembrete</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Título</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ex: Vacinação contra Aftosa"
                    placeholderTextColor={COLORS.gray}
                    value={novoLembrete.titulo}
                    onChangeText={(text) =>
                      setNovoLembrete({ ...novoLembrete, titulo: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Data</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ex: 15/02/2026"
                    placeholderTextColor={COLORS.gray}
                    value={novoLembrete.data}
                    onChangeText={(text) =>
                      setNovoLembrete({ ...novoLembrete, data: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tipo</Text>
                  <View style={styles.tipoSelector}>
                    {[
                      { id: "vacinacao", label: "Vacinação", icon: "vaccines" },
                      { id: "vermifugo", label: "Vermífugo", icon: "medication" },
                      { id: "pesagem", label: "Pesagem", icon: "fitness-center" },
                      { id: "outro", label: "Outro", icon: "event" },
                    ].map((tipo) => (
                      <TouchableOpacity
                        key={tipo.id}
                        style={[
                          styles.tipoOption,
                          novoLembrete.tipo === tipo.id && styles.tipoOptionSelected,
                        ]}
                        onPress={() => {
                          triggerHaptic();
                          setNovoLembrete({ ...novoLembrete, tipo: tipo.id as any });
                        }}
                      >
                        <MaterialIcons
                          name={tipo.icon as any}
                          size={20}
                          color={
                            novoLembrete.tipo === tipo.id
                              ? COLORS.white
                              : COLORS.gray
                          }
                        />
                        <Text
                          style={[
                            styles.tipoLabel,
                            novoLembrete.tipo === tipo.id && styles.tipoLabelSelected,
                          ]}
                        >
                          {tipo.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Descrição (opcional)</Text>
                  <TextInput
                    style={[styles.modalInput, { height: 80, textAlignVertical: "top" }]}
                    placeholder="Observações adicionais..."
                    placeholderTextColor={COLORS.gray}
                    multiline
                    value={novoLembrete.descricao}
                    onChangeText={(text) =>
                      setNovoLembrete({ ...novoLembrete, descricao: text })
                    }
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddLembrete}
              >
                <Text style={styles.saveButtonText}>Salvar Lembrete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  // Profile
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  profileDoc: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  fazendaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  fazendaInfo: {
    flex: 1,
  },
  fazendaNome: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
  fazendaLocal: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  // Settings
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: COLORS.text,
  },
  settingDesc: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  activateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activateButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.white,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.danger + "10",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.danger,
  },
  inputItem: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: "center",
  },
  lembreteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  lembreteInativo: {
    opacity: 0.5,
  },
  lembreteIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  lembreteInfo: {
    flex: 1,
    marginLeft: 12,
  },
  lembreteTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  lembreteData: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  lembreteDesc: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  lembreteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  aboutCard: {
    alignItems: "center",
    paddingVertical: 20,
  },
  aboutLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  aboutName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  aboutVersion: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  aboutDesc: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  modalBody: {},
  inputGroup: {
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  tipoSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tipoOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    gap: 6,
  },
  tipoOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  tipoLabel: {
    fontSize: 13,
    color: COLORS.gray,
  },
  tipoLabelSelected: {
    color: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
});
