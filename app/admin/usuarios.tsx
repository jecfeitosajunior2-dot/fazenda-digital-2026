import { View, Text, ActivityIndicator, FlatList, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

/**
 * Dashboard Admin - Usuários
 * 
 * Lista todos os usuários cadastrados com informações:
 * - Nome e email
 * - Data de cadastro
 * - Último acesso
 * - Role (user/admin)
 */
export default function AdminUsuarios() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";

  // Query tRPC
  const { data: usuarios, isLoading } = trpc.fazenda.getUsuariosRecentes.useQuery({ limit: 100 });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Título */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
          Usuários
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name="people" size={20} color={colors.muted} />
          <Text style={{ marginLeft: 8, fontSize: 14, color: colors.muted }}>
            {usuarios?.length || 0} usuários
          </Text>
        </View>
      </View>

      {/* Tabela de Usuários */}
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
            <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: colors.muted }}>CADASTRO</Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: colors.muted }}>ÚLTIMO ACESSO</Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: colors.muted }}>ROLE</Text>
          </View>
        )}

        {/* Lista */}
        {usuarios && usuarios.length > 0 ? (
          <FlatList
            data={usuarios}
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
                      {item.name || "Sem nome"}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>{item.email}</Text>
                  </View>
                </View>

                {/* Cadastro */}
                <View style={{ flex: isWeb ? 1 : undefined, justifyContent: "center", marginBottom: isWeb ? 0 : 4 }}>
                  {!isWeb && <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>Cadastro:</Text>}
                  <Text style={{ fontSize: 13, color: colors.foreground }}>
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </Text>
                </View>

                {/* Último Acesso */}
                <View style={{ flex: isWeb ? 1 : undefined, justifyContent: "center", marginBottom: isWeb ? 0 : 4 }}>
                  {!isWeb && <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>Último acesso:</Text>}
                  <Text style={{ fontSize: 13, color: colors.foreground }}>
                    {new Date(item.lastSignedIn).toLocaleDateString("pt-BR")}
                  </Text>
                </View>

                {/* Role */}
                <View style={{ flex: isWeb ? 1 : undefined, justifyContent: "center" }}>
                  {!isWeb && <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>Role:</Text>}
                  <View
                    style={{
                      alignSelf: "flex-start",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      backgroundColor: item.role === "admin" ? colors.primary + "20" : colors.muted + "20",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: item.role === "admin" ? colors.primary : colors.muted,
                      }}
                    >
                      {item.role}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        ) : (
          <View style={{ padding: 40, alignItems: "center" }}>
            <MaterialIcons name="people-outline" size={48} color={colors.muted} />
            <Text style={{ marginTop: 16, fontSize: 14, color: colors.muted, textAlign: "center" }}>
              Nenhum usuário cadastrado ainda
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
