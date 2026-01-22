import { useData, Animal, Venda } from "@/lib/data-context";
import { ScreenContainer } from "@/components/screen-container";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  border: "#DEE2E6",
  text: "#212529",
};

export default function VendasScreen() {
  const { animais, vendas, addVenda, deleteVenda, faturamentoTotal, loading } = useData();
  const [showVendaModal, setShowVendaModal] = useState(false);
  const [selectedAnimais, setSelectedAnimais] = useState<string[]>([]);
  const [precoArroba, setPrecoArroba] = useState("280");
  const [comprador, setComprador] = useState("");
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Calcular totais da venda
  const vendaStats = useMemo(() => {
    const animaisSelecionados = animais.filter((a) => selectedAnimais.includes(a.id));
    const pesoTotal = animaisSelecionados.reduce((acc, a) => acc + (a.peso || 0), 0);
    const arrobas = pesoTotal / 30;
    const valor = arrobas * (Number(precoArroba) || 0);
    return {
      quantidade: animaisSelecionados.length,
      pesoTotal,
      arrobas,
      valor,
    };
  }, [selectedAnimais, animais, precoArroba]);

  // Estatísticas do mês
  const statsDoMes = useMemo(() => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const vendasDoMes = vendas.filter((v) => {
      const [dia, mes, ano] = v.data.split("/").map(Number);
      const dataVenda = new Date(ano || anoAtual, (mes || 1) - 1, dia || 1);
      return dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual;
    });

    const faturamentoMes = vendasDoMes.reduce((acc, v) => acc + (v.valorTotal || 0), 0);
    const animaisVendidos = vendasDoMes.reduce((acc, v) => acc + (v.quantidadeAnimais || 0), 0);

    return {
      vendasDoMes: vendasDoMes.length,
      faturamentoMes,
      animaisVendidos,
    };
  }, [vendas]);

  const toggleAnimalSelection = (id: string) => {
    setSelectedAnimais((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const finalizarVenda = async () => {
    if (selectedAnimais.length === 0) {
      Alert.alert("Erro", "Selecione pelo menos um animal");
      return;
    }

    setSaving(true);
    try {
      const novaVenda: Omit<Venda, "id"> = {
        animais: selectedAnimais,
        quantidadeAnimais: vendaStats.quantidade,
        pesoTotal: vendaStats.pesoTotal,
        arrobas: vendaStats.arrobas,
        precoArroba: Number(precoArroba),
        valorTotal: vendaStats.valor,
        comprador: comprador.trim() || undefined,
        data: new Date().toLocaleDateString("pt-BR"),
      };

      await addVenda(novaVenda);
      Alert.alert(
        "Venda Registrada!",
        `${vendaStats.quantidade} animais vendidos por R$ ${vendaStats.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      );
      resetAndClose();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível registrar a venda");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVenda = (venda: Venda) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Deseja excluir esta venda de ${venda.quantidadeAnimais} animais?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await deleteVenda(venda.id);
            Alert.alert("Sucesso", "Venda excluída com sucesso!");
          },
        },
      ]
    );
  };

  const resetAndClose = () => {
    setSelectedAnimais([]);
    setPrecoArroba("280");
    setComprador("");
    setStep(1);
    setShowVendaModal(false);
  };

  const renderVendaItem = ({ item }: { item: Venda }) => (
    <View style={styles.vendaCard}>
      <View style={styles.vendaHeader}>
        <View style={styles.vendaIconContainer}>
          <MaterialIcons name="check-circle" size={24} color={COLORS.success} />
        </View>
        <View style={styles.vendaInfo}>
          <Text style={styles.vendaTitle}>
            {item.quantidadeAnimais} {item.quantidadeAnimais === 1 ? "Animal" : "Animais"}
          </Text>
          <Text style={styles.vendaDate}>{item.data}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteVenda(item)}
        >
          <MaterialIcons name="delete" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
      <View style={styles.vendaDetails}>
        <View style={styles.vendaDetailItem}>
          <Text style={styles.vendaDetailLabel}>Peso Total</Text>
          <Text style={styles.vendaDetailValue}>{item.pesoTotal.toLocaleString("pt-BR")} kg</Text>
        </View>
        <View style={styles.vendaDetailItem}>
          <Text style={styles.vendaDetailLabel}>Arrobas</Text>
          <Text style={styles.vendaDetailValue}>{item.arrobas.toFixed(1)} @</Text>
        </View>
        <View style={styles.vendaDetailItem}>
          <Text style={styles.vendaDetailLabel}>Preço/@</Text>
          <Text style={styles.vendaDetailValue}>R$ {item.precoArroba}</Text>
        </View>
      </View>
      <View style={styles.vendaTotal}>
        <Text style={styles.vendaTotalLabel}>Valor Total</Text>
        <Text style={styles.vendaTotalValue}>
          R$ {item.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </Text>
      </View>
      {item.comprador && (
        <View style={styles.vendaComprador}>
          <MaterialIcons name="business" size={14} color={COLORS.gray} />
          <Text style={styles.vendaCompradorText}>{item.comprador}</Text>
        </View>
      )}
    </View>
  );

  const renderAnimalSelectionItem = ({ item }: { item: Animal }) => {
    const isSelected = selectedAnimais.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.animalSelectCard, isSelected && styles.animalSelectCardActive]}
        onPress={() => toggleAnimalSelection(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.animalSelectContent}>
          {item.foto ? (
            <Image source={{ uri: item.foto }} style={styles.animalSelectPhoto} />
          ) : (
            <View style={styles.animalSelectPhotoPlaceholder}>
              <MaterialIcons name="pets" size={20} color={COLORS.gray} />
            </View>
          )}
          <View style={styles.animalSelectInfo}>
            <Text style={styles.animalSelectId}>{item.identificador}</Text>
            <Text style={styles.animalSelectDetails}>
              {item.categoria} • {item.peso} kg • {(item.peso / 30).toFixed(1)}@
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxActive,
          ]}
        >
          {isSelected && <MaterialIcons name="check" size={16} color={COLORS.white} />}
        </View>
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Vendas</Text>
        </View>

        {/* Cards de Resumo */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="trending-up" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>
              R$ {faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.statLabel}>Faturamento Total</Text>
          </View>
          <View style={styles.statCardRow}>
            <View style={[styles.statCardSmall, { backgroundColor: COLORS.primary + "10" }]}>
              <Text style={styles.statSmallValue}>{vendas.length}</Text>
              <Text style={styles.statSmallLabel}>Vendas</Text>
            </View>
            <View style={[styles.statCardSmall, { backgroundColor: COLORS.gold + "20" }]}>
              <Text style={styles.statSmallValue}>{statsDoMes.animaisVendidos}</Text>
              <Text style={styles.statSmallLabel}>Animais Vendidos</Text>
            </View>
          </View>
        </View>

        {/* Lista de Vendas */}
        <Text style={styles.sectionTitle}>Histórico de Vendas</Text>
        <FlatList
          data={vendas.slice().reverse()}
          keyExtractor={(item) => item.id}
          renderItem={renderVendaItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="attach-money" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>Nenhuma venda registrada</Text>
              <Text style={styles.emptySubtext}>Toque no botão + para registrar uma venda</Text>
            </View>
          }
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowVendaModal(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>

        {/* Modal de Nova Venda */}
        <Modal visible={showVendaModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLine} />
                <Text style={styles.modalTitle}>
                  {step === 1 ? "Selecionar Animais" : "Finalizar Venda"}
                </Text>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={resetAndClose}>
                  <MaterialIcons name="close" size={24} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              {step === 1 ? (
                <>
                  {/* Step 1: Seleção de Animais */}
                  <View style={styles.selectionInfo}>
                    <Text style={styles.selectionInfoText}>
                      {selectedAnimais.length} de {animais.length} selecionados
                    </Text>
                    {selectedAnimais.length > 0 && (
                      <TouchableOpacity onPress={() => setSelectedAnimais([])}>
                        <Text style={styles.clearSelectionText}>Limpar</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <FlatList
                    data={animais}
                    keyExtractor={(item) => item.id}
                    renderItem={renderAnimalSelectionItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nenhum animal disponível</Text>
                      </View>
                    }
                  />

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      selectedAnimais.length === 0 && styles.saveButtonDisabled,
                    ]}
                    onPress={() => setStep(2)}
                    disabled={selectedAnimais.length === 0}
                  >
                    <Text style={styles.saveButtonText}>
                      Continuar ({selectedAnimais.length} animais)
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Step 2: Finalização */}
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.vendaResumo}>
                      <View style={styles.vendaResumoItem}>
                        <Text style={styles.vendaResumoLabel}>Animais:</Text>
                        <Text style={styles.vendaResumoValue}>{vendaStats.quantidade}</Text>
                      </View>
                      <View style={styles.vendaResumoItem}>
                        <Text style={styles.vendaResumoLabel}>Peso Total:</Text>
                        <Text style={styles.vendaResumoValue}>
                          {vendaStats.pesoTotal.toLocaleString("pt-BR")} kg
                        </Text>
                      </View>
                      <View style={styles.vendaResumoItem}>
                        <Text style={styles.vendaResumoLabel}>Total Arrobas:</Text>
                        <Text style={styles.vendaResumoValue}>
                          {vendaStats.arrobas.toFixed(2)} @
                        </Text>
                      </View>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Preço da Arroba (R$)</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="280"
                        placeholderTextColor={COLORS.gray}
                        keyboardType="numeric"
                        value={precoArroba}
                        onChangeText={setPrecoArroba}
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Comprador (opcional)</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Ex: Frigorífico JBS"
                        placeholderTextColor={COLORS.gray}
                        value={comprador}
                        onChangeText={setComprador}
                      />
                    </View>

                    <View style={styles.vendaTotalBox}>
                      <Text style={styles.vendaTotalBoxLabel}>VALOR TOTAL</Text>
                      <Text style={styles.vendaTotalBoxValue}>
                        R$ {vendaStats.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </Text>
                    </View>

                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={[styles.saveButton, styles.secondaryButton]}
                        onPress={() => setStep(1)}
                      >
                        <Text style={[styles.saveButtonText, { color: COLORS.gray }]}>Voltar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveButton, styles.primaryButton, saving && styles.saveButtonDisabled]}
                        onPress={finalizarVenda}
                        disabled={saving}
                      >
                        {saving ? (
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <Text style={styles.saveButtonText}>Finalizar Venda</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </>
              )}
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
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.success,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  statCardRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCardSmall: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statSmallValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  statSmallLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  vendaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vendaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  vendaIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.success + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  vendaInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vendaTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  vendaDate: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  vendaDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  vendaDetailItem: {
    alignItems: "center",
  },
  vendaDetailLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 4,
  },
  vendaDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  vendaTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  vendaTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
  },
  vendaTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.success,
  },
  vendaComprador: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  vendaCompradorText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
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
    right: 0,
    top: 16,
    padding: 8,
  },
  selectionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectionInfoText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  clearSelectionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  animalSelectCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  animalSelectCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  animalSelectContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  animalSelectPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  animalSelectPhotoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  animalSelectInfo: {
    marginLeft: 12,
    flex: 1,
  },
  animalSelectId: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  animalSelectDetails: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  vendaResumo: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  vendaResumoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  vendaResumoLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  vendaResumoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  vendaTotalBox: {
    backgroundColor: COLORS.success + "15",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  vendaTotalBoxLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.success,
    marginBottom: 4,
  },
  vendaTotalBoxValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.success,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.lightGray,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
});
