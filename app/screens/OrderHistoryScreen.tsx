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

export default function OrderHistoryScreen() {
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        const res = await fetch("https://www.gbcanteen.com/api/orders", {
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

        <View>
          <Text style={styles.header}>🕓 Order History</Text>
        </View>
      </View>

      <FlatList
        data={historyOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No historical orders</Text>
        }
        renderItem={({ item }) => (
          <OrderCard
            item={item}
            liveOrders={[]}
            updateOrderStatus={() => {}}
            // sdkVersion="v2"
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
        printerStatus={""}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBar: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
  },
  topWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
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
  logo: {
    width: 100,
    height: 100,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#aaa",
    marginTop: 30,
    fontSize: 16,
  },
});
