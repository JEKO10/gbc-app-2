import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { SafeAreaView } from "react-native-safe-area-context";

import { Order } from "@/utils/types";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";

interface DecodedToken extends JwtPayload {
  name: string;
}

type TimeframeOption = "all" | "24h" | "7d" | "30d";

const TIME_OPTIONS: { label: string; value: TimeframeOption }[] = [
  { label: "All", value: "all" },
  { label: "24h", value: "24h" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

const STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  completed: { backgroundColor: "rgba(34,197,94,0.15)", color: "#15803d" },
  ready: { backgroundColor: "rgba(59,130,246,0.15)", color: "#1d4ed8" },
  dispatched: { backgroundColor: "rgba(14,165,233,0.15)", color: "#0369a1" },
  preparing: { backgroundColor: "rgba(249,115,22,0.15)", color: "#c2410c" },
  pending: { backgroundColor: "rgba(250,204,21,0.2)", color: "#92400e" },
  rejected: { backgroundColor: "rgba(248,113,113,0.18)", color: "#b91c1c" },
  cancelled: { backgroundColor: "rgba(148,163,184,0.26)", color: "#475569" },
};

export default function OrderHistoryScreen() {
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [restaurantName, setRestaurantName] = useState("GBC Canteen");
  const [timeframe, setTimeframe] = useState<TimeframeOption>("all");
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          router.replace("/login");
          return;
        }

        try {
          const decoded = jwtDecode<DecodedToken>(token);
          if (decoded?.name) {
            setRestaurantName(decoded.name);
          }
        } catch (decodeError) {
          console.warn("Failed to decode token", decodeError);
        }

        const res = await fetch("https://www.gbcanteen.com/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Unauthorized or server error");

        const data: Order[] = await res.json();
        const now = Date.now();

        const history = data
          .filter(
            (order) =>
              now - new Date(order.createdAt).getTime() > 4 * 60 * 60 * 1000
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
  }, [router]);

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/login");
  };

  const filteredOrders = useMemo(() => {
    if (timeframe === "all") {
      return historyOrders;
    }

    const now = Date.now();
    const windowMs =
      timeframe === "24h"
        ? 24 * 60 * 60 * 1000
        : timeframe === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

    return historyOrders.filter(
      (order) => now - new Date(order.createdAt).getTime() <= windowMs
    );
  }, [historyOrders, timeframe]);

  const summary = useMemo(() => {
    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + order.amount / 100,
      0
    );

    const latest = filteredOrders[0]?.createdAt;

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      averageOrder: filteredOrders.length
        ? totalRevenue / filteredOrders.length
        : 0,
      latest,
    };
  }, [filteredOrders]);

  const renderOrderCard = useCallback(({ item }: { item: Order }) => {
    const orderDate = new Date(item.createdAt);
    const statusKey = item.status.toLowerCase();
    const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.pending;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>#{item.orderNumber || item.id}</Text>
            <Text style={styles.orderTimestamp}>
              {orderDate.toLocaleDateString()} ·
              {" "}
              {orderDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text style={[styles.statusLabel, { color: statusStyle.color }]}> 
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.customerRow}>
          <Text style={styles.customerName}>{item.user.name}</Text>
          <Text style={styles.customerMeta}>{item.user.phone}</Text>
        </View>

        <View style={styles.itemList}>
          {item.items.map((orderItem, index) => (
            <View key={`${item.id}-${orderItem.title}-${index}`} style={styles.itemRow}>
              <Text style={styles.itemTitle}>{orderItem.title}</Text>
              <Text style={styles.itemQuantity}>×{orderItem.quantity}</Text>
            </View>
          ))}
        </View>

        {item.orderNote ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Note</Text>
            <Text style={styles.noteText}>{item.orderNote}</Text>
          </View>
        ) : null}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total collected</Text>
          <Text style={styles.totalValue}>
            £{(item.amount / 100).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}> 
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <PageHeader
            title="Order History"
            subtitle="Review completed and archived tickets"
            onMenuPress={() => setSidebarVisible(true)}
            auxiliary={
              <View style={styles.restaurantBadge}>
                <Text style={styles.restaurantBadgeText}>{restaurantName}</Text>
              </View>
            }
          />

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Orders</Text>
              <Text style={styles.metricValue}>{summary.totalOrders}</Text>
              <Text style={styles.metricHint}>
                {timeframe === "all" ? "All archived" : `Last ${TIME_OPTIONS.find((t) => t.value === timeframe)?.label}`}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Revenue</Text>
              <Text style={styles.metricValue}>
                £{summary.totalRevenue.toFixed(2)}
              </Text>
              <Text style={styles.metricHint}>Gross sales</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Avg. Order</Text>
              <Text style={styles.metricValue}>
                £{summary.averageOrder.toFixed(2)}
              </Text>
              <Text style={styles.metricHint}>Per ticket</Text>
            </View>
          </View>

          {summary.latest ? (
            <View style={styles.latestBox}>
              <Text style={styles.latestTitle}>Latest archived</Text>
              <Text style={styles.latestValue}>
                {new Date(summary.latest).toLocaleString([], {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ) : null}

          <View style={styles.filterRow}>
            {TIME_OPTIONS.map((option) => {
              const active = timeframe === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.filterButton, active && styles.filterButtonActive]}
                  onPress={() => setTimeframe(option.value)}
                >
                  <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={[
            styles.listContent,
            filteredOrders.length === 0 && styles.listEmptyContent,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No archived orders</Text>
              <Text style={styles.emptyCaption}>
                Orders move here after fulfilment. Keep an eye on your live queue!
              </Text>
            </View>
          }
        />
      </View>

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
        restaurantName={restaurantName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e2e8f0",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e2e8f0",
  },
  headerCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  restaurantBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(37,99,235,0.1)",
  },
  restaurantBadgeText: {
    color: "#1d4ed8",
    fontFamily: "Outfit_600SemiBold",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  metricLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    color: "#94a3b8",
    fontFamily: "Outfit_600SemiBold",
    letterSpacing: 1,
  },
  metricValue: {
    marginTop: 10,
    fontSize: 22,
    color: "#f8fafc",
    fontFamily: "Outfit_700Bold",
  },
  metricHint: {
    marginTop: 6,
    color: "#cbd5f5",
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
  },
  latestBox: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: "rgba(37,99,235,0.12)",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  latestTitle: {
    color: "#1d4ed8",
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    textTransform: "uppercase",
  },
  latestValue: {
    marginTop: 6,
    fontSize: 16,
    color: "#0f172a",
    fontFamily: "Outfit_600SemiBold",
  },
  filterRow: {
    flexDirection: "row",
    marginTop: 18,
    gap: 12,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
  },
  filterButtonActive: {
    backgroundColor: "#2563eb",
  },
  filterButtonText: {
    fontSize: 13,
    color: "#475569",
    fontFamily: "Outfit_600SemiBold",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingBottom: 120,
    gap: 16,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
    backgroundColor: "#f8fafc",
    borderRadius: 28,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "#0f172a",
  },
  emptyCaption: {
    marginTop: 12,
    textAlign: "center",
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Outfit_400Regular",
  },
  orderCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 18,
    color: "#0f172a",
    fontFamily: "Outfit_700Bold",
  },
  orderTimestamp: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
    fontFamily: "Outfit_400Regular",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusLabel: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  customerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerName: {
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
    color: "#0f172a",
  },
  customerMeta: {
    fontSize: 13,
    color: "#64748b",
    fontFamily: "Outfit_400Regular",
  },
  itemList: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: "#e2e8f0",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: {
    fontSize: 14,
    color: "#0f172a",
    fontFamily: "Outfit_400Regular",
    flexShrink: 1,
    marginRight: 12,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#1d4ed8",
    fontFamily: "Outfit_600SemiBold",
  },
  noteBox: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "rgba(250, 204, 21, 0.18)",
    padding: 14,
  },
  noteLabel: {
    fontSize: 12,
    color: "#92400e",
    fontFamily: "Outfit_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  noteText: {
    marginTop: 6,
    color: "#78350f",
    fontSize: 14,
    lineHeight: 18,
    fontFamily: "Outfit_400Regular",
  },
  totalRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "Outfit_400Regular",
  },
  totalValue: {
    fontSize: 18,
    color: "#0f172a",
    fontFamily: "Outfit_700Bold",
  },
});
