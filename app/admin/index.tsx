import { View, Text, ActivityIndicator, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

/**
 * Dashboard Admin - Overview
 * 
 * Exibe métricas gerais:
 * - Total de usuários
 * - Assinaturas ativas
 * - Receita mensal
 * - Usuários recentes
 */
export default function AdminOverview() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";

  // Queries tRPC
  const { data: totalUsuarios, isLoading: loadingUsuarios } = trpc.fazenda.getTotalUsuarios.useQuery();
  const { data: totalAssinaturas, isLoading: loadingAssinaturas } = trpc.fazenda.getTotalAssinaturasAtivas.useQuery();
  const { data: receitaMensal, isLoading: loadingReceita } = trpc.fazenda.getReceitaMensal.useQuery();
  const { data: usuariosRecentes, isLoading: loadingRecentes } = trpc.fazenda.getUsuariosRecentes.useQuery({ limit: 5 });

  const isLoading = loadingUsuarios || loadingAssinaturas || loadingReceita || loadingRecentes;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const metrics = [
    {
      icon: "people",
      label: "Total de Usuários",
      value: totalUsuarios || 0,
      color: colors.primary,
    },
    {
      icon: "payment",
      label: "Assinaturas Ativas",
      value: totalAssinaturas || 0,
      color: colors.success,
    },
    {
      icon: "attach-money",
      label: "Receita Mensal",
      value: `R$ ${(receitaMensal || 0).toFixed(2)}`,
      color: colors.warning,
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Título */}
      <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, marginBottom: 24 }}>
        Overview
      </Text>

      {/* Métricas */}
      <View
        style={{
          flexDirection: isWeb ? "row" : "column",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {metrics.map((metric, index) => (
          <View
            key={index}
            style={{
              flex: isWeb ? 1 : undefined,
              backgroundColor: colors.surface,
              padding: 20,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: metric.color + "20",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialIcons name={metric.icon as any} size={24} color={metric.color} />
              </View>
            </View>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.foreground, marginBottom: 4 }}>
              {metric.value}
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>{metric.label}</Text>
          </View>
        ))}
      </View>

      {/* Usuários Recentes */}
      <View
        style={{
          backgroundColor: colors.surface,
          padding: 20,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 16 }}>
          Usuários Recentes
        </Text>

        {usuariosRecentes && usuariosRecentes.length > 0 ? (
          usuariosRecentes.map((usuario: any, index: number) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: index < usuariosRecentes.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <MaterialIcons name="account-circle" size={40} color={colors.muted} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }}>
                    {usuario.name || "Sem nome"}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{usuario.email}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {new Date(usuario.createdAt).toLocaleDateString("pt-BR")}
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", paddingVertical: 20 }}>
            Nenhum usuário cadastrado ainda
          </Text>
        )}
      </View>
    </View>
  );
}
