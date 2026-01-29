import { Redirect, Slot } from "expo-router";
import { View, Text, Pressable, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { Link, usePathname } from "expo-router";

/**
 * Layout do Dashboard Admin
 * 
 * Estrutura:
 * - Sidebar com navegação (desktop)
 * - Header com menu mobile
 * - Conteúdo principal
 */
export default function AdminLayout() {
  const { user } = useAuth();
  const colors = useColors();
  const pathname = usePathname();

  // TODO: Implementar verificação de autenticação real
  // Temporariamente desabilitado para permitir acesso ao dashboard
  // if (!user || (user as any).role !== "admin") {
  //   return <Redirect href="/" />;
  // }

  const menuItems = [
    { href: "/admin", icon: "dashboard", label: "Overview" },
    { href: "/admin/usuarios", icon: "people", label: "Usuários" },
    { href: "/admin/assinaturas", icon: "payment", label: "Assinaturas" },
  ];

  const isWeb = Platform.OS === "web";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, flexDirection: isWeb ? "row" : "column" }}>
        {/* Sidebar (Desktop) */}
        {isWeb && (
          <View
            style={{
              width: 240,
              backgroundColor: colors.surface,
              borderRightWidth: 1,
              borderRightColor: colors.border,
              padding: 16,
            }}
          >
            {/* Logo */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground }}>
                Fazenda Digital
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>Admin Dashboard</Text>
            </View>

            {/* Menu Items */}
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href as any} asChild>
                  <Pressable
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 4,
                      backgroundColor: isActive ? colors.primary + "20" : "transparent",
                    }}
                  >
                    <MaterialIcons
                      name={item.icon as any}
                      size={20}
                      color={isActive ? colors.primary : colors.muted}
                    />
                    <Text
                      style={{
                        marginLeft: 12,
                        fontSize: 14,
                        fontWeight: isActive ? "600" : "400",
                        color: isActive ? colors.primary : colors.foreground,
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        )}

        {/* Main Content */}
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Dashboard Admin
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="account-circle" size={32} color={colors.muted} />
              <Text style={{ marginLeft: 8, fontSize: 14, color: colors.foreground }}>
                {user?.name || user?.email || "Admin"}
              </Text>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: isWeb ? 24 : 16,
              maxWidth: isWeb ? 1400 : undefined,
              width: "100%",
              alignSelf: "center",
            }}
          >
            <Slot />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
