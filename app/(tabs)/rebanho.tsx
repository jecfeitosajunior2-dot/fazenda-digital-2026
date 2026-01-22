import { useData, Animal } from "@/lib/data-context";
import { ScreenContainer } from "@/components/screen-container";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
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

const CATEGORIAS = ["Todos", "Boi", "Vaca", "Bezerro", "Novilha"] as const;
const STATUS_OPTIONS = ["Saudável", "Em tratamento", "Observação"] as const;

type NovoAnimalState = {
  identificador: string;
  categoria: Animal["categoria"];
  raca: string;
  peso: string;
  lote: string;
  status: Animal["status"];
  foto?: string;
};

const initialAnimalState: NovoAnimalState = {
  identificador: "",
  categoria: "Boi",
  raca: "",
  peso: "",
  lote: "",
  status: "Saudável",
  foto: undefined,
};

export default function RebanhoScreen() {
  const { animais, addAnimal, updateAnimal, deleteAnimal, loading } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [novoAnimal, setNovoAnimal] = useState<NovoAnimalState>(initialAnimalState);
  const [saving, setSaving] = useState(false);

  // Filtrar animais
  const filteredAnimais = useMemo(() => {
    return animais.filter((animal) => {
      const matchesSearch =
        animal.identificador.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.raca.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "Todos" || animal.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [animais, searchQuery, selectedCategory]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = filteredAnimais.length;
    const pesoTotal = filteredAnimais.reduce((acc, a) => acc + (a.peso || 0), 0);
    const arrobas = Math.round(pesoTotal / 30);
    return { total, pesoTotal, arrobas };
  }, [filteredAnimais]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      setNovoAnimal({ ...novoAnimal, foto: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    if (!novoAnimal.identificador.trim()) {
      Alert.alert("Erro", "O identificador é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const animalData = {
        identificador: novoAnimal.identificador.trim(),
        categoria: novoAnimal.categoria,
        raca: novoAnimal.raca.trim() || "Sem raça",
        peso: Number(novoAnimal.peso) || 0,
        lote: novoAnimal.lote.trim() || "Sem lote",
        status: novoAnimal.status,
        foto: novoAnimal.foto,
      };

      if (editingAnimal) {
        await updateAnimal(editingAnimal.id, animalData);
        Alert.alert("Sucesso", "Animal atualizado com sucesso!");
      } else {
        await addAnimal(animalData);
        Alert.alert("Sucesso", "Animal cadastrado com sucesso!");
      }

      resetAndClose();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar o animal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (animal: Animal) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Deseja realmente excluir o animal ${animal.identificador}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await deleteAnimal(animal.id);
            Alert.alert("Sucesso", "Animal excluído com sucesso!");
          },
        },
      ]
    );
  };

  const handleEdit = (animal: Animal) => {
    setEditingAnimal(animal);
    setNovoAnimal({
      identificador: animal.identificador,
      categoria: animal.categoria,
      raca: animal.raca,
      peso: animal.peso.toString(),
      lote: animal.lote,
      status: animal.status,
      foto: animal.foto,
    });
    setShowAddModal(true);
  };

  const resetAndClose = () => {
    setNovoAnimal(initialAnimalState);
    setEditingAnimal(null);
    setShowAddModal(false);
  };

  const renderAnimalItem = ({ item }: { item: Animal }) => (
    <TouchableOpacity
      style={styles.animalCard}
      onPress={() => handleEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.animalContent}>
        {item.foto ? (
          <Image source={{ uri: item.foto }} style={styles.animalPhoto} />
        ) : (
          <View style={styles.animalPhotoPlaceholder}>
            <MaterialIcons name="pets" size={24} color={COLORS.gray} />
          </View>
        )}
        <View style={styles.animalInfo}>
          <Text style={styles.animalId}>{item.identificador}</Text>
          <Text style={styles.animalDetails}>
            {item.categoria} • {item.raca} • {item.peso} kg
          </Text>
          <View style={styles.animalMeta}>
            <View style={styles.loteBadge}>
              <MaterialIcons name="layers" size={12} color={COLORS.gray} />
              <Text style={styles.loteText}>{item.lote}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === "Saudável"
                      ? COLORS.success + "20"
                      : item.status === "Em tratamento"
                      ? COLORS.warning + "20"
                      : COLORS.danger + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      item.status === "Saudável"
                        ? COLORS.success
                        : item.status === "Em tratamento"
                        ? COLORS.warning
                        : COLORS.danger,
                  },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.animalActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDelete(item)}
        >
          <MaterialIcons name="delete" size={20} color={COLORS.danger} />
        </TouchableOpacity>
        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray} />
      </View>
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Rebanho</Text>
          <View style={styles.headerStats}>
            <Text style={styles.headerStatsText}>
              {stats.total} cabeças • {stats.arrobas}@
            </Text>
          </View>
        </View>

        {/* Barra de Busca */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por identificador ou raça..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros de Categoria */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterBtn,
                selectedCategory === cat && styles.filterBtnActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  selectedCategory === cat && styles.filterBtnTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de Animais */}
        <FlatList
          data={filteredAnimais}
          keyExtractor={(item) => item.id}
          renderItem={renderAnimalItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="pets" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>Nenhum animal encontrado</Text>
              <Text style={styles.emptySubtext}>
                Toque no botão + para cadastrar
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

        {/* Modal de Cadastro/Edição */}
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLine} />
                <Text style={styles.modalTitle}>
                  {editingAnimal ? "Editar Animal" : "Novo Animal"}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={resetAndClose}
                >
                  <MaterialIcons name="close" size={24} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Foto */}
                <TouchableOpacity style={styles.photoPickerBtn} onPress={pickImage}>
                  {novoAnimal.foto ? (
                    <Image
                      source={{ uri: novoAnimal.foto }}
                      style={styles.photoPreview}
                    />
                  ) : (
                    <>
                      <MaterialIcons name="camera-alt" size={32} color={COLORS.gray} />
                      <Text style={styles.photoPickerText}>Adicionar Foto</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Identificador */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Identificador *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ex: BOI-001"
                    placeholderTextColor={COLORS.gray}
                    value={novoAnimal.identificador}
                    onChangeText={(t) =>
                      setNovoAnimal({ ...novoAnimal, identificador: t })
                    }
                  />
                </View>

                {/* Categoria */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Categoria</Text>
                  <View style={styles.selectContainer}>
                    {(["Boi", "Vaca", "Bezerro", "Novilha"] as const).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.selectOption,
                          novoAnimal.categoria === cat && styles.selectOptionActive,
                        ]}
                        onPress={() =>
                          setNovoAnimal({ ...novoAnimal, categoria: cat })
                        }
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            novoAnimal.categoria === cat &&
                              styles.selectOptionTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Raça */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Raça</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ex: Nelore"
                    placeholderTextColor={COLORS.gray}
                    value={novoAnimal.raca}
                    onChangeText={(t) => setNovoAnimal({ ...novoAnimal, raca: t })}
                  />
                </View>

                {/* Peso */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Peso (kg)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ex: 450"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="numeric"
                    value={novoAnimal.peso}
                    onChangeText={(t) => setNovoAnimal({ ...novoAnimal, peso: t })}
                  />
                </View>

                {/* Lote */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Lote</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ex: A"
                    placeholderTextColor={COLORS.gray}
                    value={novoAnimal.lote}
                    onChangeText={(t) => setNovoAnimal({ ...novoAnimal, lote: t })}
                  />
                </View>

                {/* Status */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Status Sanitário</Text>
                  <View style={styles.selectContainer}>
                    {STATUS_OPTIONS.map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.selectOption,
                          novoAnimal.status === st && styles.selectOptionActive,
                        ]}
                        onPress={() => setNovoAnimal({ ...novoAnimal, status: st })}
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            novoAnimal.status === st &&
                              styles.selectOptionTextActive,
                          ]}
                        >
                          {st}
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
                    <Text style={styles.saveButtonText}>
                      {editingAnimal ? "Salvar Alterações" : "Cadastrar Animal"}
                    </Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  headerStats: {
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerStatsText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  filterContainer: {
    marginTop: 12,
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray,
  },
  filterBtnTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  animalCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  animalContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  animalPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.lightGray,
  },
  animalPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  animalInfo: {
    marginLeft: 14,
    flex: 1,
  },
  animalId: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 2,
  },
  animalDetails: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 6,
  },
  animalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  loteText: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  animalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    padding: 8,
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
  photoPickerBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPickerText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectOptionText: {
    fontSize: 14,
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
