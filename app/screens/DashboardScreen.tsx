import React, { useCallback, useEffect, useState } from "react";
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
import Sidebar from "../components/Sidebar";
import { Pusher } from "@pusher/pusher-websocket-react-native";

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

        // const version = await PrinterSDK.version;
        // setSdkVersion(version.toLowerCase().startsWith("v1") ? "v1" : "v2");
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

      const pusher = Pusher.getInstance();
      const payload = {
        orderId,
        status: newStatus,
        timestamp: new Date().toISOString(),
      };

      await pusher.trigger({
        channelName: `restaurant-${restaurantId}`,
        eventName: "order-status-update",
        data: JSON.stringify(payload),
      });

      console.log("📤 Sent status update:", payload);

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
          <Text style={styles.headerText}>Live Orders</Text>
          <Text style={styles.restaurantName}>{restaurantName}</Text>
          <Text
            style={[
              styles.restaurantName,
              {
                color:
                  pusherState === "CONNECTED"
                    ? "green"
                    : pusherState === "CONNECTING"
                    ? "orange"
                    : "red",
              },
            ]}
          >
            Notification Status: {pusherState}
          </Text>
        </View>
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
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={7}
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No {activeTab} orders</Text>
        }
        renderItem={({ item }) => {
          return (
            <OrderCard
              item={item}
              liveOrders={liveOrders}
              updateOrderStatus={updateOrderStatus}
              // sdkVersion={sdkVersion}
            />
          );
        }}
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

              <View style={{ flexDirection: "row", gap: 12 }}>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#dc2626",
  },

  modalSubtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },

  stopButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },

  stopButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },

  tabContent: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -22,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },

  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subheader: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
    marginBottom: 10,
  },

  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    fontFamily: "Outfit_400Regular",
  },

  restaurantName: {
    fontSize: 16,
    color: "#6b7280",
    fontFamily: "Outfit_400Regular",
  },

  logo: {
    width: 120,
    height: 120,
    alignSelf: "flex-start",
  },

  branding: {
    flex: 1,
    alignItems: "center",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pageTitle: { fontSize: 22, fontWeight: "bold" },
  statusText: { color: "#999", marginTop: 4 },
  tabList: {
    height: 60,
    flexDirection: "row",
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingHorizontal: 10,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    marginRight: 6,
    height: 32,
  },
  activeTab: {
    borderBottomWidth: 5,
    borderBottomColor: "#007bff",
    backgroundColor: "#e6f0ff",
  },
  tabItem: {
    marginRight: 20,
    paddingBottom: 5,
  },
  tabLabel: {
    fontSize: 16,
    color: "#888",
  },
  tabText: {
    fontSize: 15,
    lineHeight: 18,
    color: "#777",
    fontFamily: "Outfit_700Bold",
  },
  activeTabText: {
    color: "#007bff",
    fontWeight: "bold",
  },
  orderCard: {
    backgroundColor: "#f9f9f9",
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  orderId: { fontWeight: "bold" },
  statusBadge: {
    backgroundColor: "#007bff",
    color: "white",
    paddingHorizontal: 10,
    borderRadius: 20,
    fontSize: 12,
    paddingVertical: 2,
    overflow: "hidden",
  },
  orderInfo: { fontSize: 14, marginBottom: 2 },
  itemRow: { fontSize: 13, marginLeft: 8, color: "#444" },
  totalAmount: { fontWeight: "bold", marginTop: 6 },
  picker: { height: 70, width: "100%", marginTop: 10 },
  emptyText: { textAlign: "center", color: "#aaa", marginTop: 30 },
});

export default DashboardScreen;
