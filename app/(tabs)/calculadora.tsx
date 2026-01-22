import { ScreenContainer } from "@/components/screen-container";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useState, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
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

type CalculatorType = "arroba" | "gmd" | "valor" | "conversao" | "projecao";

interface CalculatorConfig {
  id: CalculatorType;
  title: string;
  icon: string;
  description: string;
  color: string;
}

const CALCULATORS: CalculatorConfig[] = [
  {
    id: "arroba",
    title: "Peso → Arrobas",
    icon: "fitness-center",
    description: "Converta kg para arrobas",
    color: COLORS.primary,
  },
  {
    id: "gmd",
    title: "GMD",
    icon: "trending-up",
    description: "Ganho médio diário",
    color: COLORS.success,
  },
  {
    id: "valor",
    title: "Valor do Animal",
    icon: "attach-money",
    description: "Calcule o valor de venda",
    color: COLORS.gold,
  },
  {
    id: "conversao",
    title: "Conversão Alimentar",
    icon: "restaurant",
    description: "Eficiência alimentar",
    color: COLORS.accent,
  },
  {
    id: "projecao",
    title: "Projeção de Peso",
    icon: "schedule",
    description: "Estime peso futuro",
    color: COLORS.info,
  },
];

export default function CalculadoraScreen() {
  const [selectedCalc, setSelectedCalc] = useState<CalculatorType>("arroba");

  // Arroba calculator
  const [pesoKg, setPesoKg] = useState("");

  // GMD calculator
  const [pesoInicial, setPesoInicial] = useState("");
  const [pesoFinal, setPesoFinal] = useState("");
  const [diasConfinamento, setDiasConfinamento] = useState("");

  // Valor calculator
  const [pesoAnimal, setPesoAnimal] = useState("");
  const [precoArroba, setPrecoArroba] = useState("280");
  const [rendimentoCarcaca, setRendimentoCarcaca] = useState("52");

  // Conversão alimentar
  const [consumoRacao, setConsumoRacao] = useState("");
  const [ganhoPeso, setGanhoPeso] = useState("");

  // Projeção
  const [pesoAtual, setPesoAtual] = useState("");
  const [gmdProjecao, setGmdProjecao] = useState("");
  const [diasProjecao, setDiasProjecao] = useState("");

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Cálculos
  const arrobaResult = useMemo(() => {
    const peso = Number(pesoKg);
    if (!peso || peso <= 0) return null;
    const arrobas = peso / 30;
    const arrobasCarcaca = (peso * 0.52) / 15;
    return {
      arrobasVivo: arrobas.toFixed(2),
      arrobasCarcaca: arrobasCarcaca.toFixed(2),
    };
  }, [pesoKg]);

  const gmdResult = useMemo(() => {
    const pi = Number(pesoInicial);
    const pf = Number(pesoFinal);
    const dias = Number(diasConfinamento);
    if (!pi || !pf || !dias || dias <= 0) return null;
    const gmd = (pf - pi) / dias;
    const ganhoTotal = pf - pi;
    return {
      gmd: gmd.toFixed(3),
      ganhoTotal: ganhoTotal.toFixed(1),
      arrobasGanhas: (ganhoTotal / 30).toFixed(2),
    };
  }, [pesoInicial, pesoFinal, diasConfinamento]);

  const valorResult = useMemo(() => {
    const peso = Number(pesoAnimal);
    const preco = Number(precoArroba);
    const rendimento = Number(rendimentoCarcaca) / 100;
    if (!peso || !preco || peso <= 0) return null;
    const pesoCarcaca = peso * rendimento;
    const arrobasCarcaca = pesoCarcaca / 15;
    const valorTotal = arrobasCarcaca * preco;
    return {
      pesoCarcaca: pesoCarcaca.toFixed(1),
      arrobasCarcaca: arrobasCarcaca.toFixed(2),
      valorTotal: valorTotal.toFixed(2),
    };
  }, [pesoAnimal, precoArroba, rendimentoCarcaca]);

  const conversaoResult = useMemo(() => {
    const consumo = Number(consumoRacao);
    const ganho = Number(ganhoPeso);
    if (!consumo || !ganho || ganho <= 0) return null;
    const conversao = consumo / ganho;
    const eficiencia = (ganho / consumo) * 100;
    return {
      conversao: conversao.toFixed(2),
      eficiencia: eficiencia.toFixed(1),
      classificacao:
        conversao <= 5 ? "Excelente" : conversao <= 6 ? "Bom" : conversao <= 7 ? "Regular" : "Ruim",
    };
  }, [consumoRacao, ganhoPeso]);

  const projecaoResult = useMemo(() => {
    const peso = Number(pesoAtual);
    const gmd = Number(gmdProjecao);
    const dias = Number(diasProjecao);
    if (!peso || !gmd || !dias) return null;
    const pesoProjetado = peso + gmd * dias;
    const arrobasProjetadas = pesoProjetado / 30;
    return {
      pesoProjetado: pesoProjetado.toFixed(1),
      arrobasProjetadas: arrobasProjetadas.toFixed(2),
      ganhoTotal: (gmd * dias).toFixed(1),
    };
  }, [pesoAtual, gmdProjecao, diasProjecao]);

  const renderCalculator = () => {
    switch (selectedCalc) {
      case "arroba":
        return (
          <View style={styles.calcContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Peso Vivo (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 450"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
                value={pesoKg}
                onChangeText={setPesoKg}
              />
            </View>

            {arrobaResult && (
              <View style={styles.resultContainer}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Arrobas (peso vivo ÷ 30)</Text>
                  <Text style={styles.resultValue}>{arrobaResult.arrobasVivo} @</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Arrobas carcaça (52% rend.)</Text>
                  <Text style={styles.resultValue}>{arrobaResult.arrobasCarcaca} @</Text>
                </View>
              </View>
            )}

            <View style={styles.infoBox}>
              <MaterialIcons name="info" size={16} color={COLORS.info} />
              <Text style={styles.infoText}>
                1 arroba = 15 kg (carcaça) ou 30 kg (peso vivo)
              </Text>
            </View>
          </View>
        );

      case "gmd":
        return (
          <View style={styles.calcContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Peso Inicial (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 350"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
                value={pesoInicial}
                onChangeText={setPesoInicial}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Peso Final (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 500"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
                value={pesoFinal}
                onChangeText={setPesoFinal}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dias de Confinamento</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 120"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
                value={diasConfinamento}
                onChangeText={setDiasConfinamento}
              />
            </View>

            {gmdResult && (
              <View style={styles.resultContainer}>
                <View style={[styles.resultHighlight, { backgroundColor: COLORS.success + "15" }]}>
                  <Text style={styles.resultHighlightLabel}>GMD</Text>
                  <Text style={[styles.resultHighlightValue, { color: COLORS.success }]}>
                    {gmdResult.gmd} kg/dia
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Ganho Total</Text>
                  <Text style={styles.resultValue}>{gmdResult.ganhoTotal} kg</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Arrobas Ganhas</Text>
                  <Text style={styles.resultValue}>{gmdResult.arrobasGanhas} @</Text>
                </View>
              </View>
            )}
          </View>
        );

      case "valor":
        return (
          <View style={styles.calcContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Peso do Animal (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 500"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
                value={pesoAnimal}
                onChangeText={setPesoAnimal}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preço da Arroba (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 280"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
                value={precoArroba}
                onChangeText={setPrecoArroba}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rendimento de Carcaça (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 52"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
                value={rendimentoCarcaca}
                onChangeText={setRendimentoCarcaca}
              />
            </View>

            {valorResult && (
              <View style={styles.resultContainer}>
                <View style={[styles.resultHighlight, { backgroundColor: COLORS.gold + "20" }]}>
                  <Text style={styles.resultHighlightLabel}>VALOR DO ANIMAL</Text>
                  <Text style={[styles.resultHighlightValue, { color: COLORS.gold }]}>
                    R$ {Number(valorResult.valorTotal).toLocaleString("pt-BR")}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Peso Carcaça</Text>
                  <Text style={styles.resultValue}>{valorResult.pesoCarcaca} kg</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Arrobas Carcaça</Text>
                  <Text style={styles.resultValue}>{valorResult.arrobasCarcaca} @</Text>
                </View>
              </View>
            )}
          </View>
        );

      case "conversao":
        return (
          <View style={styles.calcContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Consumo de Ração (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 600"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
                value={consumoRacao}
                onChangeText={setConsumoRacao}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ganho de Peso (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 100"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
                value={ganhoPeso}
                onChangeText={setGanhoPeso}
              />
            </View>

            {conversaoResult && (
              <View style={styles.resultContainer}>
                <View
                  style={[
                    styles.resultHighlight,
                    {
                      backgroundColor:
                        conversaoResult.classificacao === "Excelente"
                          ? COLORS.success + "15"
                          : conversaoResult.classificacao === "Bom"
                          ? COLORS.info + "15"
                          : conversaoResult.classificacao === "Regular"
                          ? COLORS.warning + "20"
                          : COLORS.danger + "15",
                    },
                  ]}
                >
                  <Text style={styles.resultHighlightLabel}>CONVERSÃO ALIMENTAR</Text>
                  <Text
                    style={[
                      styles.resultHighlightValue,
                      {
                        color:
                          conversaoResult.classificacao === "Excelente"
                            ? COLORS.success
                            : conversaoResult.classificacao === "Bom"
                            ? COLORS.info
                            : conversaoResult.classificacao === "Regular"
                            ? COLORS.warning
                            : COLORS.danger,
                      },
                    ]}
                  >
                    {conversaoResult.conversao}:1
                  </Text>
                  <Text style={styles.classificacaoText}>{conversaoResult.classificacao}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Eficiência</Text>
                  <Text style={styles.resultValue}>{conversaoResult.eficiencia}%</Text>
                </View>
              </View>
            )}

            <View style={styles.infoBox}>
              <MaterialIcons name="info" size={16} color={COLORS.info} />
              <Text style={styles.infoText}>
                Conversão ideal: até 5:1 (excelente), 5-6:1 (bom), 6-7:1 (regular)
              </Text>
            </View>
          </View>
        );

      case "projecao":
        return (
          <View style={styles.calcContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Peso Atual (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 400"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
                value={pesoAtual}
                onChangeText={setPesoAtual}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GMD Esperado (kg/dia)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 1.2"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
                value={gmdProjecao}
                onChangeText={setGmdProjecao}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dias para Projeção</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 90"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
                value={diasProjecao}
                onChangeText={setDiasProjecao}
              />
            </View>

            {projecaoResult && (
              <View style={styles.resultContainer}>
                <View style={[styles.resultHighlight, { backgroundColor: COLORS.info + "15" }]}>
                  <Text style={styles.resultHighlightLabel}>PESO PROJETADO</Text>
                  <Text style={[styles.resultHighlightValue, { color: COLORS.info }]}>
                    {projecaoResult.pesoProjetado} kg
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Arrobas Projetadas</Text>
                  <Text style={styles.resultValue}>{projecaoResult.arrobasProjetadas} @</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Ganho no Período</Text>
                  <Text style={styles.resultValue}>{projecaoResult.ganhoTotal} kg</Text>
                </View>
              </View>
            )}
          </View>
        );
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calculadora</Text>
          <Text style={styles.headerSubtitle}>Ferramentas para pecuária</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Calculator Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selectorScroll}
            contentContainerStyle={styles.selectorContent}
          >
            {CALCULATORS.map((calc) => (
              <TouchableOpacity
                key={calc.id}
                style={[
                  styles.selectorCard,
                  selectedCalc === calc.id && { borderColor: calc.color, borderWidth: 2 },
                ]}
                onPress={() => {
                  triggerHaptic();
                  setSelectedCalc(calc.id);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.selectorIcon, { backgroundColor: calc.color + "15" }]}
                >
                  <MaterialIcons name={calc.icon as any} size={24} color={calc.color} />
                </View>
                <Text style={styles.selectorTitle}>{calc.title}</Text>
                <Text style={styles.selectorDesc}>{calc.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Calculator Content */}
          <View style={styles.calculatorContainer}>{renderCalculator()}</View>

          <View style={{ height: 100 }} />
        </ScrollView>
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
  selectorScroll: {
    marginTop: 16,
  },
  selectorContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  selectorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: 140,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectorIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  selectorDesc: {
    fontSize: 11,
    color: COLORS.gray,
  },
  calculatorContainer: {
    margin: 16,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calcContent: {},
  inputGroup: {
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  resultContainer: {
    marginTop: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  resultHighlight: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  resultHighlightLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray,
    marginBottom: 4,
  },
  resultHighlightValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  classificacaoText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    color: COLORS.gray,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.info + "10",
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.info,
  },
});
