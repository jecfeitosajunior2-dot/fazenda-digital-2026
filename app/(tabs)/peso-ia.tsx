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
  TextInput,
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

interface PesagemIA {
  id: string;
  timestamp: Date;
  pesoEstimado: number;
  confianca: number;
  categoria: string;
  identificador?: string;
  cameraId: string;
}

interface CameraStatus {
  id: string;
  nome: string;
  status: "online" | "offline" | "processando";
  ultimaLeitura?: Date;
}

export default function PesoIAScreen() {
  const [pesagens, setPesagens] = useState<PesagemIA[]>([]);
  const [cameras, setCameras] = useState<CameraStatus[]>([
    { id: "cam1", nome: "Corredor 1", status: "online" },
    { id: "cam2", nome: "Corredor 2", status: "online" },
    { id: "cam3", nome: "Balança IA", status: "online" },
  ]);
  const [selectedCamera, setSelectedCamera] = useState<string>("cam1");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pesoAtual, setPesoAtual] = useState<number | null>(null);
  const [confiancaAtual, setConfiancaAtual] = useState<number>(0);
  const [totalPesagens, setTotalPesagens] = useState(0);
  const [mediaHoje, setMediaHoje] = useState(0);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de pulso para indicador de processamento
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  useEffect(() => {
    // Animação de scan
    if (isProcessing) {
      const scan = Animated.loop(
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      scan.start();
      return () => scan.stop();
    }
  }, [isProcessing]);

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

  const simularPesagem = async () => {
    setIsProcessing(true);
    triggerHaptic();

    // Simular processamento de IA
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Gerar peso aleatório realista (300-600kg para bovinos)
    const peso = Math.round(350 + Math.random() * 250);
    const confianca = Math.round(85 + Math.random() * 14);
    const categorias = ["Boi", "Vaca", "Novilha", "Bezerro"];
    const categoria = categorias[Math.floor(Math.random() * categorias.length)];

    const novaPesagem: PesagemIA = {
      id: Date.now().toString(),
      timestamp: new Date(),
      pesoEstimado: peso,
      confianca: confianca,
      categoria: categoria,
      cameraId: selectedCamera,
    };

    setPesagens((prev) => [novaPesagem, ...prev]);
    setPesoAtual(peso);
    setConfiancaAtual(confianca);
    setTotalPesagens((prev) => prev + 1);
    setMediaHoje((prev) => (prev * totalPesagens + peso) / (totalPesagens + 1));

    setIsProcessing(false);
    triggerSuccessHaptic();
  };

  const iniciarCapturaContinua = () => {
    Alert.alert(
      "Captura Contínua",
      "A captura contínua irá processar automaticamente cada animal que passar pela câmera. Deseja iniciar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Iniciar",
          onPress: () => {
            triggerHaptic();
            Alert.alert(
              "Modo Contínuo Ativado",
              "A IA está monitorando o corredor. Cada animal detectado será pesado automaticamente."
            );
          },
        },
      ]
    );
  };

  const exportarDados = () => {
    triggerHaptic();
    Alert.alert(
      "Exportar Dados",
      `${pesagens.length} pesagens serão exportadas em formato CSV.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Exportar",
          onPress: () => {
            triggerSuccessHaptic();
            Alert.alert("Sucesso", "Dados exportados com sucesso!");
          },
        },
      ]
    );
  };

  const renderPesagemItem = ({ item }: { item: PesagemIA }) => (
    <View style={styles.pesagemCard}>
      <View style={styles.pesagemHeader}>
        <View style={styles.pesagemIcon}>
          <MaterialIcons name="monitor-weight" size={20} color={COLORS.white} />
        </View>
        <View style={styles.pesagemInfo}>
          <Text style={styles.pesagemPeso}>{item.pesoEstimado} kg</Text>
          <Text style={styles.pesagemCategoria}>{item.categoria}</Text>
        </View>
        <View style={styles.pesagemConfianca}>
          <Text style={styles.confiancaLabel}>Confiança</Text>
          <Text
            style={[
              styles.confiancaValue,
              { color: item.confianca >= 90 ? COLORS.success : COLORS.warning },
            ]}
          >
            {item.confianca}%
          </Text>
        </View>
      </View>
      <View style={styles.pesagemFooter}>
        <Text style={styles.pesagemTime}>
          {item.timestamp.toLocaleTimeString("pt-BR")}
        </Text>
        <Text style={styles.pesagemCamera}>
          {cameras.find((c) => c.id === item.cameraId)?.nome || "Câmera"}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiIcon}>
              <MaterialIcons name="visibility" size={24} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Peso IA</Text>
              <Text style={styles.headerSubtitle}>Pesagem por Visão Computacional</Text>
            </View>
          </View>
        </View>

        {/* Painel Principal de Peso */}
        <View style={styles.mainPanel}>
          <View style={styles.cameraPreview}>
            <View style={styles.cameraPlaceholder}>
              <MaterialIcons name="videocam" size={48} color={COLORS.gray} />
              <Text style={styles.cameraText}>Feed da Câmera</Text>
              <Text style={styles.cameraSubtext}>
                {cameras.find((c) => c.id === selectedCamera)?.nome}
              </Text>
            </View>
            {isProcessing && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 180],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </View>

          {/* Display de Peso */}
          <View style={styles.pesoDisplay}>
            <Animated.View
              style={[
                styles.pesoCircle,
                isProcessing && { transform: [{ scale: pulseAnim }] },
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color={COLORS.white} />
              ) : pesoAtual ? (
                <>
                  <Text style={styles.pesoValue}>{pesoAtual}</Text>
                  <Text style={styles.pesoUnit}>kg</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="monitor-weight" size={40} color={COLORS.white} />
                  <Text style={styles.pesoWaiting}>Aguardando</Text>
                </>
              )}
            </Animated.View>
            {pesoAtual && !isProcessing && (
              <View style={styles.confiancaBar}>
                <Text style={styles.confiancaText}>
                  Confiança: {confiancaAtual}%
                </Text>
                <View style={styles.confiancaProgress}>
                  <View
                    style={[
                      styles.confiancaFill,
                      {
                        width: `${confiancaAtual}%`,
                        backgroundColor:
                          confiancaAtual >= 90 ? COLORS.success : COLORS.warning,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Seletor de Câmera */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cameraSelector}
          contentContainerStyle={styles.cameraSelectorContent}
        >
          {cameras.map((camera) => (
            <TouchableOpacity
              key={camera.id}
              style={[
                styles.cameraBtn,
                selectedCamera === camera.id && styles.cameraBtnActive,
              ]}
              onPress={() => {
                setSelectedCamera(camera.id);
                triggerHaptic();
              }}
            >
              <View
                style={[
                  styles.cameraStatus,
                  {
                    backgroundColor:
                      camera.status === "online"
                        ? COLORS.success
                        : camera.status === "processando"
                        ? COLORS.warning
                        : COLORS.danger,
                  },
                ]}
              />
              <Text
                style={[
                  styles.cameraBtnText,
                  selectedCamera === camera.id && styles.cameraBtnTextActive,
                ]}
              >
                {camera.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Botões de Ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryBtn]}
            onPress={simularPesagem}
            disabled={isProcessing}
          >
            <MaterialIcons
              name={isProcessing ? "hourglass-empty" : "play-arrow"}
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.actionBtnText}>
              {isProcessing ? "Processando..." : "Capturar Peso"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.secondaryBtn]}
            onPress={iniciarCapturaContinua}
          >
            <MaterialIcons name="loop" size={24} color={COLORS.primary} />
            <Text style={styles.secondaryBtnText}>Modo Contínuo</Text>
          </TouchableOpacity>
        </View>

        {/* Estatísticas do Dia */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialIcons name="format-list-numbered" size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{totalPesagens}</Text>
            <Text style={styles.statLabel}>Pesagens Hoje</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="trending-up" size={20} color={COLORS.gold} />
            <Text style={styles.statValue}>
              {mediaHoje > 0 ? Math.round(mediaHoje) : "-"}
            </Text>
            <Text style={styles.statLabel}>Média (kg)</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="speed" size={20} color={COLORS.success} />
            <Text style={styles.statValue}>
              {mediaHoje > 0 ? Math.round(mediaHoje / 30) : "-"}
            </Text>
            <Text style={styles.statLabel}>Média (@)</Text>
          </View>
        </View>

        {/* Histórico de Pesagens */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Histórico de Pesagens</Text>
            {pesagens.length > 0 && (
              <TouchableOpacity onPress={exportarDados}>
                <MaterialIcons name="file-download" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>

          {pesagens.length === 0 ? (
            <View style={styles.emptyHistory}>
              <MaterialIcons name="history" size={48} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>Nenhuma pesagem registrada</Text>
              <Text style={styles.emptySubtext}>
                Clique em "Capturar Peso" para iniciar
              </Text>
            </View>
          ) : (
            <FlatList
              data={pesagens}
              keyExtractor={(item) => item.id}
              renderItem={renderPesagemItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.historyList}
            />
          )}
        </View>
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
  mainPanel: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraPreview: {
    height: 180,
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraText: {
    color: COLORS.lightGray,
    fontSize: 14,
    marginTop: 8,
  },
  cameraSubtext: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 4,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.aiPurple,
    shadowColor: COLORS.aiPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  pesoDisplay: {
    alignItems: "center",
    marginTop: 20,
  },
  pesoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pesoValue: {
    fontSize: 48,
    fontWeight: "800",
    color: COLORS.white,
  },
  pesoUnit: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
    opacity: 0.8,
  },
  pesoWaiting: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 8,
  },
  confiancaBar: {
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },
  confiancaText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  confiancaProgress: {
    width: "80%",
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: "hidden",
  },
  confiancaFill: {
    height: "100%",
    borderRadius: 4,
  },
  cameraSelector: {
    maxHeight: 50,
    marginHorizontal: 16,
  },
  cameraSelectorContent: {
    gap: 10,
    paddingVertical: 4,
  },
  cameraBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  cameraBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cameraStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cameraBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.darkGray,
  },
  cameraBtnTextActive: {
    color: COLORS.white,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
  },
  secondaryBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  historySection: {
    flex: 1,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  historyList: {
    paddingBottom: 100,
  },
  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 4,
  },
  pesagemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pesagemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  pesagemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  pesagemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  pesagemPeso: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  pesagemCategoria: {
    fontSize: 13,
    color: COLORS.gray,
  },
  pesagemConfianca: {
    alignItems: "flex-end",
  },
  confiancaLabel: {
    fontSize: 11,
    color: COLORS.gray,
  },
  confiancaValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  pesagemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pesagemTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  pesagemCamera: {
    fontSize: 12,
    color: COLORS.gray,
  },
});
