import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      router.replace(token ? "/dashboard" : "/login");
    };
    checkAuth();
  }, [router]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandTitle}>GBC Canteen</Text>
          <Text style={styles.brandSubtitle}>Operator Console</Text>
        </View>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Preparing your workspace...</Text>
          <Text style={styles.loadingHint}>
            Checking your secure session and syncing the latest live orders.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 32,
  },
  brandBadge: {
    alignItems: "center",
    backgroundColor: "rgba(148,163,184,0.16)",
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.24)",
  },
  brandTitle: {
    fontSize: 28,
    color: "#38bdf8",
    fontFamily: "Outfit_700Bold",
  },
  brandSubtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#e2e8f0",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "Outfit_600SemiBold",
  },
  loadingCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#f8fafc",
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 26,
    alignItems: "center",
    gap: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  loadingText: {
    fontSize: 18,
    color: "#0f172a",
    fontFamily: "Outfit_600SemiBold",
  },
  loadingHint: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Outfit_400Regular",
  },
});
