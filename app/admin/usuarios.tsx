import { View, Text, ScrollView, Platform, ActivityIndicator, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";

/**
 * Dashboard Admin - Usuários
 * 
 * Lista todos os usuários cadastrados no sistema
 */
export default function AdminUsuarios() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar todos os usuários
  const { data: usuarios = [], isLoading } = trpc.fazenda.getUsuariosRecentes.useQuery({ limit: 1000 });

  // Filtrar usuários por busca
  const usuariosFiltrados = useMemo(() => {
    if (!searchQuery) return usuarios;
    
    const query = searchQuery.toLowerCase();
    return usuarios.filter((u: any) => 
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  }, [usuarios, searchQuery]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.muted }}>Carregando usuários...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Cabeçalho */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
            Usuários
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            {usuarios.length} usuário{usuarios.length !== 1 ? "s" : ""} cadastrado{usuarios.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Barra de busca */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
          marginBottom: 24,
        }}
      >
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 8,
            fontSize: 14,
            color: colors.foreground,
          }}
          placeholder="Buscar por nome ou e-mail..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Lista de usuários */}
      {usuariosFiltrados.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            padding: 40,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
          }}
        >
          <MaterialIcons name="people-outline" size={48} color={colors.muted} />
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, textAlign: "center" }}>
            {searchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado ainda"}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4, textAlign: "center" }}>
            {searchQuery ? "Tente buscar por outro termo" : "Os usuários aparecerão aqui quando começarem a usar o app"}
          </Text>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          {/* Cabeçalho da tabela (apenas web) */}
          {isWeb && (
            <View
              style={{
                flexDirection: "row",
                padding: 16,
                backgroundColor: colors.background,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ flex: 2, fontSize: 12, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
                Usuário
              </Text>
              <Text style={{ flex: 2, fontSize: 12, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
                E-mail
              </Text>
              <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
                Método
              </Text>
              <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: colors.muted, textTransform: "uppercase" }}>
                Cadastro
              </Text>
            </View>
          )}

          {/* Linhas */}
          {usuariosFiltrados.map((usuario: any, index: number) => (
            <View
              key={usuario.id}
              style={{
                flexDirection: isWeb ? "row" : "column",
                padding: 16,
                borderBottomWidth: index < usuariosFiltrados.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
                gap: isWeb ? 0 : 8,
              }}
            >
              {/* Usuário */}
              <View style={{ flex: isWeb ? 2 : undefined, flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.primary + "20",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.primary }}>
                    {usuario.name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                    {usuario.name || "Sem nome"}
                  </Text>
                  {!isWeb && (
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      ID: {usuario.id}
                    </Text>
                  )}
                </View>
              </View>

              {/* E-mail */}
              <View style={{ flex: isWeb ? 2 : undefined }}>
                {!isWeb && (
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>E-mail</Text>
                )}
                <Text style={{ fontSize: 14, color: colors.foreground }}>
                  {usuario.email || "Sem e-mail"}
                </Text>
              </View>

              {/* Método de login */}
              <View style={{ flex: isWeb ? 1 : undefined }}>
                {!isWeb && (
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>Método</Text>
                )}
                <View
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                    backgroundColor: colors.primary + "20",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
                    {usuario.loginMethod || "Manus"}
                  </Text>
                </View>
              </View>

              {/* Data de cadastro */}
              <View style={{ flex: isWeb ? 1 : undefined }}>
                {!isWeb && (
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>Cadastro</Text>
                )}
                <Text style={{ fontSize: 14, color: colors.foreground }}>
                  {new Date(usuario.createdAt).toLocaleDateString("pt-BR")}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {new Date(usuario.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
