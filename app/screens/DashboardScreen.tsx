import React, { useCallback, useEffect, useMemo, useState } from "react";
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

import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import OrderCard from "../components/OrderCard";

import { setupPusher } from "@/utils/pusher";
import { Order } from "@/utils/types";
import { statusOrder } from "@/constants/statusOrder";
import { theme } from "@/constants/theme";
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
  // const [sdkVersion, setSdkVersion] = useState<"v1" | "v2">("v2");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [pusherState, setPusherState] = useState("Initializing...");
  const [notificationId, setNotificationId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const initNotifications = async () => {
      await Notifications.requestPermissionsAsync();
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("orders", {
          name: "New Order",
          importance: Notifications.AndroidImportance.MAX,
          sound: "default",
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
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
        // sdkVersion,
        setPusherState,
        setNotificationId
      );
    };

    initPusher();
  }, [restaurantId]);

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
        const expired: Order[] = [];
        for (const order of currentLive) {
          const createdTime = new Date(order.createdAt).getTime();
          if (now - createdTime > 4 * 60 * 60 * 1000) {
            expired.push(order);
          } else {
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
      const res = await fetch("http://192.168.0.91:3000/api/orders", {
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
        `http://192.168.0.91:3000/api/orders/${orderId}`,
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

  const statusCounts: { [key: string]: number } = liveOrders.reduce(
    (acc, order) => {
      const status = order.status || "Unknown";
      const key =
        status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as { [key: string]: number }
  );

  const metrics = useMemo(
    () => [
      {
        label: "Live Orders",
        value: liveOrders.length,
        color: theme.colors.primary,
      },
      {
        label: "Pending",
        value: statusCounts["Pending"] || 0,
        color: theme.colors.warning,
      },
      {
        label: "Preparing",
        value: statusCounts["Preparing"] || 0,
        color: theme.colors.primaryDark,
      },
      {
        label: "Ready",
        value: statusCounts["Ready"] || 0,
        color: theme.colors.accent,
      },
    ],
    [
      liveOrders.length,
      statusCounts["Pending"] || 0,
      statusCounts["Preparing"] || 0,
      statusCounts["Ready"] || 0,
    ]
  );

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
              <Text style={styles.headerText}>Live Orders</Text>
              <Text style={styles.restaurantName}>{restaurantName}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setSidebarVisible(true)}
            style={styles.hamburgerWrapper}
          >
            <Text style={styles.hamburger}>☰</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusBanner}>
          <Text style={styles.statusLabel}>Notification Status</Text>
          <Text
            style={[
              styles.statusValue,
              pusherState === "CONNECTED"
                ? styles.statusConnected
                : pusherState === "CONNECTING"
                ? styles.statusConnecting
                : styles.statusOffline,
            ]}
          >
            {pusherState}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={[styles.metricValue, { color: metric.color }]}>
              {metric.value}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabList}
      >
        {statusOrder.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.activeTabText]}
            >
              {tab}
            </Text>
            {(statusCounts[tab] || 0) > 0 && (
              <View
                style={[styles.badge, activeTab === tab && styles.activeBadge]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    activeTab === tab && styles.activeBadgeText,
                  ]}
                >
                  {statusCounts[tab]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={7}
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle=
          {filteredOrders.length === 0
            ? styles.emptyContainer
            : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No {activeTab} orders</Text>
            <Text style={styles.emptySubtitle}>
              Orders that match this status will appear here instantly.
            </Text>
          </View>
        }
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
      />

      {soundObj && isPlaying && (
        <Modal animationType="fade" transparent={true} visible={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>
                New order received! Do you want to accept or reject it?
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.stopButton, { backgroundColor: "#10b981" }]}
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
                              await Notifications.dismissNotificationAsync(
                                notificationId
                              );
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
                  <Text style={styles.stopButtonText}>✅ Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.stopButton, { backgroundColor: "#ef4444" }]}
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
                              await Notifications.dismissNotificationAsync(
                                notificationId
                              );
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
                  <Text style={styles.stopButtonText}>❌ Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

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
    width: 64,
    height: 64,
  },
  headerText: {
    fontSize: 24,
    fontFamily: "Outfit_700Bold",
    color: theme.colors.text,
  },
  restaurantName: {
    fontSize: 15,
    color: theme.colors.muted,
    fontFamily: "Outfit_400Regular",
    marginTop: 4,
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
  statusBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.sm,
    backgroundColor: "#eef2ff",
  },
  statusLabel: {
    fontSize: 14,
    color: theme.colors.muted,
    fontFamily: "Outfit_600SemiBold",
  },
  statusValue: {
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    textTransform: "uppercase",
  },
  statusConnected: {
    color: theme.colors.accent,
  },
  statusConnecting: {
    color: theme.colors.warning,
  },
  statusOffline: {
    color: theme.colors.danger,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  metricCard: {
    width: "48%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  metricLabel: {
    fontSize: 13,
    color: theme.colors.muted,
    fontFamily: "Outfit_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 28,
    fontFamily: "Outfit_700Bold",
    marginTop: 4,
  },
  tabList: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: "#e5e7ff",
    marginRight: theme.spacing.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: theme.colors.primaryDark,
  },
  activeTabText: {
    color: "#fff",
  },
  badge: {
    marginLeft: theme.spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(37, 99, 235, 0.15)",
  },
  activeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Outfit_600SemiBold",
    color: theme.colors.primaryDark,
  },
  activeBadgeText: {
    color: "#fff",
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 1.5,
    paddingTop: theme.spacing.sm,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  emptyState: {
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
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: theme.radii.lg,
    padding: 30,
    alignItems: "center",
    width: "90%",
    maxWidth: 420,
  },
  modalSubtitle: {
    fontSize: 16,
    color: theme.colors.muted,
    fontFamily: "Outfit_400Regular",
    textAlign: "center",
    marginBottom: 18,
  },
  stopButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    alignItems: "center",
    marginHorizontal: theme.spacing.xs,
  },
  stopButtonText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Outfit_600SemiBold",
  },
});

export default DashboardScreen;
