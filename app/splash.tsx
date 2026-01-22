import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

const COLORS = {
  primary: "#1B4332",
  primaryDark: "#0D2818",
  gold: "#C9A227",
  white: "#FFFFFF",
};

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const subtitleFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de entrada
    Animated.sequence([
      // Logo aparece e cresce
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Texto principal aparece
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Subtítulo aparece
      Animated.timing(subtitleFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Navegar após 3 segundos
    const timer = setTimeout(() => {
      router.replace("/auth" as any);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={[COLORS.primaryDark, COLORS.primary, COLORS.primaryDark]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Logo animado */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoCircle}>
          <MaterialIcons name="eco" size={80} color={COLORS.primary} />
        </View>
      </Animated.View>

      {/* Nome do app */}
      <Animated.Text style={[styles.appName, { opacity: textFadeAnim }]}>
        Fazenda Digital
      </Animated.Text>

      {/* Subtítulo */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleFadeAnim }]}>
        Gestão Pecuária Inteligente
      </Animated.Text>

      {/* Decoração inferior */}
      <View style={styles.bottomDecoration}>
        <View style={styles.goldLine} />
        <Text style={styles.versionText}>Versão 3.0</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gold,
    fontWeight: "500",
    letterSpacing: 2,
  },
  bottomDecoration: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
  },
  goldLine: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.white + "80",
    letterSpacing: 1,
  },
});
