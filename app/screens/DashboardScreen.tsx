import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  ScrollView,
  ToastAndroid,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { useRouter } from "expo-router";
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
} from "@notifee/react-native";
import { Audio } from "expo-av";
import OrderCard from "../components/OrderCard";

import { setupPusher } from "@/utils/pusher";
import { Order } from "@/utils/types";
import { statusOrder } from "@/constants/statusOrder";
import Sidebar from "../components/Sidebar";

interface DecodedToken extends JwtPayload {
  restaurantId: string;
  name: string;
}

const DashboardScreen = () => {
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending");
  const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [pusherState, setPusherState] = useState("Initializing...");
  const [notificationId, setNotificationId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const initNotifications = async () => {
      try {
        const settings = await notifee.requestPermission();

        if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
          console.warn("🔕 Notification permission denied");
          return;
        }

        if (Platform.OS === "android") {
          await notifee.createChannel({
            id: "orders",
            name: "New Order",
            sound: "default",
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            vibration: true,
          });
        }
      } catch (error) {
        console.error("🔔 Notification setup failed", error);
      }
    };

    initNotifications();
  }, []);

  useEffect(() => {
    const init = async (): Promise<void> => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (!decoded.restaurantId)
          throw new Error("Invalid token: no restaurant ID");

        setRestaurantName(decoded.name);
        setRestaurantId(decoded.restaurantId);

        await fetchOrders(token);
      } catch {
        Alert.alert("Session expired", "Please log in again.");
        await AsyncStorage.removeItem("token");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  useEffect(() => {
    if (!restaurantId) return;

    const initPusher = async () => {
      await setupPusher(
        restaurantId,
        restaurantName,
        setLiveOrders,
        setSoundObj,
        setIsPlaying,
        setPusherState,
        setNotificationId
      );
    };

    initPusher();
  }, [restaurantId, restaurantName]);

  const statusCounts = useMemo(
    () =>
      liveOrders.reduce((acc, order) => {
        const status = order.status || "Unknown";
        const key =
          status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    [liveOrders]
  );

  const metricsData = useMemo(
    () => [
      {
        key: "total",
        label: "Live Orders",
        value: liveOrders.length,
        accent: "#2563eb",
      },
      {
        key: "pending",
        label: "Pending",
        value: statusCounts["Pending"] ?? 0,
        accent: "#f97316",
      },
      {
        key: "preparing",
        label: "Preparing",
        value: statusCounts["Preparing"] ?? 0,
        accent: "#22c55e",
      },
      {
        key: "completed",
        label: "Completed",
        value: statusCounts["Completed"] ?? 0,
        accent: "#6366f1",
      },
    ],
    [liveOrders.length, statusCounts]
  );

  const connectionPalette = useMemo(() => {
    const normalized = pusherState.toLowerCase();

    if (normalized.includes("connect") && normalized.includes("ed")) {
      return {
        background: "rgba(34,197,94,0.18)",
        text: "#16a34a",
        dot: "#22c55e",
        label: "Connected",
      };
    }

    if (normalized.includes("connect")) {
      return {
        background: "rgba(250,204,21,0.18)",
        text: "#b45309",
        dot: "#fbbf24",
        label: "Connecting",
      };
    }

    if (normalized.includes("error")) {
      return {
        background: "rgba(248,113,113,0.18)",
        text: "#dc2626",
        dot: "#ef4444",
        label: "Connection Error",
      };
    }

    return {
      background: "rgba(148,163,184,0.22)",
      text: "#334155",
      dot: "#94a3b8",
      label: pusherState,
    };
  }, [pusherState]);

  const filterOrdersByStatus = useCallback(
    (status: string): void => {
      const filtered = liveOrders.filter(
        (order) =>
          order.status && order.status.toLowerCase() === status.toLowerCase()
      );
      setFilteredOrders(filtered);
    },
    [liveOrders]
  );

  useEffect(() => {
    filterOrdersByStatus(activeTab);
  }, [activeTab, filterOrdersByStatus, liveOrders]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setLiveOrders((currentLive) => {
        const updated: Order[] = [];
        for (const order of currentLive) {
          const createdTime = new Date(order.createdAt).getTime();
          if (now - createdTime <= 4 * 60 * 60 * 1000) {
            updated.push(order);
          }
        }

        return updated;
      });
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async (token: string) => {
    try {
      const res = await fetch("https://www.gbcanteen.com/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Unauthorized or server error");

      const data: Order[] = await res.json();
      const now = Date.now();

      const live = data.filter((order) => {
        const createdTime = new Date(order.createdAt).getTime();
        return now - createdTime <= 4 * 60 * 60 * 1000;
      });

      setLiveOrders(live);
    } catch {
      Alert.alert("Error", "Failed to fetch orders. Please try again.");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await fetch(
        `https://www.gbcanteen.com/api/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) throw new Error("Failed to update status in backend");

      setLiveOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      console.error("❌ Error updating order status:", err);
      Alert.alert("Error", "Failed to update order status.");
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/login");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.logoWrap}>
              <Image
                source={require("../../assets/images/small-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity
              onPress={() => setSidebarVisible(true)}
              style={styles.iconButton}
            >
              <Ionicons name="menu" size={22} color="#e2e8f0" />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroSubtitle}>Live order operations</Text>
          <Text style={styles.heroTitle}>
            {restaurantName || "GBC Canteen"}
          </Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="flash-outline" size={16} color="#facc15" />
              <Text style={styles.metaPillText}>
                {liveOrders.length} active {liveOrders.length === 1 ? "order" : "orders"}
              </Text>
            </View>
            <View
              style={[styles.statusChip, { backgroundColor: connectionPalette.background }]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: connectionPalette.dot }]}
              />
              <Text
                style={[styles.statusText, { color: connectionPalette.text }]}
              >
                {connectionPalette.label}
              </Text>
            </View>
          </View>

          <Text style={styles.heroHint}>
            Keep this screen open to receive instant notifications and audio alerts.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricList}
          style={styles.metricScroll}
        >
          {metricsData.map((metric) => (
            <View key={metric.key} style={styles.metricCard}>
              <View
                style={[styles.metricAccent, { backgroundColor: metric.accent }]}
              />
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabList}
        >
          {statusOrder.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab,
              ]}
            >
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
                {(statusCounts[tab] || 0) > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{statusCounts[tab]}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-outline" size={40} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No {activeTab} orders</Text>
              <Text style={styles.emptySubtitle}>
                Orders that match this status will appear here instantly.
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <OrderCard
              item={item}
              liveOrders={liveOrders}
              updateOrderStatus={updateOrderStatus}
            />
          )}
        />

        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onLiveOrders={() => {
            setActiveTab("Pending");
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
          pusherStatus={pusherState}
          restaurantName={restaurantName}
        />

        {soundObj && isPlaying && (
          <Modal animationType="fade" transparent visible>
            <View style={styles.modalOverlay}>
              <BlurView intensity={70} tint="dark" style={styles.blurBackdrop} />
              <View style={styles.modalContent}>
                <View style={styles.modalIconWrap}>
                  <Ionicons name="notifications-outline" size={26} color="#f97316" />
                </View>
                <Text style={styles.modalTitle}>New order received</Text>
                <Text style={styles.modalSubtitle}>
                  A customer is waiting—choose an action to keep the kitchen moving.
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.acceptButton]}
                    onPress={() => {
                      Alert.alert(
                        "Confirm Acceptance",
                        "Are you sure you want to accept this order?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel",
                          },
                          {
                            text: "Yes, Accept",
                            style: "default",
                            onPress: async () => {
                              if (soundObj) {
                                try {
                                  await soundObj.stopAsync();
                                  await soundObj.unloadAsync();
                                } catch (err) {
                                  console.error("🔊 Error stopping sound:", err);
                                }
                                setSoundObj(null);
                                setIsPlaying(false);
                              }

                              if (notificationId) {
                                await notifee.cancelNotification(notificationId);
                                setNotificationId(null);
                              }

                              const newestPending = [...liveOrders]
                                .filter((order) => order.status === "Pending")
                                .sort(
                                  (a, b) =>
                                    new Date(b.createdAt).getTime() -
                                    new Date(a.createdAt).getTime()
                                )[0];

                              if (newestPending) {
                                await updateOrderStatus(
                                  newestPending.id,
                                  "Preparing"
                                );
                                Platform.OS === "android"
                                  ? ToastAndroid.show(
                                      "Order accepted",
                                      ToastAndroid.SHORT
                                    )
                                  : Alert.alert(
                                      "Accepted",
                                      "Order moved to Preparing (Accepted)"
                                    );
                              } else {
                                Alert.alert(
                                  "No Pending Orders",
                                  "Nothing to accept."
                                );
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                    <Text style={styles.modalButtonText}>Accept Order</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.rejectButton]}
                    onPress={() => {
                      Alert.alert(
                        "Confirm Rejection",
                        "Are you sure you want to reject this order?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel",
                          },
                          {
                            text: "Yes, Reject",
                            style: "destructive",
                            onPress: async () => {
                              if (soundObj) {
                                try {
                                  await soundObj.stopAsync();
                                  await soundObj.unloadAsync();
                                } catch (err) {
                                  console.error("🔊 Error stopping sound:", err);
                                }
                                setSoundObj(null);
                                setIsPlaying(false);
                              }

                              if (notificationId) {
                                await notifee.cancelNotification(notificationId);
                                setNotificationId(null);
                              }

                              const newestPending = [...liveOrders]
                                .filter((order) => order.status === "Pending")
                                .sort(
                                  (a, b) =>
                                    new Date(b.createdAt).getTime() -
                                    new Date(a.createdAt).getTime()
                                )[0];

                              if (newestPending) {
                                await updateOrderStatus(
                                  newestPending.id,
                                  "Rejected"
                                );
                                Platform.OS === "android"
                                  ? ToastAndroid.show(
                                      "Order rejected",
                                      ToastAndroid.SHORT
                                    )
                                  : Alert.alert(
                                      "Rejected",
                                      "Order marked as Rejected"
                                    );
                              } else {
                                Alert.alert(
                                  "No Pending Orders",
                                  "Nothing to reject."
                                );
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#ffffff" />
                    <Text style={styles.modalButtonText}>Reject Order</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    flex: 1,
    backgroundColor: "#f4f6fb",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f6fb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#475569",
    fontFamily: "Outfit_400Regular",
  },
  heroCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 20,
    paddingBottom: 24,
    marginTop: 12,
    marginBottom: 18,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
  },
  logo: {
    width: 60,
    height: 60,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(148,163,184,0.24)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#94a3b8",
    fontFamily: "Outfit_400Regular",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 26,
    color: "#f8fafc",
    fontFamily: "Outfit_700Bold",
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    gap: 12,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(250,204,21,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 30,
    gap: 8,
  },
  metaPillText: {
    color: "#fde68a",
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 30,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
  },
  heroHint: {
    marginTop: 18,
    color: "#cbd5f5",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Outfit_400Regular",
  },
  metricScroll: {
    marginBottom: 8,
  },
  metricList: {
    paddingRight: 8,
    gap: 16,
  },
  metricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    minWidth: 130,
    shadowColor: "#1f2937",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  metricAccent: {
    width: 34,
    height: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: "Outfit_700Bold",
    color: "#0f172a",
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 13,
    color: "#475569",
    fontFamily: "Outfit_400Regular",
  },
  tabList: {
    paddingVertical: 10,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: "#e2e8f0",
  },
  activeTab: {
    backgroundColor: "#2563eb",
    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tabContent: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: "#475569",
  },
  activeTabText: {
    color: "#ffffff",
  },
  badge: {
    position: "absolute",
    top: -10,
    right: -18,
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Outfit_600SemiBold",
  },
  listContent: {
    paddingBottom: 160,
    paddingTop: 8,
  },
  emptyState: {
    marginTop: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Outfit_600SemiBold",
    color: "#1f2937",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: "Outfit_400Regular",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  blurBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: "86%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Outfit_700Bold",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: "Outfit_400Regular",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  acceptButton: {
    backgroundColor: "#16a34a",
  },
  rejectButton: {
    backgroundColor: "#dc2626",
  },
  modalButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Outfit_600SemiBold",
  },
});

export default DashboardScreen;
