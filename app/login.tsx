import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";

export default function LoginScreen() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    if (!name.trim() || !password.trim()) {
      setErrorMessage("Please enter your restaurant name and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await fetch("http://192.168.0.91:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        await AsyncStorage.setItem("token", data.token);
        router.replace("/dashboard");
      } else {
        const message = data.error || "Unable to sign in. Please try again.";
        setErrorMessage(message);
        Alert.alert("Login failed", message);
      }
    } catch (e: any) {
      const message = e.message || "Something went wrong. Please try again.";
      setErrorMessage(message);
      Alert.alert("Login failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTap="handled"
        >
          <View style={styles.branding}>
            <Text style={styles.welcome}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to manage orders, keep customers updated, and stay on
              top of service.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Restaurant Portal</Text>
            <Text style={styles.cardSubtitle}>
              Enter your credentials to access the dashboard.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Restaurant Name</Text>
              <TextInput
                placeholder="e.g. Green Bowl Cafe"
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
              />
            </View>

            {errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: "center",
  },
  branding: {
    marginBottom: theme.spacing.xl,
  },
  welcome: {
    fontSize: 32,
    fontFamily: "Outfit_700Bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.muted,
    fontFamily: "Outfit_400Regular",
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  cardTitle: {
    fontSize: 24,
    fontFamily: "Outfit_700Bold",
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: 15,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    fontFamily: "Outfit_400Regular",
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
    fontFamily: "Outfit_600SemiBold",
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: theme.colors.text,
    backgroundColor: "#f9fafb",
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: "Outfit_600SemiBold",
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm + 6,
    borderRadius: theme.radii.md,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Outfit_600SemiBold",
  },
});
