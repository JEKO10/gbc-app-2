import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Order } from "@/utils/types";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";

interface DailySummary {
  date: string;
  orderCount: number;
  revenue: number;
}

interface DecodedToken extends JwtPayload {
  name: string;
}

type SummaryWindow = "7d" | "30d" | "90d";

const WINDOW_OPTIONS: { label: string; value: SummaryWindow }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

export default function AllSummaryScreen() {
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("GBC Canteen");
  const [windowSize, setWindowSize] = useState<SummaryWindow>("7d");

  const router = useRouter();

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/login");
  };

  useEffect(() => {
    const fetchOrders = async () => {
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
        if (sortedSummaries.length > 0) {
          setSelectedDate((current) => current ?? sortedSummaries[0].date);
        } else {
          setSelectedDate(null);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  const filteredSummaries = useMemo(() => {
    const now = Date.now();
    const windowMs =
      windowSize === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : windowSize === "30d"
        ? 30 * 24 * 60 * 60 * 1000
        : 90 * 24 * 60 * 60 * 1000;

    return dailySummaries.filter(
      (summary) => now - new Date(summary.date).getTime() <= windowMs
    );
  }, [dailySummaries, windowSize]);

  useEffect(() => {
    if (selectedDate && filteredSummaries.length > 0) {
      const exists = filteredSummaries.some((summary) => summary.date === selectedDate);
      if (!exists) {
        setSelectedDate(filteredSummaries[0].date);
      }
    }
  }, [filteredSummaries, selectedDate]);

  const aggregate = useMemo(() => {
    const totalOrders = filteredSummaries.reduce(
      (sum, summary) => sum + summary.orderCount,
      0
    );
    const totalRevenue = filteredSummaries.reduce(
      (sum, summary) => sum + summary.revenue,
      0
    );
    const bestDay = filteredSummaries.reduce<DailySummary | null>((best, summary) => {
      if (!best || summary.revenue > best.revenue) {
        return summary;
      }
      return best;
    }, null);

    return {
      totalOrders,
      totalRevenue,
      averageDailyRevenue: filteredSummaries.length
        ? totalRevenue / filteredSummaries.length
        : 0,
      bestDay,
    };
  }, [filteredSummaries]);

  const totalForSelected = useMemo(() => {
    if (!selectedDate) return null;
    return dailySummaries.find((d) => d.date === selectedDate);
  }, [selectedDate, dailySummaries]);

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
            title="Performance"
            subtitle="Track revenue trends and peak service periods"
            onMenuPress={() => setSidebarVisible(true)}
            auxiliary={
              <View style={styles.restaurantBadge}>
                <Text style={styles.restaurantBadgeText}>{restaurantName}</Text>
              </View>
            }
          />

          <View style={styles.windowRow}>
            {WINDOW_OPTIONS.map((option) => {
              const active = windowSize === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.windowButton, active && styles.windowButtonActive]}
                  onPress={() => setWindowSize(option.value)}
                >
                  <Text
                    style={[
                      styles.windowButtonText,
                      active && styles.windowButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, styles.metricPrimary]}>
              <Text style={styles.metricLabel}>Total revenue</Text>
              <Text style={styles.metricValue}>£{aggregate.totalRevenue.toFixed(2)}</Text>
              <Text style={styles.metricHint}>Gross for selected window</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Orders</Text>
              <Text style={styles.metricValue}>{aggregate.totalOrders}</Text>
              <Text style={styles.metricHint}>Completed tickets</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Avg. daily</Text>
              <Text style={styles.metricValue}>
                £{aggregate.averageDailyRevenue.toFixed(2)}
              </Text>
              <Text style={styles.metricHint}>Revenue per day</Text>
            </View>
          </View>

          {aggregate.bestDay ? (
            <View style={styles.highlightCard}>
              <Text style={styles.highlightTitle}>Top performing day</Text>
              <Text style={styles.highlightDate}>{aggregate.bestDay.date}</Text>
              <Text style={styles.highlightValue}>
                £{aggregate.bestDay.revenue.toFixed(2)} · {aggregate.bestDay.orderCount} orders
              </Text>
            </View>
          ) : null}

          {totalForSelected ? (
            <View style={styles.selectedCard}>
              <Text style={styles.selectedTitle}>
                {new Date(totalForSelected.date).toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Text>
              <Text style={styles.selectedMetric}>
                Revenue: £{totalForSelected.revenue.toFixed(2)}
              </Text>
              <Text style={styles.selectedMetric}>
                Orders fulfilled: {totalForSelected.orderCount}
              </Text>
            </View>
          ) : null}
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily breakdown</Text>
            <Text style={styles.sectionCaption}>
              Tap a day to view metrics and compare performance across the selected window.
            </Text>
          </View>

          <View style={styles.dailyList}>
            {filteredSummaries.length === 0 ? (
              <View style={styles.emptyDailyState}>
                <Text style={styles.emptyDailyTitle}>No data available</Text>
                <Text style={styles.emptyDailyCaption}>
                  Adjust the reporting window to review days with completed orders.
                </Text>
              </View>
            ) : (
              filteredSummaries.map((summary) => {
                const isSelected = summary.date === selectedDate;
                const maxRevenue = Math.max(aggregate.bestDay?.revenue || 1, 1);
                return (
                  <TouchableOpacity
                    key={summary.date}
                    onPress={() => setSelectedDate(summary.date)}
                    activeOpacity={0.9}
                    style={[styles.dailyCard, isSelected && styles.dailyCardActive]}
                  >
                    <View style={styles.dailyRow}>
                      <View>
                        <Text style={styles.dailyDate}>{summary.date}</Text>
                        <Text style={styles.dailyOrders}>{summary.orderCount} orders</Text>
                      </View>
                      <Text style={styles.dailyRevenue}>
                        £{summary.revenue.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${Math.min(100, (summary.revenue / maxRevenue) * 100)}%` },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>

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
  windowRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  windowButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
  },
  windowButtonActive: {
    backgroundColor: "#2563eb",
  },
  windowButtonText: {
    fontSize: 13,
    color: "#475569",
    fontFamily: "Outfit_600SemiBold",
  },
  windowButtonTextActive: {
    color: "#fff",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  metricPrimary: {
    backgroundColor: "#2563eb",
  },
  metricLabel: {
    fontSize: 13,
    color: "#cbd5f5",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "Outfit_600SemiBold",
  },
  metricValue: {
    marginTop: 10,
    fontSize: 22,
    color: "#f8fafc",
    fontFamily: "Outfit_700Bold",
  },
  metricHint: {
    marginTop: 6,
    color: "#e0f2fe",
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
  },
  highlightCard: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  highlightTitle: {
    color: "#1d4ed8",
    fontSize: 13,
    textTransform: "uppercase",
    fontFamily: "Outfit_600SemiBold",
  },
  highlightDate: {
    marginTop: 6,
    color: "#0f172a",
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
  },
  highlightValue: {
    marginTop: 4,
    color: "#1d4ed8",
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
  },
  selectedCard: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: "#0f172a",
    padding: 18,
  },
  selectedTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
  },
  selectedMetric: {
    marginTop: 6,
    color: "#cbd5f5",
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    gap: 18,
  },
  sectionHeader: {
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#0f172a",
    fontFamily: "Outfit_700Bold",
  },
  sectionCaption: {
    marginTop: 6,
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Outfit_400Regular",
  },
  dailyList: {
    gap: 12,
  },
  emptyDailyState: {
    borderRadius: 22,
    backgroundColor: "#f8fafc",
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  emptyDailyTitle: {
    fontSize: 16,
    fontFamily: "Outfit_700Bold",
    color: "#0f172a",
  },
  emptyDailyCaption: {
    marginTop: 8,
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: "Outfit_400Regular",
  },
  dailyCard: {
    borderRadius: 22,
    backgroundColor: "#f8fafc",
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  dailyCardActive: {
    borderWidth: 2,
    borderColor: "#2563eb",
  },
  dailyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dailyDate: {
    fontSize: 16,
    color: "#0f172a",
    fontFamily: "Outfit_600SemiBold",
  },
  dailyOrders: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
  },
  dailyRevenue: {
    fontSize: 17,
    color: "#2563eb",
    fontFamily: "Outfit_700Bold",
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    marginTop: 14,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2563eb",
  },
});
