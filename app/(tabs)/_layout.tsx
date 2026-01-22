import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Platform, View } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1B4332",
        tabBarInactiveTintColor: "#6C757D",
        headerShown: false,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#DEE2E6",
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <MaterialIcons name="home" size={26} color={color} />
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    bottom: -6,
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#1B4332",
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="rebanho"
        options={{
          title: "Rebanho",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <MaterialIcons name="pets" size={26} color={color} />
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    bottom: -6,
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#1B4332",
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="vendas"
        options={{
          title: "Vendas",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <MaterialIcons name="attach-money" size={26} color={color} />
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    bottom: -6,
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#1B4332",
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="custos"
        options={{
          title: "Custos",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <MaterialIcons name="receipt-long" size={26} color={color} />
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    bottom: -6,
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#1B4332",
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="relatorios"
        options={{
          title: "Relatórios",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <MaterialIcons name="bar-chart" size={26} color={color} />
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    bottom: -6,
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#1B4332",
                  }}
                />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
