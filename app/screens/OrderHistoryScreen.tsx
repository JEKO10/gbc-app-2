import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Order } from "@/utils/types";
import OrderCard from "../components/OrderCard";
import Sidebar from "../components/Sidebar";
import { theme } from "@/constants/theme";

export default function OrderHistoryScreen() {
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        const res = await fetch("http://192.168.0.91:3000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Unauthorized or server error");

        const data: Order[] = await res.json();
        const now = Date.now();

        const history = data.filter(
          (order) =>
            now - new Date(order.createdAt).getTime() > 4 * 60 * 60 * 1000
        );

        setHistoryOrders(history);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to fetch history orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/login");
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topWrapper}>
          <View style={styles.brandingGroup}>
            <Image
              source={require("../../assets/images/small-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.brandTextGroup}>
              <Text style={styles.headerTitle}>Order History</Text>
              <Text style={styles.headerSubtitle}>
                Archived orders older than four hours.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setSidebarVisible(true)}
            style={styles.hamburgerWrapper}
          >
            <Text style={styles.hamburger}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          Analyse completed orders to identify peak times, repeat customers,
          and opportunities for tailored service.
        </Text>
      </View>

      <FlatList
        data={historyOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          historyOrders.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No historical orders</Text>
            <Text style={styles.emptySubtitle}>
              Once orders are completed, they will appear here for easy
              reference.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard
            item={item}
            liveOrders={[]}
            updateOrderStatus={() => {}}
          />
        )}
      />

      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onLiveOrders={() => {
          router.push("/dashboard");
          setSidebarVisible(false);
        }}
        onHistory={() => {
          setSidebarVisible(false);
        }}
        onSummary={() => {
          router.push("/summary");
          setSidebarVisible(false);
        }}
        onLogout={() => {
          logout();
          setSidebarVisible(false);
        }}
        pusherStatus={""}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  topBar: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  topWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandingGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandTextGroup: {
    marginLeft: theme.spacing.md,
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Outfit_700Bold",
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    fontFamily: "Outfit_400Regular",
    marginTop: 4,
    lineHeight: 18,
  },
  hamburgerWrapper: {
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    backgroundColor: "#eef2ff",
  },
  hamburger: {
    fontSize: 24,
    color: theme.colors.primaryDark,
  },
  infoBanner: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: "#eef2ff",
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.primaryDark,
    fontFamily: "Outfit_400Regular",
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: theme.spacing.xl * 1.4,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    alignItems: "center",
    ...theme.shadow.card,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    fontFamily: "Outfit_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
