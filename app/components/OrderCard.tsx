import { Order } from "@/utils/types";
import { Picker } from "@react-native-picker/picker";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { statusOrder } from "@/constants/statusOrder";
import { printOrder } from "@/utils/print";

const STATUS_COLORS: Record<string, { background: string; text: string }> = {
  Pending: { background: "#fef9c3", text: "#a16207" },
  Preparing: { background: "rgba(34, 197, 94, 0.12)", text: "#16a34a" },
  Ready: { background: "rgba(34, 197, 94, 0.12)", text: "#16a34a" },
  Completed: { background: "rgba(79, 70, 229, 0.12)", text: "#4f46e5" },
  Rejected: { background: "rgba(248, 113, 113, 0.14)", text: "#dc2626" },
  Cancelled: { background: "rgba(148, 163, 184, 0.16)", text: "#475569" },
};

const OrderCard = React.memo(
  ({
    item,
    liveOrders,
    updateOrderStatus,
    restaurantName,
  }: {
    item: Order;
    liveOrders: Order[];
    updateOrderStatus: (id: string, status: string) => void;
    restaurantName: string;
  }) => {
    const isLive = liveOrders.some((o) => o.id === item.id);
    const statusPalette = STATUS_COLORS[item.status] ??
      STATUS_COLORS.Pending ?? {
        background: "rgba(148,163,184,0.18)",
        text: "#334155",
      };

    const currentIndex = statusOrder.indexOf(item.status);
    let allowedStatuses = statusOrder.slice(currentIndex + 1);

    if (!allowedStatuses.includes("Cancelled")) {
      allowedStatuses.push("Cancelled");
    }
    if (!allowedStatuses.includes("Completed")) {
      allowedStatuses.push("Completed");
    }

    allowedStatuses = [
      item.status,
      ...allowedStatuses.filter((s) => s !== item.status),
    ];

    const orderNumber = item.orderNumber.split("-")[1] || item.orderNumber;
    const formattedTime = new Date(item.createdAt).toLocaleString();

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.orderIdPill}>
              <Text style={styles.orderIdText}>#{orderNumber}</Text>
            </View>
            {isLive && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>Live</Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: statusPalette.background },
            ]}
          >
            <Text style={[styles.statusText, { color: statusPalette.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="person-circle-outline" size={18} color="#1f2937" />
          <Text style={styles.metaText}>{item.user.name}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="call-outline" size={18} color="#1f2937" />
          <Text style={styles.metaText}>{item.user.phone}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={18} color="#1f2937" />
          <Text style={styles.metaText} numberOfLines={2}>
            {item.user.address || item.user.googleAddress || "Collection"}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={18} color="#1f2937" />
          <Text style={styles.metaText}>{formattedTime}</Text>
        </View>

        {item.orderNote ? (
          <View style={styles.noteBox}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#2563eb"
            />
            <Text style={styles.noteText}>{item.orderNote}</Text>
          </View>
        ) : null}

        <View style={styles.itemsWrapper}>
          <Text style={styles.sectionTitle}>Items</Text>
          {item.items.map((itm, idx) => (
            <View key={`${item.id}-${idx}`} style={styles.itemRow}>
              <Ionicons name="ellipse-outline" size={10} color="#94a3b8" />
              <Text style={styles.itemText}>
                {itm.quantity}× {itm.title} • £{itm.price}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            £{(item.amount / 100).toFixed(2)}
          </Text>
        </View>

        {isLive && (
          <>
            {allowedStatuses.length > 0 && (
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={item.status}
                  style={styles.picker}
                  dropdownIconColor="#2563eb"
                  onValueChange={(value) => updateOrderStatus(item.id, value)}
                >
                  {allowedStatuses.map((statusOption) => (
                    <Picker.Item
                      key={statusOption}
                      label={statusOption}
                      value={statusOption}
                      color="#0f172a"
                    />
                  ))}
                </Picker>
              </View>
            )}

            <TouchableOpacity
              style={styles.printButton}
              onPress={() => printOrder(item, restaurantName)}
            >
              <Ionicons name="print-outline" size={18} color="#ffffff" />
              <Text style={styles.printButtonText}>Print Ticket</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }
);

export default OrderCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 4,
    marginVertical: 10,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orderIdPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(37,99,235,0.12)",
  },
  orderIdText: {
    height: 25,
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    color: "#1d4ed8",
  },
  statusPill: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  liveBadgeText: {
    fontFamily: "Outfit_600SemiBold",
    color: "#15803d",
    fontSize: 13,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    fontFamily: "Outfit_400Regular",
    color: "#1f2937",
    fontSize: 14,
    flex: 1,
  },
  noteBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(37,99,235,0.08)",
    padding: 12,
    borderRadius: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  noteText: {
    flex: 1,
    fontFamily: "Outfit_400Regular",
    color: "#1d4ed8",
    fontSize: 13,
    lineHeight: 18,
  },
  itemsWrapper: {
    marginTop: 12,
  },
  sectionTitle: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  itemText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
    color: "#1f2937",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  totalLabel: {
    fontFamily: "Outfit_400Regular",
    color: "#64748b",
    fontSize: 14,
  },
  totalValue: {
    fontFamily: "Outfit_700Bold",
    color: "#111827",
    fontSize: 18,
  },
  pickerWrapper: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    backgroundColor: "#f8fafc",
  },
  picker: {
    height: 60,
    width: "100%",
    color: "#0f172a",
  },
  printButton: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  printButtonText: {
    color: "#ffffff",
    fontFamily: "Outfit_600SemiBold",
    fontSize: 16,
  },
});
