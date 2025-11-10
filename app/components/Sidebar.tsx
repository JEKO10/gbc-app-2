import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { theme } from "@/constants/theme";

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onLiveOrders: () => void;
  onHistory: () => void;
  onLogout: () => void;
  onSummary: () => void;
  pusherStatus: string;
  restaurantName: string;
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

  const statusColor = !pusherStatus
    ? theme.colors.muted
    : pusherStatus === "CONNECTED"
    ? theme.colors.accent
    : pusherStatus === "CONNECTING"
    ? theme.colors.warning
    : theme.colors.danger;

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sidebar}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Control Center</Text>
              <Text style={styles.subheading}>{restaurantName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuSection}>
            <TouchableOpacity onPress={onLiveOrders} style={styles.menuItem}>
              <Text style={styles.menuItemLabel}>Live Orders</Text>
              <Text style={styles.menuItemDescription}>
                Monitor and action real-time orders.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onHistory} style={styles.menuItem}>
              <Text style={styles.menuItemLabel}>Order History</Text>
              <Text style={styles.menuItemDescription}>
                Review completed activity and customer trends.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onSummary} style={styles.menuItem}>
              <Text style={styles.menuItemLabel}>Daily Summary</Text>
              <Text style={styles.menuItemDescription}>
                Track revenue and order volume by day.
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={styles.statusLabel}>Notification channel</Text>
            </View>
            <Text style={styles.statusValue}>
              {pusherStatus || "Unavailable"}
            </Text>
            <Text style={styles.statusHint}>
              Keep the Live Orders screen open to receive instant alerts.
            </Text>
          </View>

          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 24, 39, 0.45)",
  },
  backdrop: {
    flex: 1,
  },
  sidebar: {
    width: "78%",
    maxWidth: 420,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderTopLeftRadius: theme.radii.lg,
    borderBottomLeftRadius: theme.radii.lg,
    ...theme.shadow.card,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  heading: {
    fontSize: 24,
    fontFamily: "Outfit_700Bold",
    color: theme.colors.text,
  },
  subheading: {
    fontSize: 14,
    color: theme.colors.muted,
    fontFamily: "Outfit_400Regular",
    marginTop: theme.spacing.xs,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: theme.spacing.sm,
  },
  closeText: {
    fontSize: 24,
    color: theme.colors.muted,
  },
  menuSection: {
    marginTop: theme.spacing.md,
  },
  menuItem: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  menuItemLabel: {
    fontSize: 18,
    fontFamily: "Outfit_600SemiBold",
    color: theme.colors.text,
  },
  menuItemDescription: {
    fontSize: 13,
    color: theme.colors.muted,
    fontFamily: "Outfit_400Regular",
    marginTop: 4,
    lineHeight: 18,
  },
  statusCard: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.md,
    backgroundColor: "#eef2ff",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: theme.spacing.sm,
  },
  statusLabel: {
    fontSize: 13,
    color: theme.colors.muted,
    fontFamily: "Outfit_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statusValue: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  statusHint: {
    fontSize: 13,
    color: theme.colors.muted,
    fontFamily: "Outfit_400Regular",
    marginTop: theme.spacing.xs,
    lineHeight: 18,
  },
  logoutButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Outfit_600SemiBold",
    color: theme.colors.danger,
  },
});

export default Sidebar;
