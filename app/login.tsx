import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const router = useRouter();

  const handleLogin = async () => {
    if (!name.trim() || !password.trim()) {
      Alert.alert("Missing details", "Enter both restaurant name and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("https://www.gbcanteen.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        await AsyncStorage.setItem("token", data.token);
        router.replace("/dashboard");
      } else {
        Alert.alert("Login failed", data.error || "Unknown error");
      }
    } catch (e: unknown) {
      Alert.alert(
        "Login failed",
        e instanceof Error ? e.message : "Unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroBadge}>
            <Text style={styles.heroTitle}>GBC Canteen</Text>
            <Text style={styles.heroSubtitle}>Operator Access</Text>
            <Text style={styles.heroCaption}>
              Sign in to view live orders, manage fulfilment, and monitor performance
              metrics in real time.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Welcome back</Text>
              <Text style={styles.formDescription}>
                Use the restaurant credentials provided by the GBC onboarding team.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Restaurant name</Text>
              <View style={styles.inputFieldWrapper}>
                <Ionicons name="storefront-outline" size={18} color="#64748b" />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. GBC College"
                  placeholderTextColor="#94a3b8"
                  style={styles.inputField}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputFieldWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748b" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter secure password"
                  placeholderTextColor="#94a3b8"
                  style={styles.inputField}
                  secureTextEntry={secureEntry}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setSecureEntry((prev) => !prev)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={secureEntry ? "eye-outline" : "eye-off-outline"}
                    size={18}
                    color="#475569"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.9}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>

            <View style={styles.helperRow}>
              <Ionicons name="shield-checkmark" size={16} color="#38bdf8" />
              <Text style={styles.helperText}>
                Access restricted to registered restaurant partners.
              </Text>
            </View>
          </View>

          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Need assistance?</Text>
            <Text style={styles.supportText}>
              Email <Text style={styles.supportHighlight}>support@gbcanteen.com</Text>{" "}
              or call <Text style={styles.supportHighlight}>+44 20 1234 5678</Text> to
              reset credentials.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: "#0f172a",
  },
  heroBadge: {
    backgroundColor: "rgba(148, 163, 184, 0.12)",
    borderRadius: 28,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  heroTitle: {
    fontSize: 26,
    color: "#38bdf8",
    fontFamily: "Outfit_700Bold",
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 18,
    color: "#e2e8f0",
    fontFamily: "Outfit_600SemiBold",
  },
  heroCaption: {
    marginTop: 12,
    color: "#cbd5f5",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Outfit_400Regular",
  },
  formCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    shadowColor: "#0f172a",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  formHeader: {
    marginBottom: 24,
    gap: 8,
  },
  formTitle: {
    fontSize: 24,
    color: "#0f172a",
    fontFamily: "Outfit_700Bold",
  },
  formDescription: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Outfit_400Regular",
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
    fontFamily: "Outfit_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputFieldWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#e2e8f0",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputField: {
    flex: 1,
    color: "#0f172a",
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
  },
  eyeButton: {
    padding: 4,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Outfit_600SemiBold",
  },
  helperRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  helperText: {
    flex: 1,
    color: "#475569",
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
  },
  supportCard: {
    marginTop: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    backgroundColor: "rgba(15,23,42,0.35)",
    padding: 24,
  },
  supportTitle: {
    color: "#e2e8f0",
    fontSize: 18,
    fontFamily: "Outfit_600SemiBold",
    marginBottom: 8,
  },
  supportText: {
    color: "#cbd5f5",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Outfit_400Regular",
  },
  supportHighlight: {
    color: "#38bdf8",
    fontFamily: "Outfit_600SemiBold",
  },
});
