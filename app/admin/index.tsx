import { View, Text, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

/**
 * Dashboard Admin - Overview
 * 
 * Exibe métricas gerais do negócio
 * 
 * NOTA: Dados são mockados para demonstração.
 * Para conectar ao backend real, descomentar as queries tRPC
 * e seguir instruções em ALINHAMENTO_SCHEMA.md
 */
export default function AdminOverview() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";

  // Dados mockados para demonstração
  const totalUsuarios = 0;
  const totalAssinaturas = 0;
  const receitaMensal = 0;
  const usuariosRecentes: any[] = [];

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
      value: `R$ ${receitaMensal.toFixed(2)}`,
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
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <MaterialIcons name="inbox" size={48} color={colors.muted} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>
              Nenhum usuário cadastrado ainda
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", marginTop: 8 }}>
              Os usuários aparecerão aqui quando começarem a usar o app
            </Text>
          </View>
        )}
      </View>

      {/* Nota sobre integração */}
      <View
        style={{
          marginTop: 24,
          padding: 16,
          backgroundColor: colors.warning + "10",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.warning + "40",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <MaterialIcons name="info" size={20} color={colors.warning} style={{ marginRight: 8, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
              Dashboard em Modo Demonstração
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
              Este dashboard está exibindo dados mockados. Para conectar ao backend real e exibir dados reais dos usuários, 
              siga as instruções no arquivo ALINHAMENTO_SCHEMA.md na raiz do projeto.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
