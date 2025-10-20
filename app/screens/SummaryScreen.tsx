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
        const res = await fetch("http://192.168.0.91:3000/api/orders", {
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
      <View style={styles.topBar}>
        <View style={styles.topWrapper}>
          <Image
            source={require("../../assets/images/small-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <TouchableOpacity
            onPress={() => setSidebarVisible(true)}
            style={styles.hamburgerWrapper}
          >
            <Text style={styles.hamburger}>☰</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.title}>📅 Daily Summary</Text>
        </View>
      </View>

      {selectedDate && totalForSelected && (
        <View style={styles.summaryHighlight}>
          <Text style={styles.highlightText}>
            On {selectedDate}, you earned £{totalForSelected.revenue.toFixed(2)}{" "}
            with {totalForSelected.orderCount} orders.
          </Text>
        </View>
      )}

      <ScrollView style={{ flex: 1 }}>
        {dailySummaries.map((summary) => (
          <TouchableOpacity
            key={summary.date}
            onPress={() => setSelectedDate(summary.date)}
            style={styles.card}
          >
            <Text style={styles.date}>{summary.date}</Text>
            <Text style={styles.metric}>Orders: {summary.orderCount}</Text>
            <Text style={styles.metric}>
              Revenue: £{summary.revenue.toFixed(2)}
            </Text>
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    fontFamily: "Outfit_400Regular",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 20,
    marginTop: 5,
    marginBottom: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  date: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },
  metric: { fontSize: 14, color: "#444" },
  topBar: {
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "flex-start",
  },
  topWrapper: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: "flex-start",
  },
  hamburgerWrapper: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    elevation: 2,
  },
  hamburger: {
    fontSize: 24,
    color: "#1f2937",
  },
  headerContent: {
    alignSelf: "flex-start",
  },
  summaryHighlight: {
    backgroundColor: "#e0ecff",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 25,
  },
  highlightText: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "bold",
  },
});
