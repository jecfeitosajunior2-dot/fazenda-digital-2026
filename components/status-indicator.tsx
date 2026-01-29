import { View, Text, StyleSheet } from "react-native";
import { SyncStatus } from "@/lib/sync-manager";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface StatusIndicatorProps {
  status: SyncStatus;
  showText?: boolean;
  size?: "small" | "medium" | "large";
}

export function StatusIndicator({
  status,
  showText = true,
  size = "small",
}: StatusIndicatorProps) {
  const config = {
    online: {
      icon: "cloud-done",
      color: "#22C55E",
      text: "Online",
    },
    offline: {
      icon: "cloud-off",
      color: "#6C757D",
      text: "Offline",
    },
    syncing: {
      icon: "cloud-sync",
      color: "#0a7ea4",
      text: "Sincronizando...",
    },
    error: {
      icon: "cloud-off",
      color: "#E63946",
      text: "Erro na sincronização",
    },
  };

  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24,
  };

  const { icon, color, text } = config[status];
  const iconSize = sizeMap[size];

  return (
    <View style={styles.container}>
      <MaterialIcons name={icon as any} size={iconSize} color={color} />
      {showText && (
        <Text style={[styles.text, { color, fontSize: iconSize * 0.75 }]}>
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
  },
  text: {
    fontWeight: "500",
  },
});
