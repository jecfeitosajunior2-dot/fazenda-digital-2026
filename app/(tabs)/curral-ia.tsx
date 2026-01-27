import { ScreenContainer } from "@/components/screen-container";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
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
  border: "#DEE2E6",
  text: "#212529",
  aiBlue: "#0066CC",
  aiPurple: "#6B4EE6",
};

interface Curral {
  id: string;
  nome: string;
  capacidade: number;
  contagemAtual: number;
  ultimaAtualizacao: Date;
  cameraId: string;
  status: "monitorando" | "pausado" | "offline";
}

interface HistoricoContagem {
  id: string;
  curralId: string;
  contagem: number;
  timestamp: Date;
  tipo: "entrada" | "saida" | "contagem";
  quantidade: number;
}

interface CameraStatus {
  id: string;
  nome: string;
  curralId: string;
  status: "online" | "offline" | "processando";
  fps: number;
}

export default function CurralIAScreen() {
  const [currais, setCurrais] = useState<Curral[]>([
    {
      id: "c1",
      nome: "Curral Principal",
      capacidade: 100,
      contagemAtual: 0,
      ultimaAtualizacao: new Date(),
      cameraId: "cam1",
      status: "monitorando",
    },
    {
      id: "c2",
      nome: "Curral de Manejo",
      capacidade: 50,
      contagemAtual: 0,
      ultimaAtualizacao: new Date(),
      cameraId: "cam2",
      status: "pausado",
    },
    {
      id: "c3",
      nome: "Curral de Engorda",
      capacidade: 80,
      contagemAtual: 0,
      ultimaAtualizacao: new Date(),
      cameraId: "cam3",
      status: "monitorando",
    },
    {
      id: "c4",
      nome: "Curral de Quarentena",
      capacidade: 30,
      contagemAtual: 0,
      ultimaAtualizacao: new Date(),
      cameraId: "cam4",
      status: "pausado",
    },
  ]);
  
  const [cameras, setCameras] = useState<CameraStatus[]>([
    { id: "cam1", nome: "Câmera Norte", curralId: "c1", status: "online", fps: 30 },
    { id: "cam2", nome: "Câmera Sul", curralId: "c2", status: "online", fps: 30 },
    { id: "cam3", nome: "Câmera Leste", curralId: "c3", status: "online", fps: 30 },
    { id: "cam4", nome: "Câmera Oeste", curralId: "c4", status: "offline", fps: 0 },
  ]);

  const [historico, setHistorico] = useState<HistoricoContagem[]>([]);
  const [selectedCurral, setSelectedCurral] = useState<string>("c1");
  const [isContando, setIsContando] = useState(false);
  const [totalGado, setTotalGado] = useState(0);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de pulso
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const triggerSuccessHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const iniciarContagem = async (curralId: string) => {
    setIsContando(true);
    triggerHaptic();

    // Simular processamento de IA
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Gerar contagem aleatória
    const curral = currais.find((c) => c.id === curralId);
    if (!curral) return;

    const novaContagem = Math.floor(Math.random() * curral.capacidade * 0.8);

    setCurrais((prev) =>
      prev.map((c) =>
        c.id === curralId
          ? { ...c, contagemAtual: novaContagem, ultimaAtualizacao: new Date() }
          : c
      )
    );

    const novoHistorico: HistoricoContagem = {
      id: Date.now().toString(),
      curralId: curralId,
      contagem: novaContagem,
      timestamp: new Date(),
      tipo: "contagem",
      quantidade: novaContagem,
    };

    setHistorico((prev) => [novoHistorico, ...prev]);
    setTotalGado((prev) => prev + novaContagem);

    setIsContando(false);
    triggerSuccessHaptic();
  };

  const contarTodosCurrais = async () => {
    Alert.alert(
      "Contagem Geral",
      "Iniciar contagem automática em todos os currais?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Iniciar",
          onPress: async () => {
            triggerHaptic();
            setIsContando(true);

            for (const curral of currais) {
              if (curral.status === "monitorando") {
                await new Promise((resolve) => setTimeout(resolve, 1500));
                const novaContagem = Math.floor(
                  Math.random() * curral.capacidade * 0.8
                );
                setCurrais((prev) =>
                  prev.map((c) =>
                    c.id === curral.id
                      ? {
                          ...c,
                          contagemAtual: novaContagem,
                          ultimaAtualizacao: new Date(),
                        }
                      : c
                  )
                );
              }
            }

            setIsContando(false);
            triggerSuccessHaptic();
            Alert.alert("Sucesso", "Contagem de todos os currais concluída!");
          },
        },
      ]
    );
  };

  const toggleMonitoramento = (curralId: string) => {
    triggerHaptic();
    setCurrais((prev) =>
      prev.map((c) =>
        c.id === curralId
          ? {
              ...c,
              status: c.status === "monitorando" ? "pausado" : "monitorando",
            }
          : c
      )
    );
  };

  const registrarMovimentacao = (curralId: string, tipo: "entrada" | "saida") => {
    Alert.prompt(
      tipo === "entrada" ? "Registrar Entrada" : "Registrar Saída",
      "Quantidade de animais:",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: (quantidade: string | undefined) => {
            const qtd = parseInt(quantidade || "0");
            if (qtd > 0) {
              triggerSuccessHaptic();
              setCurrais((prev) =>
                prev.map((c) =>
                  c.id === curralId
                    ? {
                        ...c,
                        contagemAtual:
                          tipo === "entrada"
                            ? c.contagemAtual + qtd
                            : Math.max(0, c.contagemAtual - qtd),
                        ultimaAtualizacao: new Date(),
                      }
                    : c
                )
              );

              const novoHistorico: HistoricoContagem = {
                id: Date.now().toString(),
                curralId: curralId,
                contagem:
                  currais.find((c) => c.id === curralId)?.contagemAtual || 0,
                timestamp: new Date(),
                tipo: tipo,
                quantidade: qtd,
              };
              setHistorico((prev) => [novoHistorico, ...prev]);
            }
          },
        },
      ],
      "plain-text",
      "",
      "number-pad"
    );
  };

  const renderCurralCard = ({ item }: { item: Curral }) => {
    const camera = cameras.find((c) => c.id === item.cameraId);
    const ocupacao = (item.contagemAtual / item.capacidade) * 100;

    return (
      <TouchableOpacity
        style={[
          styles.curralCard,
          selectedCurral === item.id && styles.curralCardSelected,
        ]}
        onPress={() => setSelectedCurral(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.curralHeader}>
          <View style={styles.curralTitleRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    item.status === "monitorando"
                      ? COLORS.success
                      : item.status === "pausado"
                      ? COLORS.warning
                      : COLORS.danger,
                },
              ]}
            />
            <Text style={styles.curralNome}>{item.nome}</Text>
          </View>
          <TouchableOpacity
            style={styles.monitorBtn}
            onPress={() => toggleMonitoramento(item.id)}
          >
            <MaterialIcons
              name={item.status === "monitorando" ? "pause" : "play-arrow"}
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.curralContent}>
          <View style={styles.contagemDisplay}>
            <Animated.Text
              style={[
                styles.contagemNumero,
                item.status === "monitorando" && {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              {item.contagemAtual}
            </Animated.Text>
            <Text style={styles.contagemLabel}>cabeças</Text>
          </View>

          <View style={styles.curralStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Capacidade</Text>
              <Text style={styles.statValue}>{item.capacidade}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Ocupação</Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      ocupacao > 90
                        ? COLORS.danger
                        : ocupacao > 70
                        ? COLORS.warning
                        : COLORS.success,
                  },
                ]}
              >
                {Math.round(ocupacao)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.ocupacaoBar}>
          <View
            style={[
              styles.ocupacaoFill,
              {
                width: `${Math.min(ocupacao, 100)}%`,
                backgroundColor:
                  ocupacao > 90
                    ? COLORS.danger
                    : ocupacao > 70
                    ? COLORS.warning
                    : COLORS.success,
              },
            ]}
          />
        </View>

        <View style={styles.curralFooter}>
          <View style={styles.cameraInfo}>
            <MaterialIcons
              name="videocam"
              size={14}
              color={camera?.status === "online" ? COLORS.success : COLORS.danger}
            />
            <Text style={styles.cameraText}>{camera?.nome || "Sem câmera"}</Text>
          </View>
          <Text style={styles.atualizacaoText}>
            {item.ultimaAtualizacao.toLocaleTimeString("pt-BR")}
          </Text>
        </View>

        {selectedCurral === item.id && (
          <View style={styles.curralActions}>
            <TouchableOpacity
              style={[styles.curralActionBtn, styles.contarBtn]}
              onPress={() => iniciarContagem(item.id)}
              disabled={isContando}
            >
              <MaterialIcons name="camera" size={18} color={COLORS.white} />
              <Text style={styles.curralActionText}>Contar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.curralActionBtn, styles.entradaBtn]}
              onPress={() => registrarMovimentacao(item.id, "entrada")}
            >
              <MaterialIcons name="add" size={18} color={COLORS.success} />
              <Text style={[styles.curralActionText, { color: COLORS.success }]}>
                Entrada
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.curralActionBtn, styles.saidaBtn]}
              onPress={() => registrarMovimentacao(item.id, "saida")}
            >
              <MaterialIcons name="remove" size={18} color={COLORS.danger} />
              <Text style={[styles.curralActionText, { color: COLORS.danger }]}>
                Saída
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHistoricoItem = ({ item }: { item: HistoricoContagem }) => {
    const curral = currais.find((c) => c.id === item.curralId);
    return (
      <View style={styles.historicoItem}>
        <View
          style={[
            styles.historicoIcon,
            {
              backgroundColor:
                item.tipo === "entrada"
                  ? COLORS.success + "20"
                  : item.tipo === "saida"
                  ? COLORS.danger + "20"
                  : COLORS.primary + "20",
            },
          ]}
        >
          <MaterialIcons
            name={
              item.tipo === "entrada"
                ? "arrow-downward"
                : item.tipo === "saida"
                ? "arrow-upward"
                : "camera"
            }
            size={16}
            color={
              item.tipo === "entrada"
                ? COLORS.success
                : item.tipo === "saida"
                ? COLORS.danger
                : COLORS.primary
            }
          />
        </View>
        <View style={styles.historicoInfo}>
          <Text style={styles.historicoTipo}>
            {item.tipo === "entrada"
              ? "Entrada"
              : item.tipo === "saida"
              ? "Saída"
              : "Contagem"}
          </Text>
          <Text style={styles.historicoCurral}>{curral?.nome}</Text>
        </View>
        <View style={styles.historicoNumeros}>
          <Text style={styles.historicoQuantidade}>
            {item.tipo !== "contagem" && (item.tipo === "entrada" ? "+" : "-")}
            {item.quantidade}
          </Text>
          <Text style={styles.historicoHora}>
            {item.timestamp.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  const totalAnimais = currais.reduce((acc, c) => acc + c.contagemAtual, 0);
  const capacidadeTotal = currais.reduce((acc, c) => acc + c.capacidade, 0);
  const camerasOnline = cameras.filter((c) => c.status === "online").length;

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiIcon}>
              <MaterialIcons name="grid-view" size={24} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Curral IA</Text>
              <Text style={styles.headerSubtitle}>
                Controle de Quantidade por Câmera
              </Text>
            </View>
          </View>
        </View>

        {/* Resumo Geral */}
        <View style={styles.resumoSection}>
          <View style={styles.resumoCard}>
            <View style={styles.resumoMain}>
              <MaterialIcons name="pets" size={32} color={COLORS.primary} />
              <Text style={styles.resumoNumero}>{totalAnimais}</Text>
              <Text style={styles.resumoLabel}>Total de Animais</Text>
            </View>
            <View style={styles.resumoStats}>
              <View style={styles.resumoStatItem}>
                <MaterialIcons name="home" size={16} color={COLORS.gray} />
                <Text style={styles.resumoStatText}>
                  {currais.length} currais
                </Text>
              </View>
              <View style={styles.resumoStatItem}>
                <MaterialIcons name="videocam" size={16} color={COLORS.success} />
                <Text style={styles.resumoStatText}>
                  {camerasOnline}/{cameras.length} câmeras
                </Text>
              </View>
              <View style={styles.resumoStatItem}>
                <MaterialIcons name="storage" size={16} color={COLORS.gold} />
                <Text style={styles.resumoStatText}>
                  {Math.round((totalAnimais / capacidadeTotal) * 100)}% ocupado
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.contarTodosBtn}
            onPress={contarTodosCurrais}
            disabled={isContando}
          >
            {isContando ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <MaterialIcons name="refresh" size={20} color={COLORS.white} />
            )}
            <Text style={styles.contarTodosBtnText}>
              {isContando ? "Contando..." : "Contar Todos"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Currais */}
        <View style={styles.curraisSection}>
          <Text style={styles.sectionTitle}>Currais Monitorados</Text>
          <FlatList
            data={currais}
            keyExtractor={(item) => item.id}
            renderItem={renderCurralCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.curraisList}
          />
        </View>

        {/* Histórico */}
        {historico.length > 0 && (
          <View style={styles.historicoSection}>
            <Text style={styles.sectionTitle}>Movimentações Recentes</Text>
            <FlatList
              data={historico.slice(0, 5)}
              keyExtractor={(item) => item.id}
              renderItem={renderHistoricoItem}
              showsVerticalScrollIndicator={false}
              horizontal
              contentContainerStyle={styles.historicoList}
            />
          </View>
        )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.aiPurple,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  resumoSection: {
    padding: 16,
  },
  resumoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resumoMain: {
    alignItems: "center",
    marginBottom: 16,
  },
  resumoNumero: {
    fontSize: 56,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 8,
  },
  resumoLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  resumoStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  resumoStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resumoStatText: {
    fontSize: 13,
    color: COLORS.darkGray,
  },
  contarTodosBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    gap: 8,
  },
  contarTodosBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  curraisSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  curraisList: {
    paddingBottom: 16,
  },
  curralCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  curralCardSelected: {
    borderColor: COLORS.primary,
  },
  curralHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  curralTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  curralNome: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  monitorBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  curralContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contagemDisplay: {
    flex: 1,
    alignItems: "center",
  },
  contagemNumero: {
    fontSize: 48,
    fontWeight: "800",
    color: COLORS.primary,
  },
  contagemLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  curralStats: {
    flex: 1,
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.gray,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  ocupacaoBar: {
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  ocupacaoFill: {
    height: "100%",
    borderRadius: 3,
  },
  curralFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cameraInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cameraText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  atualizacaoText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  curralActions: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  curralActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  contarBtn: {
    backgroundColor: COLORS.primary,
  },
  entradaBtn: {
    backgroundColor: COLORS.success + "15",
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  saidaBtn: {
    backgroundColor: COLORS.danger + "15",
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  curralActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.white,
  },
  historicoSection: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  historicoList: {
    gap: 10,
  },
  historicoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historicoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  historicoInfo: {
    flex: 1,
    marginLeft: 10,
  },
  historicoTipo: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  historicoCurral: {
    fontSize: 11,
    color: COLORS.gray,
  },
  historicoNumeros: {
    alignItems: "flex-end",
  },
  historicoQuantidade: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  historicoHora: {
    fontSize: 11,
    color: COLORS.gray,
  },
});
