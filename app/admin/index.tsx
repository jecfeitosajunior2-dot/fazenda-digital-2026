import { View, Text, ScrollView, Platform, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

/**
 * Dashboard Admin - Overview
 * 
 * Exibe métricas gerais do negócio com dados reais do backend
 */
export default function AdminOverview() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";

  // Buscar dados reais do backend
  const { data: totalUsuarios = 0, isLoading: loadingUsuarios } = trpc.fazenda.getTotalUsuarios.useQuery();
  const { data: totalAssinaturas = 0, isLoading: loadingAssinaturas } = trpc.fazenda.getTotalAssinaturasAtivas.useQuery();
  const { data: receitaMensal = 0, isLoading: loadingReceita } = trpc.fazenda.getReceitaMensal.useQuery();
  const { data: usuariosRecentes = [], isLoading: loadingRecentes } = trpc.fazenda.getUsuariosRecentes.useQuery({ limit: 10 });

  const loading = loadingUsuarios || loadingAssinaturas || loadingReceita || loadingRecentes;

  const metrics = [
    {
      icon: "people",
      label: "Total de Usuários",
      value: totalUsuarios,
      color: colors.primary,
    },
    {
      icon: "payment",
      label: "Assinaturas Ativas",
      value: totalAssinaturas,
      color: colors.success,
    },
    {
      icon: "attach-money",
      label: "Receita Mensal",
      value: `R$ ${Number(receitaMensal).toFixed(2)}`,
      color: colors.warning,
    },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.muted }}>Carregando métricas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
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
        <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
          Usuários Recentes
        </Text>

        {usuariosRecentes.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <MaterialIcons name="people-outline" size={48} color={colors.muted} />
            <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12 }}>
              Nenhum usuário cadastrado ainda
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4, textAlign: "center" }}>
              Os usuários aparecerão aqui quando começarem a usar o app
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {usuariosRecentes.map((usuario: any) => (
              <View
                key={usuario.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  backgroundColor: colors.background,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary + "20",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.primary }}>
                    {usuario.name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                    {usuario.name || "Sem nome"}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    {usuario.email || "Sem e-mail"}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {new Date(usuario.createdAt).toLocaleDateString("pt-BR")}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Nota sobre dados reais */}
      <View
        style={{
          marginTop: 24,
          padding: 16,
          backgroundColor: colors.primary + "10",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.primary + "30",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <MaterialIcons name="info" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>
            Dashboard Conectado ao Backend
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
          Este dashboard está exibindo dados reais do banco de dados PostgreSQL. As métricas são atualizadas automaticamente conforme novos usuários se cadastram e utilizam o aplicativo.
        </Text>
      </View>
    </ScrollView>
  );
}
