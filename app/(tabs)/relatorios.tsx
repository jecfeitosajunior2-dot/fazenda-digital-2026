import { useData } from "@/lib/data-context";
import { ScreenContainer } from "@/components/screen-container";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

type ReportType = "inventario" | "vendas" | "custos" | "desempenho";

interface ReportConfig {
  id: ReportType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const REPORTS: ReportConfig[] = [
  {
    id: "inventario",
    title: "Inventário Completo",
    description: "Lista detalhada de todos os animais do rebanho",
    icon: "pets",
    color: COLORS.primary,
  },
  {
    id: "vendas",
    title: "Relatório de Vendas",
    description: "Histórico completo de vendas e faturamento",
    icon: "attach-money",
    color: COLORS.success,
  },
  {
    id: "custos",
    title: "Análise de Custos",
    description: "Detalhamento de custos por categoria",
    icon: "receipt-long",
    color: COLORS.danger,
  },
  {
    id: "desempenho",
    title: "Desempenho do Rebanho",
    description: "Indicadores e métricas de produtividade",
    icon: "analytics",
    color: COLORS.gold,
  },
];

export default function RelatoriosScreen() {
  const {
    animais,
    vendas,
    custos,
    totalAnimais,
    totalArrobas,
    faturamentoTotal,
    custosTotal,
    lucroTotal,
    mediaPeso,
    loading,
  } = useData();

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [generating, setGenerating] = useState(false);

  // Estatísticas por categoria de animais
  const animalStats = useMemo(() => {
    const stats = {
      bois: animais.filter((a) => a.categoria === "Boi"),
      vacas: animais.filter((a) => a.categoria === "Vaca"),
      bezerros: animais.filter((a) => a.categoria === "Bezerro"),
      novilhas: animais.filter((a) => a.categoria === "Novilha"),
    };
    return stats;
  }, [animais]);

  // Estatísticas por categoria de custos
  const custoStats = useMemo(() => {
    const categorias = ["Alimentação", "Veterinário", "Manutenção", "Mão de Obra", "Outros"];
    return categorias.map((cat) => ({
      categoria: cat,
      total: custos.filter((c) => c.categoria === cat).reduce((acc, c) => acc + c.valor, 0),
    }));
  }, [custos]);

  const openReport = (type: ReportType) => {
    setSelectedReport(type);
    setShowReportModal(true);
  };

  const generateReport = async () => {
    if (!selectedReport) return;

    setGenerating(true);

    // Simular geração de relatório
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const reportData = getReportContent(selectedReport);

    Alert.alert(
      "Relatório Gerado",
      `O relatório "${REPORTS.find((r) => r.id === selectedReport)?.title}" foi gerado com sucesso!\n\nDeseja compartilhar?`,
      [
        { text: "Fechar", style: "cancel" },
        {
          text: "Compartilhar",
          onPress: () => shareReport(reportData),
        },
      ]
    );

    setGenerating(false);
  };

  const getReportContent = (type: ReportType): string => {
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const horaAtual = new Date().toLocaleTimeString("pt-BR");

    switch (type) {
      case "inventario":
        return `
FAZENDA DIGITAL - RELATÓRIO DE INVENTÁRIO
Data: ${dataAtual} às ${horaAtual}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESUMO DO REBANHO
• Total de Cabeças: ${totalAnimais}
• Peso Total: ${animais.reduce((acc, a) => acc + a.peso, 0).toLocaleString("pt-BR")} kg
• Total em Arrobas: ${totalArrobas}@
• Peso Médio: ${mediaPeso} kg

COMPOSIÇÃO DO REBANHO
• Bois: ${animalStats.bois.length} cabeças
• Vacas: ${animalStats.vacas.length} cabeças
• Bezerros: ${animalStats.bezerros.length} cabeças
• Novilhas: ${animalStats.novilhas.length} cabeças

LISTA DE ANIMAIS
${animais.map((a) => `• ${a.identificador} - ${a.categoria} - ${a.raca} - ${a.peso}kg - Lote ${a.lote} - ${a.status}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Relatório gerado pelo Fazenda Digital
        `.trim();

      case "vendas":
        return `
FAZENDA DIGITAL - RELATÓRIO DE VENDAS
Data: ${dataAtual} às ${horaAtual}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESUMO FINANCEIRO
• Faturamento Total: R$ ${faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
• Total de Vendas: ${vendas.length}
• Animais Vendidos: ${vendas.reduce((acc, v) => acc + v.quantidadeAnimais, 0)}

HISTÓRICO DE VENDAS
${vendas.map((v) => `• ${v.data} - ${v.quantidadeAnimais} animais - ${v.arrobas.toFixed(1)}@ - R$ ${v.valorTotal.toLocaleString("pt-BR")}${v.comprador ? ` - ${v.comprador}` : ""}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Relatório gerado pelo Fazenda Digital
        `.trim();

      case "custos":
        return `
FAZENDA DIGITAL - ANÁLISE DE CUSTOS
Data: ${dataAtual} às ${horaAtual}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESUMO DE CUSTOS
• Total de Custos: R$ ${custosTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
• Quantidade de Registros: ${custos.length}

CUSTOS POR CATEGORIA
${custoStats.map((c) => `• ${c.categoria}: R$ ${c.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`).join("\n")}

HISTÓRICO DE CUSTOS
${custos.map((c) => `• ${c.data} - ${c.descricao} - ${c.categoria} - R$ ${c.valor.toLocaleString("pt-BR")}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Relatório gerado pelo Fazenda Digital
        `.trim();

      case "desempenho":
        const arrobaMedia = totalAnimais > 0 ? (totalArrobas / totalAnimais).toFixed(2) : "0";
        const margemLucro = faturamentoTotal > 0 ? ((lucroTotal / faturamentoTotal) * 100).toFixed(1) : "0";
        return `
FAZENDA DIGITAL - DESEMPENHO DO REBANHO
Data: ${dataAtual} às ${horaAtual}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INDICADORES DE PRODUTIVIDADE
• Peso Médio: ${mediaPeso} kg
• Arrobas Médias/Cabeça: ${arrobaMedia}@
• Total de Arrobas: ${totalArrobas}@

INDICADORES FINANCEIROS
• Faturamento: R$ ${faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
• Custos: R$ ${custosTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
• Lucro: R$ ${lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
• Margem de Lucro: ${margemLucro}%

COMPOSIÇÃO DO REBANHO
• Bois: ${animalStats.bois.length} (${totalAnimais > 0 ? ((animalStats.bois.length / totalAnimais) * 100).toFixed(1) : 0}%)
• Vacas: ${animalStats.vacas.length} (${totalAnimais > 0 ? ((animalStats.vacas.length / totalAnimais) * 100).toFixed(1) : 0}%)
• Bezerros: ${animalStats.bezerros.length} (${totalAnimais > 0 ? ((animalStats.bezerros.length / totalAnimais) * 100).toFixed(1) : 0}%)
• Novilhas: ${animalStats.novilhas.length} (${totalAnimais > 0 ? ((animalStats.novilhas.length / totalAnimais) * 100).toFixed(1) : 0}%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Relatório gerado pelo Fazenda Digital
        `.trim();

      default:
        return "";
    }
  };

  const shareReport = async (content: string) => {
    try {
      await Share.share({
        message: content,
        title: "Relatório Fazenda Digital",
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível compartilhar o relatório");
    }
  };

  const renderReportPreview = () => {
    if (!selectedReport) return null;

    const report = REPORTS.find((r) => r.id === selectedReport);
    if (!report) return null;

    return (
      <ScrollView style={styles.previewContainer} showsVerticalScrollIndicator={false}>
        <View style={[styles.previewHeader, { backgroundColor: report.color + "15" }]}>
          <MaterialIcons name={report.icon as any} size={40} color={report.color} />
          <Text style={[styles.previewTitle, { color: report.color }]}>{report.title}</Text>
          <Text style={styles.previewDate}>
            {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}
          </Text>
        </View>

        {selectedReport === "inventario" && (
          <View style={styles.previewContent}>
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Resumo do Rebanho</Text>
              <View style={styles.previewGrid}>
                <View style={styles.previewGridItem}>
                  <Text style={styles.previewGridValue}>{totalAnimais}</Text>
                  <Text style={styles.previewGridLabel}>Cabeças</Text>
                </View>
                <View style={styles.previewGridItem}>
                  <Text style={styles.previewGridValue}>{totalArrobas}@</Text>
                  <Text style={styles.previewGridLabel}>Arrobas</Text>
                </View>
                <View style={styles.previewGridItem}>
                  <Text style={styles.previewGridValue}>{mediaPeso} kg</Text>
                  <Text style={styles.previewGridLabel}>Peso Médio</Text>
                </View>
              </View>
            </View>

            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Composição</Text>
              <View style={styles.previewList}>
                <View style={styles.previewListItem}>
                  <Text style={styles.previewListLabel}>Bois</Text>
                  <Text style={styles.previewListValue}>{animalStats.bois.length}</Text>
                </View>
                <View style={styles.previewListItem}>
                  <Text style={styles.previewListLabel}>Vacas</Text>
                  <Text style={styles.previewListValue}>{animalStats.vacas.length}</Text>
                </View>
                <View style={styles.previewListItem}>
                  <Text style={styles.previewListLabel}>Bezerros</Text>
                  <Text style={styles.previewListValue}>{animalStats.bezerros.length}</Text>
                </View>
                <View style={styles.previewListItem}>
                  <Text style={styles.previewListLabel}>Novilhas</Text>
                  <Text style={styles.previewListValue}>{animalStats.novilhas.length}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {selectedReport === "vendas" && (
          <View style={styles.previewContent}>
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Resumo Financeiro</Text>
              <View style={styles.previewHighlight}>
                <Text style={styles.previewHighlightLabel}>Faturamento Total</Text>
                <Text style={[styles.previewHighlightValue, { color: COLORS.success }]}>
                  R$ {faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.previewGrid}>
                <View style={styles.previewGridItem}>
                  <Text style={styles.previewGridValue}>{vendas.length}</Text>
                  <Text style={styles.previewGridLabel}>Vendas</Text>
                </View>
                <View style={styles.previewGridItem}>
                  <Text style={styles.previewGridValue}>
                    {vendas.reduce((acc, v) => acc + v.quantidadeAnimais, 0)}
                  </Text>
                  <Text style={styles.previewGridLabel}>Animais Vendidos</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {selectedReport === "custos" && (
          <View style={styles.previewContent}>
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Resumo de Custos</Text>
              <View style={styles.previewHighlight}>
                <Text style={styles.previewHighlightLabel}>Total de Custos</Text>
                <Text style={[styles.previewHighlightValue, { color: COLORS.danger }]}>
                  R$ {custosTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Por Categoria</Text>
              <View style={styles.previewList}>
                {custoStats.map((c) => (
                  <View key={c.categoria} style={styles.previewListItem}>
                    <Text style={styles.previewListLabel}>{c.categoria}</Text>
                    <Text style={styles.previewListValue}>
                      R$ {c.total.toLocaleString("pt-BR")}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {selectedReport === "desempenho" && (
          <View style={styles.previewContent}>
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Indicadores Financeiros</Text>
              <View style={styles.previewList}>
                <View style={styles.previewListItem}>
                  <Text style={styles.previewListLabel}>Faturamento</Text>
                  <Text style={[styles.previewListValue, { color: COLORS.success }]}>
                    R$ {faturamentoTotal.toLocaleString("pt-BR")}
                  </Text>
                </View>
                <View style={styles.previewListItem}>
                  <Text style={styles.previewListLabel}>Custos</Text>
                  <Text style={[styles.previewListValue, { color: COLORS.danger }]}>
                    R$ {custosTotal.toLocaleString("pt-BR")}
                  </Text>
                </View>
                <View style={styles.previewListItem}>
                  <Text style={styles.previewListLabel}>Lucro</Text>
                  <Text
                    style={[
                      styles.previewListValue,
                      { color: lucroTotal >= 0 ? COLORS.success : COLORS.danger },
                    ]}
                  >
                    R$ {lucroTotal.toLocaleString("pt-BR")}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Indicadores de Produtividade</Text>
              <View style={styles.previewGrid}>
                <View style={styles.previewGridItem}>
                  <Text style={styles.previewGridValue}>{mediaPeso} kg</Text>
                  <Text style={styles.previewGridLabel}>Peso Médio</Text>
                </View>
                <View style={styles.previewGridItem}>
                  <Text style={styles.previewGridValue}>
                    {totalAnimais > 0 ? (totalArrobas / totalAnimais).toFixed(1) : 0}@
                  </Text>
                  <Text style={styles.previewGridLabel}>@/Cabeça</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Relatórios</Text>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Cards de Relatórios */}
          <Text style={styles.sectionTitle}>Gerar Relatório</Text>

          {REPORTS.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => openReport(report.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.reportIconContainer,
                  { backgroundColor: report.color + "15" },
                ]}
              >
                <MaterialIcons name={report.icon as any} size={28} color={report.color} />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportDescription}>{report.description}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          ))}

          {/* Resumo Rápido */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Resumo Rápido</Text>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialIcons name="pets" size={24} color={COLORS.primary} />
                <Text style={styles.summaryValue}>{totalAnimais}</Text>
                <Text style={styles.summaryLabel}>Cabeças</Text>
              </View>
              <View style={styles.summaryItem}>
                <MaterialIcons name="fitness-center" size={24} color={COLORS.secondary} />
                <Text style={styles.summaryValue}>{totalArrobas}@</Text>
                <Text style={styles.summaryLabel}>Arrobas</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialIcons name="trending-up" size={24} color={COLORS.success} />
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  R$ {(faturamentoTotal / 1000).toFixed(1)}k
                </Text>
                <Text style={styles.summaryLabel}>Faturamento</Text>
              </View>
              <View style={styles.summaryItem}>
                <MaterialIcons name="trending-down" size={24} color={COLORS.danger} />
                <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
                  R$ {(custosTotal / 1000).toFixed(1)}k
                </Text>
                <Text style={styles.summaryLabel}>Custos</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Modal de Visualização do Relatório */}
        <Modal visible={showReportModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLine} />
                <Text style={styles.modalTitle}>
                  {REPORTS.find((r) => r.id === selectedReport)?.title}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowReportModal(false)}
                >
                  <MaterialIcons name="close" size={24} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              {renderReportPreview()}

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.generateButton, generating && styles.generateButtonDisabled]}
                  onPress={generateReport}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <MaterialIcons name="description" size={20} color={COLORS.white} />
                      <Text style={styles.generateButtonText}>Gerar e Compartilhar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  reportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reportIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  reportInfo: {
    flex: 1,
    marginLeft: 14,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 13,
    color: COLORS.gray,
  },
  summaryContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
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
    maxHeight: "90%",
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderLine: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: 2,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  modalCloseBtn: {
    position: "absolute",
    right: 20,
    top: 16,
    padding: 8,
  },
  previewContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  previewHeader: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
  },
  previewDate: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 4,
  },
  previewContent: {
    marginTop: 16,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  previewGrid: {
    flexDirection: "row",
    gap: 12,
  },
  previewGridItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  previewGridValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  previewGridLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  previewHighlight: {
    backgroundColor: COLORS.background,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  previewHighlightLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  previewHighlightValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  previewList: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  previewListLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  previewListValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
});
