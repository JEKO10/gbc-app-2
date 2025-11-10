import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Order } from "@/utils/types";
import Sidebar from "../components/Sidebar";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import PageHeader from "../components/PageHeader";

interface DailySummary {
  date: string;
  orderCount: number;
  revenue: number;
}

export default function AllSummaryScreen() {
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const router = useRouter();

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/login");
  };

  useEffect(() => {
    const fetchOrders = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("https://www.gbcanteen.com/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data: Order[] = await res.json();

        const grouped: { [key: string]: DailySummary } = {};

        data.forEach((order) => {
          const date = new Date(order.createdAt).toISOString().split("T")[0];
          if (!grouped[date]) {
            grouped[date] = { date, orderCount: 0, revenue: 0 };
          }
          grouped[date].orderCount += 1;
          grouped[date].revenue += order.amount / 100;
        });

        const sortedSummaries = Object.values(grouped).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setDailySummaries(sortedSummaries);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const totalForSelected = useMemo(() => {
    if (!selectedDate) return null;
    return dailySummaries.find((d) => d.date === selectedDate);
  }, [selectedDate, dailySummaries]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Daily Summary"
        subtitle="Track revenue and order trends across your restaurant."
        onMenuPress={() => setSidebarVisible(true)}
      />

      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          Tap a day to spotlight its performance. Summaries are aggregated from
          all completed orders.
        </Text>
      </View>

      {selectedDate && totalForSelected && (
        <View style={styles.summaryHighlight}>
          <Text style={styles.highlightText}>
            On {selectedDate}, you earned £{totalForSelected.revenue.toFixed(2)}{" "}
            with {totalForSelected.orderCount} orders.
          </Text>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {dailySummaries.map((summary) => (
          <TouchableOpacity
            key={summary.date}
            onPress={() => setSelectedDate(summary.date)}
            style={[
              styles.card,
              selectedDate === summary.date && styles.cardSelected,
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.date}>{summary.date}</Text>
              <Text style={styles.badge}>£{summary.revenue.toFixed(2)}</Text>
            </View>
            <Text style={styles.metricLabel}>Orders</Text>
            <Text style={styles.metricValue}>{summary.orderCount}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onLiveOrders={() => {
          router.push("/dashboard");
          setSidebarVisible(false);
        }}
        onHistory={() => {
          router.push("/history");
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
        restaurantName=""
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
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
    flexShrink: 1,
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerTitle: {
    fontSize: 24,
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
  summaryHighlight: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.subtle,
  },
  highlightText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
    lineHeight: 22,
  },
  listContent: {
    paddingBottom: theme.spacing.xl * 1.4,
    paddingTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    shadowOpacity: 0.12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  date: {
    fontSize: 16,
    fontFamily: "Outfit_700Bold",
    color: theme.colors.text,
  },
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    backgroundColor: "#dbeafe",
    color: theme.colors.primaryDark,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    fontFamily: "Outfit_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: 28,
    fontFamily: "Outfit_700Bold",
    color: theme.colors.text,
    marginTop: 4,
  },
});
