import { useData } from "@/lib/data-context";
import { ScreenContainer } from "@/components/screen-container";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

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

export default function HomeScreen() {
  const router = useRouter();
  const {
    totalAnimais,
    totalArrobas,
    faturamentoTotal,
    custosTotal,
    lucroTotal,
    mediaPeso,
    animais,
    vendas,
    custos,
    loading,
  } = useData();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Estatísticas por categoria
  const bois = animais.filter((a) => a.categoria === "Boi").length;
  const vacas = animais.filter((a) => a.categoria === "Vaca").length;
  const bezerros = animais.filter((a) => a.categoria === "Bezerro").length;
  const novilhas = animais.filter((a) => a.categoria === "Novilha").length;

  // Últimas atividades
  const ultimasVendas = vendas.slice(-3).reverse();
  const ultimosCustos = custos.slice(-3).reverse();

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header com Gradiente */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Bem-vindo ao</Text>
              <Text style={styles.appName}>Fazenda Digital</Text>
              <Text style={styles.subtitle}>Gestão Pecuária Inteligente</Text>
            </View>
            <View style={styles.logoContainer}>
              <MaterialIcons name="eco" size={48} color={COLORS.gold} />
            </View>
          </View>
        </LinearGradient>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Cards de Resumo Principal */}
          <View style={styles.mainCardsRow}>
            <View style={[styles.mainCard, { backgroundColor: COLORS.primary }]}>
              <MaterialIcons name="pets" size={28} color={COLORS.white} />
              <Text style={styles.mainCardValue}>{totalAnimais}</Text>
              <Text style={styles.mainCardLabel}>Cabeças</Text>
            </View>
            <View style={[styles.mainCard, { backgroundColor: COLORS.secondary }]}>
              <MaterialIcons name="fitness-center" size={28} color={COLORS.white} />
              <Text style={styles.mainCardValue}>{totalArrobas}</Text>
              <Text style={styles.mainCardLabel}>Arrobas</Text>
            </View>
          </View>

          {/* Cards Financeiros */}
          <View style={styles.sectionTitle}>
            <MaterialIcons name="account-balance-wallet" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitleText}>Resumo Financeiro</Text>
          </View>

          <View style={styles.financeCardsContainer}>
            <View style={styles.financeCard}>
              <View style={[styles.financeIconBg, { backgroundColor: COLORS.success + "20" }]}>
                <MaterialIcons name="trending-up" size={24} color={COLORS.success} />
              </View>
              <View style={styles.financeInfo}>
                <Text style={styles.financeLabel}>Faturamento</Text>
                <Text style={[styles.financeValue, { color: COLORS.success }]}>
                  R$ {faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View style={styles.financeCard}>
              <View style={[styles.financeIconBg, { backgroundColor: COLORS.danger + "20" }]}>
                <MaterialIcons name="trending-down" size={24} color={COLORS.danger} />
              </View>
              <View style={styles.financeInfo}>
                <Text style={styles.financeLabel}>Custos</Text>
                <Text style={[styles.financeValue, { color: COLORS.danger }]}>
                  R$ {custosTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View style={styles.financeCard}>
              <View
                style={[
                  styles.financeIconBg,
                  { backgroundColor: lucroTotal >= 0 ? COLORS.gold + "20" : COLORS.danger + "20" },
                ]}
              >
                <MaterialIcons
                  name={lucroTotal >= 0 ? "star" : "warning"}
                  size={24}
                  color={lucroTotal >= 0 ? COLORS.gold : COLORS.danger}
                />
              </View>
              <View style={styles.financeInfo}>
                <Text style={styles.financeLabel}>Lucro</Text>
                <Text
                  style={[
                    styles.financeValue,
                    { color: lucroTotal >= 0 ? COLORS.gold : COLORS.danger },
                  ]}
                >
                  R$ {lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>

          {/* Composição do Rebanho */}
          <View style={styles.sectionTitle}>
            <MaterialIcons name="pie-chart" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitleText}>Composição do Rebanho</Text>
          </View>

          <View style={styles.compositionContainer}>
            <View style={styles.compositionItem}>
              <View style={[styles.compositionDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.compositionLabel}>Bois</Text>
              <Text style={styles.compositionValue}>{bois}</Text>
            </View>
            <View style={styles.compositionItem}>
              <View style={[styles.compositionDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.compositionLabel}>Vacas</Text>
              <Text style={styles.compositionValue}>{vacas}</Text>
            </View>
            <View style={styles.compositionItem}>
              <View style={[styles.compositionDot, { backgroundColor: COLORS.accent }]} />
              <Text style={styles.compositionLabel}>Bezerros</Text>
              <Text style={styles.compositionValue}>{bezerros}</Text>
            </View>
            <View style={styles.compositionItem}>
              <View style={[styles.compositionDot, { backgroundColor: COLORS.gold }]} />
              <Text style={styles.compositionLabel}>Novilhas</Text>
              <Text style={styles.compositionValue}>{novilhas}</Text>
            </View>
          </View>

          {/* Indicadores de Desempenho */}
          <View style={styles.sectionTitle}>
            <MaterialIcons name="analytics" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitleText}>Indicadores</Text>
          </View>

          <View style={styles.indicatorsContainer}>
            <View style={styles.indicatorCard}>
              <Text style={styles.indicatorValue}>{mediaPeso} kg</Text>
              <Text style={styles.indicatorLabel}>Peso Médio</Text>
            </View>
            <View style={styles.indicatorCard}>
              <Text style={styles.indicatorValue}>{(mediaPeso / 30).toFixed(1)} @</Text>
              <Text style={styles.indicatorLabel}>@ Média/Cab</Text>
            </View>
            <View style={styles.indicatorCard}>
              <Text style={styles.indicatorValue}>{vendas.length}</Text>
              <Text style={styles.indicatorLabel}>Vendas</Text>
            </View>
          </View>

          {/* Ações Rápidas */}
          <View style={styles.sectionTitle}>
            <MaterialIcons name="flash-on" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitleText}>Ações Rápidas</Text>
          </View>

          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push("/(tabs)/rebanho" as any)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={styles.quickActionGradient}
              >
                <MaterialIcons name="add" size={24} color={COLORS.white} />
                <Text style={styles.quickActionText}>Novo Animal</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push("/(tabs)/vendas" as any)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.secondary, "#52B788"]}
                style={styles.quickActionGradient}
              >
                <MaterialIcons name="attach-money" size={24} color={COLORS.white} />
                <Text style={styles.quickActionText}>Nova Venda</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push("/(tabs)/custos" as any)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.accent, "#E9C46A"]}
                style={styles.quickActionGradient}
              >
                <MaterialIcons name="receipt-long" size={24} color={COLORS.white} />
                <Text style={styles.quickActionText}>Novo Custo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Últimas Vendas */}
          {ultimasVendas.length > 0 && (
            <>
              <View style={styles.sectionTitle}>
                <MaterialIcons name="history" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitleText}>Últimas Vendas</Text>
              </View>

              {ultimasVendas.map((venda) => (
                <View key={venda.id} style={styles.activityCard}>
                  <View style={[styles.activityIcon, { backgroundColor: COLORS.success + "20" }]}>
                    <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>
                      {venda.quantidadeAnimais} {venda.quantidadeAnimais === 1 ? "animal" : "animais"} vendido
                      {venda.quantidadeAnimais === 1 ? "" : "s"}
                    </Text>
                    <Text style={styles.activitySubtitle}>
                      {venda.arrobas.toFixed(1)}@ • R$ {venda.valorTotal.toLocaleString("pt-BR")}
                    </Text>
                  </View>
                  <Text style={styles.activityDate}>{venda.data}</Text>
                </View>
              ))}
            </>
          )}

          {/* Últimos Custos */}
          {ultimosCustos.length > 0 && (
            <>
              <View style={styles.sectionTitle}>
                <MaterialIcons name="receipt" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitleText}>Últimos Custos</Text>
              </View>

              {ultimosCustos.map((custo) => (
                <View key={custo.id} style={styles.activityCard}>
                  <View style={[styles.activityIcon, { backgroundColor: COLORS.warning + "20" }]}>
                    <MaterialIcons name="receipt-long" size={20} color={COLORS.warning} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{custo.descricao}</Text>
                    <Text style={styles.activitySubtitle}>{custo.categoria}</Text>
                  </View>
                  <Text style={[styles.activityDate, { color: COLORS.danger }]}>
                    -R$ {custo.valor.toLocaleString("pt-BR")}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Espaço para Tab Bar */}
          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    color: COLORS.white + "CC",
    marginBottom: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gold,
    fontWeight: "500",
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  mainCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  mainCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  mainCardValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: 8,
  },
  mainCardLabel: {
    fontSize: 14,
    color: COLORS.white + "CC",
    marginTop: 4,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  financeCardsContainer: {
    gap: 10,
  },
  financeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  financeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  financeInfo: {
    marginLeft: 16,
    flex: 1,
  },
  financeLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  financeValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  compositionContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compositionItem: {
    alignItems: "center",
  },
  compositionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  compositionLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  compositionValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  indicatorsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  indicatorCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  indicatorValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  indicatorLabel: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: "center",
  },
  quickActionsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionGradient: {
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
    textAlign: "center",
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: COLORS.gray,
  },
  activityDate: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "500",
  },
});
