import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onLiveOrders: () => void;
  onHistory: () => void;
  onLogout: () => void;
  onSummary: () => void;
  pusherStatus: string;
  printerStatus: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  visible,
  onClose,
  onLiveOrders,
  onHistory,
  onLogout,
  onSummary,
  pusherStatus,
  printerStatus,
}) => {
  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.sidebar}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Menu</Text>

          <TouchableOpacity onPress={onLiveOrders} style={styles.menuItem}>
            <Text style={styles.menuItemText}>📦 Live Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onHistory} style={styles.menuItem}>
            <Text style={styles.menuItemText}>📚 Order History</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSummary} style={styles.menuItem}>
            <Text style={styles.menuItemText}>💵 Summary</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onLogout} style={styles.menuItem}>
            <Text style={styles.menuItemText}>🚪 Logout</Text>
          </TouchableOpacity>

          <View style={styles.statusSection}>
            {pusherStatus && (
              <Text style={styles.statusText}>
                🔌 Notification: {pusherStatus}
              </Text>
            )}
            {printerStatus && (
              <Text style={styles.statusText}>🖨️ Printer: {printerStatus}</Text>
            )}
            <Text
              style={[
                styles.statusText,
                {
                  fontSize: 24,
                  textAlign: "center",
                  marginTop: 85,
                  color: "green",
                },
              ]}
            >
              To receive notifications stay on Live Orders page!
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sidebar: {
    height: "100%",
    width: "100%",
    backgroundColor: "white",
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  close: {
    fontSize: 24,
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    fontFamily: "Outfit_700Bold",
  },
  menuItem: {
    marginVertical: 10,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "#1f2937",
  },
  statusSection: {
    borderTopColor: "#eee",
    borderTopWidth: 1,
    paddingTop: 20,
  },
  statusText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "600",
    marginTop: 10,
    fontFamily: "Outfit_700Bold",
  },

  sidebarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    zIndex: 999,
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  sidebarHeader: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
    color: "#111",
  },
  sidebarItem: {
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});

export default Sidebar;
