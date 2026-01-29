import { View, Text, ActivityIndicator, FlatList, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

/**
 * Dashboard Admin - Assinaturas
 * 
 * Lista todas as assinaturas ativas com informações:
 * - Usuário
 * - Plano
 * - Valor mensal
 * - Data de início
 * - Status
 */
export default function AdminAssinaturas() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";

  // Query tRPC
  const { data: assinaturas, isLoading } = trpc.fazenda.getAssinaturasRecentes.useQuery({ limit: 100 });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativa":
        return colors.success;
      case "cancelada":
        return colors.error;
      case "trial":
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Título */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
          Assinaturas
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name="payment" size={20} color={colors.muted} />
          <Text style={{ marginLeft: 8, fontSize: 14, color: colors.muted }}>
            {assinaturas?.length || 0} assinaturas
          </Text>
        </View>
      </View>

      {/* Tabela de Assinaturas */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        {isWeb && (
          <View
            style={{
              flexDirection: "row",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <Text style={{ flex: 2, fontSize: 12, fontWeight: "600", color: colors.muted }}>USUÁRIO</Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: colors.muted }}>PLANO</Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: colors.muted }}>VALOR/MÊS</Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: colors.muted }}>INÍCIO</Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: colors.muted }}>STATUS</Text>
          </View>
        )}

        {/* Lista */}
        {assinaturas && assinaturas.length > 0 ? (
          <FlatList
            data={assinaturas}
            keyExtractor={(item: any) => item.id.toString()}
            renderItem={({ item }: { item: any }) => (
              <View
                style={{
                  flexDirection: isWeb ? "row" : "column",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                {/* Usuário */}
                <View style={{ flex: isWeb ? 2 : undefined, flexDirection: "row", alignItems: "center", marginBottom: isWeb ? 0 : 8 }}>
                  <MaterialIcons name="account-circle" size={40} color={colors.muted} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }}>
                      {item.user?.name || "Sem nome"}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>{item.user?.email}</Text>
                  </View>
                </View>

                {/* Plano */}
                <View style={{ flex: isWeb ? 1 : undefined, justifyContent: "center", marginBottom: isWeb ? 0 : 4 }}>
                  {!isWeb && <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>Plano:</Text>}
                  <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}>
                    {item.plano?.nome || "Desconhecido"}
                  </Text>
                </View>

                {/* Valor */}
                <View style={{ flex: isWeb ? 1 : undefined, justifyContent: "center", marginBottom: isWeb ? 0 : 4 }}>
                  {!isWeb && <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>Valor/mês:</Text>}
                  <Text style={{ fontSize: 13, color: colors.foreground }}>
                    R$ {item.plano?.precoMensal?.toFixed(2) || "0.00"}
                  </Text>
                </View>

                {/* Início */}
                <View style={{ flex: isWeb ? 1 : undefined, justifyContent: "center", marginBottom: isWeb ? 0 : 4 }}>
                  {!isWeb && <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>Início:</Text>}
                  <Text style={{ fontSize: 13, color: colors.foreground }}>
                    {new Date(item.dataInicio).toLocaleDateString("pt-BR")}
                  </Text>
                </View>

                {/* Status */}
                <View style={{ flex: isWeb ? 1 : undefined, justifyContent: "center" }}>
                  {!isWeb && <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>Status:</Text>}
                  <View
                    style={{
                      alignSelf: "flex-start",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      backgroundColor: getStatusColor(item.status) + "20",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: getStatusColor(item.status),
                      }}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        ) : (
          <View style={{ padding: 40, alignItems: "center" }}>
            <MaterialIcons name="payment" size={48} color={colors.muted} />
            <Text style={{ marginTop: 16, fontSize: 14, color: colors.muted, textAlign: "center" }}>
              Nenhuma assinatura ativa ainda
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
