import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onLiveOrders: () => void;
  onHistory: () => void;
  onLogout: () => void;
  onSummary: () => void;
  pusherStatus: string;
  restaurantName?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  visible,
  onClose,
  onLiveOrders,
  onHistory,
  onLogout,
  onSummary,
  pusherStatus,
  restaurantName,
}) => {
  if (!visible) return null;

  const statusTone = (() => {
    const normalized = pusherStatus.toLowerCase();
    if (normalized.includes("connect") && normalized.includes("ed")) {
      return {
        background: "rgba(34,197,94,0.16)",
        text: "#16a34a",
        dot: "#22c55e",
        label: "Connected",
      };
    }

    if (normalized.includes("connect")) {
      return {
        background: "rgba(250,204,21,0.16)",
        text: "#b45309",
        dot: "#fbbf24",
        label: "Connecting",
      };
    }

    if (normalized.includes("error")) {
      return {
        background: "rgba(248,113,113,0.16)",
        text: "#dc2626",
        dot: "#ef4444",
        label: "Connection Issue",
      };
    }

    return {
      background: "rgba(148,163,184,0.22)",
      text: "#334155",
      dot: "#94a3b8",
      label: pusherStatus,
    };
  })();

  const menuItems = [
    {
      icon: "flash-outline" as const,
      label: "Live Orders",
      caption: "Monitor real-time tickets",
      onPress: onLiveOrders,
    },
    {
      icon: "time-outline" as const,
      label: "Order History",
      caption: "Review past orders",
      onPress: onHistory,
    },
    {
      icon: "podium-outline" as const,
      label: "Performance",
      caption: "Daily sales summary",
      onPress: onSummary,
    },
    {
      icon: "log-out-outline" as const,
      label: "Sign out",
      caption: "End operator session",
      onPress: onLogout,
    },
  ];

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <SafeAreaView style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(restaurantName || "GBC").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.drawerSubtitle}>Management Console</Text>
              <Text style={styles.drawerTitle}>
                {restaurantName || "GBC Canteen"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#1f2937" />
            </TouchableOpacity>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusTone.background }]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusTone.dot }]}
              />
              <Text style={[styles.statusLabel, { color: statusTone.text }]}>
                {statusTone.label}
              </Text>
            </View>
            <Text style={styles.statusHint}>
              Stay on Live Orders to keep notifications flowing.
            </Text>
          </View>

          <View style={styles.menuSection}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuButton}
                onPress={item.onPress}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={20} color="#1f2937" />
                </View>
                <View style={styles.menuTextWrapper}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuCaption}>{item.caption}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Need support? support@gbcanteen.com</Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(15,23,42,0.55)",
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    width: "78%",
    maxWidth: 420,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Outfit_700Bold",
  },
  headerTextGroup: {
    flex: 1,
  },
  drawerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Outfit_400Regular",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  drawerTitle: {
    fontSize: 20,
    color: "#0f172a",
    fontFamily: "Outfit_700Bold",
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(148,163,184,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: {
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
  },
  statusHint: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
    fontFamily: "Outfit_400Regular",
  },
  menuSection: {
    gap: 14,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(37,99,235,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuTextWrapper: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    color: "#0f172a",
    fontFamily: "Outfit_600SemiBold",
  },
  menuCaption: {
    fontSize: 13,
    color: "#64748b",
    fontFamily: "Outfit_400Regular",
    marginTop: 2,
  },
  footer: {
    marginTop: 32,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  footerText: {
    fontSize: 13,
    color: "#64748b",
    fontFamily: "Outfit_400Regular",
  },
});

export default Sidebar;
