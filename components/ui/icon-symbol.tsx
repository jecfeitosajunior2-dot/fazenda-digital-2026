// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  // Fazenda Digital Icons
  "chart.bar.fill": "bar-chart",
  "dollarsign.circle.fill": "attach-money",
  "doc.text.fill": "description",
  "person.fill": "person",
  "list.bullet": "list",
  "plus": "add",
  "xmark": "close",
  "camera.fill": "camera-alt",
  "photo.fill": "photo",
  "trash.fill": "delete",
  "pencil": "edit",
  "magnifyingglass": "search",
  "line.3.horizontal.decrease": "filter-list",
  "arrow.up.right": "trending-up",
  "arrow.down.right": "trending-down",
  "checkmark.circle.fill": "check-circle",
  "exclamationmark.triangle.fill": "warning",
  "info.circle.fill": "info",
  "gear": "settings",
  "rectangle.portrait.and.arrow.right": "logout",
  "square.and.arrow.up": "share",
  "printer.fill": "print",
  "calendar": "event",
  "clock.fill": "schedule",
  "leaf.fill": "eco",
  "pawprint.fill": "pets",
  "scalemass.fill": "fitness-center",
  "banknote.fill": "payments",
  "cart.fill": "shopping-cart",
  "bag.fill": "shopping-bag",
  "creditcard.fill": "credit-card",
  "building.2.fill": "business",
  "map.fill": "map",
  "location.fill": "location-on",
  "bell.fill": "notifications",
  "heart.fill": "favorite",
  "star.fill": "star",
  "bolt.fill": "flash-on",
  "cpu.fill": "memory",
  "antenna.radiowaves.left.and.right": "wifi",
  "icloud.fill": "cloud",
  "folder.fill": "folder",
  "archivebox.fill": "inventory",
  "shippingbox.fill": "inventory-2",
  "cube.fill": "view-in-ar",
  "chart.pie.fill": "pie-chart",
  "chart.line.uptrend.xyaxis": "show-chart",
  "waveform.path.ecg": "monitor-heart",
  "cross.case.fill": "medical-services",
  "pills.fill": "medication",
  "syringe.fill": "vaccines",
  "drop.fill": "water-drop",
  "flame.fill": "local-fire-department",
  "sun.max.fill": "wb-sunny",
  "moon.fill": "nights-stay",
  "cloud.rain.fill": "grain",
  "thermometer": "thermostat",
  "wind": "air",
  "humidity.fill": "water",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
