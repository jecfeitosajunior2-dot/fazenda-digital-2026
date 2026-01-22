import { useData, Custo } from "@/lib/data-context";
import { ScreenContainer } from "@/components/screen-container";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

const CATEGORIAS: Custo["categoria"][] = [
  "Alimentação",
  "Veterinário",
  "Manutenção",
  "Mão de Obra",
  "Outros",
];

const CATEGORIA_ICONS: Record<Custo["categoria"], string> = {
  "Alimentação": "restaurant",
  "Veterinário": "medical-services",
  "Manutenção": "build",
  "Mão de Obra": "people",
  "Outros": "more-horiz",
};

const CATEGORIA_COLORS: Record<Custo["categoria"], string> = {
  "Alimentação": "#E9C46A",
  "Veterinário": "#E63946",
  "Manutenção": "#457B9D",
  "Mão de Obra": "#2D6A4F",
  "Outros": "#6C757D",
};

export default function CustosScreen() {
  const { custos, addCusto, deleteCusto, custosTotal, loading } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<Custo["categoria"]>("Alimentação");
  const [saving, setSaving] = useState(false);

  // Custos por categoria
  const custosPorCategoria = useMemo(() => {
    const result: Record<string, number> = {};
    CATEGORIAS.forEach((cat) => {
      result[cat] = custos
        .filter((c) => c.categoria === cat)
        .reduce((acc, c) => acc + (c.valor || 0), 0);
    });
    return result;
  }, [custos]);

  const handleSave = async () => {
    if (!descricao.trim()) {
      Alert.alert("Erro", "A descrição é obrigatória");
      return;
    }
    if (!valor || Number(valor) <= 0) {
      Alert.alert("Erro", "Informe um valor válido");
      return;
    }

    setSaving(true);
    try {
      await addCusto({
        descricao: descricao.trim(),
        valor: Number(valor),
        categoria,
        data: new Date().toLocaleDateString("pt-BR"),
      });
      Alert.alert("Sucesso", "Custo registrado com sucesso!");
      resetAndClose();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível registrar o custo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (custo: Custo) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Deseja excluir o custo "${custo.descricao}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await deleteCusto(custo.id);
            Alert.alert("Sucesso", "Custo excluído com sucesso!");
          },
        },
      ]
    );
  };

  const resetAndClose = () => {
    setDescricao("");
    setValor("");
    setCategoria("Alimentação");
    setShowAddModal(false);
  };

  const renderCustoItem = ({ item }: { item: Custo }) => (
    <View style={styles.custoCard}>
      <View
        style={[
          styles.custoIconContainer,
          { backgroundColor: CATEGORIA_COLORS[item.categoria] + "20" },
        ]}
      >
        <MaterialIcons
          name={CATEGORIA_ICONS[item.categoria] as any}
          size={24}
          color={CATEGORIA_COLORS[item.categoria]}
        />
      </View>
      <View style={styles.custoInfo}>
        <Text style={styles.custoDescricao}>{item.descricao}</Text>
        <View style={styles.custoMeta}>
          <View
            style={[
              styles.categoriaBadge,
              { backgroundColor: CATEGORIA_COLORS[item.categoria] + "15" },
            ]}
          >
            <Text
              style={[
                styles.categoriaBadgeText,
                { color: CATEGORIA_COLORS[item.categoria] },
              ]}
            >
              {item.categoria}
            </Text>
          </View>
          <Text style={styles.custoData}>{item.data}</Text>
        </View>
      </View>
      <View style={styles.custoActions}>
        <Text style={styles.custoValor}>
          -R$ {item.valor.toLocaleString("pt-BR")}
        </Text>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item)}
        >
          <MaterialIcons name="delete" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Custos</Text>
        </View>

        {/* Card Total */}
        <View style={styles.totalCard}>
          <MaterialIcons name="trending-down" size={28} color={COLORS.danger} />
          <Text style={styles.totalValue}>
            R$ {custosTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.totalLabel}>Total de Custos</Text>
        </View>

        {/* Custos por Categoria */}
        <Text style={styles.sectionTitle}>Por Categoria</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriaScrollView}
          contentContainerStyle={styles.categoriaContent}
        >
          {CATEGORIAS.map((cat) => (
            <View
              key={cat}
              style={[
                styles.categoriaCard,
                { borderLeftColor: CATEGORIA_COLORS[cat] },
              ]}
            >
              <MaterialIcons
                name={CATEGORIA_ICONS[cat] as any}
                size={20}
                color={CATEGORIA_COLORS[cat]}
              />
              <Text style={styles.categoriaCardValue}>
                R$ {custosPorCategoria[cat].toLocaleString("pt-BR")}
              </Text>
              <Text style={styles.categoriaCardLabel}>{cat}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Lista de Custos */}
        <Text style={styles.sectionTitle}>Histórico</Text>
        <FlatList
          data={custos.slice().reverse()}
          keyExtractor={(item) => item.id}
          renderItem={renderCustoItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt-long" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>Nenhum custo registrado</Text>
              <Text style={styles.emptySubtext}>
                Toque no botão + para registrar um custo
              </Text>
            </View>
          }
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>

        {/* Modal de Novo Custo */}
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLine} />
                <Text style={styles.modalTitle}>Novo Custo</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={resetAndClose}
                >
                  <MaterialIcons name="close" size={24} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Descrição */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Descrição *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ex: Compra de ração"
                    placeholderTextColor={COLORS.gray}
                    value={descricao}
                    onChangeText={setDescricao}
                  />
                </View>

                {/* Valor */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Valor (R$) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0,00"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="numeric"
                    value={valor}
                    onChangeText={setValor}
                  />
                </View>

                {/* Categoria */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Categoria</Text>
                  <View style={styles.selectContainer}>
                    {CATEGORIAS.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.selectOption,
                          categoria === cat && {
                            backgroundColor: CATEGORIA_COLORS[cat],
                            borderColor: CATEGORIA_COLORS[cat],
                          },
                        ]}
                        onPress={() => setCategoria(cat)}
                      >
                        <MaterialIcons
                          name={CATEGORIA_ICONS[cat] as any}
                          size={16}
                          color={categoria === cat ? COLORS.white : COLORS.gray}
                        />
                        <Text
                          style={[
                            styles.selectOptionText,
                            categoria === cat && styles.selectOptionTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Botão Salvar */}
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Registrar Custo</Text>
                  )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
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
  totalCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.danger,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  categoriaScrollView: {
    maxHeight: 110,
  },
  categoriaContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoriaCard: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    width: 120,
    borderLeftWidth: 4,
    marginRight: 10,
  },
  categoriaCardValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 8,
  },
  categoriaCardLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  custoCard: {
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
  custoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  custoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  custoDescricao: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  custoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoriaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoriaBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  custoData: {
    fontSize: 12,
    color: COLORS.gray,
  },
  custoActions: {
    alignItems: "flex-end",
  },
  custoValor: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.danger,
    marginBottom: 4,
  },
  deleteBtn: {
    padding: 4,
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
    maxHeight: "85%",
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
  selectContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  selectOptionText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.gray,
  },
  selectOptionTextActive: {
    color: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
});
