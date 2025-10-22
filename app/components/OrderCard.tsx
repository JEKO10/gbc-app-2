import { Order } from "@/utils/types";
import { Picker } from "@react-native-picker/picker";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { statusOrder } from "@/constants/statusOrder";
import { theme } from "@/constants/theme";

const statusColors: Record<string, string> = {
  Pending: theme.colors.warning,
  Rejected: theme.colors.danger,
  Preparing: theme.colors.primaryDark,
  Ready: theme.colors.accent,
  Dispatched: theme.colors.primary,
  Completed: theme.colors.success,
  Cancelled: theme.colors.danger,
};

const formatStatus = (status?: string) => {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const OrderCard = React.memo(
  ({
    item,
    liveOrders,
    updateOrderStatus,
  }: // sdkVersion,
  {
    item: Order;
    liveOrders: Order[];
    updateOrderStatus: (id: string, status: string) => void;
    // sdkVersion: "v1" | "v2";
  }) => {
    const isLive = liveOrders.some((o) => o.id === item.id);
    const displayStatus = formatStatus(item.status);
    const statusColor =
      statusColors[displayStatus as keyof typeof statusColors] ||
      theme.colors.primary;
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

    const orderNumber = item.orderNumber?.split("-")[1] || item.orderNumber;

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.orderNumberRow}>
              <Text style={styles.orderId}>#{orderNumber}</Text>
              {isLive && <Text style={styles.liveBadge}>Live</Text>}
            </View>
            <Text style={styles.timestamp}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
            <Text style={styles.statusPillText}>{displayStatus}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Customer</Text>
            <Text style={styles.detailValue}>{item.user.name}</Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{item.user.phone}</Text>
          </View>
        </View>

        <View style={styles.detailBlockFull}>
          <Text style={styles.detailLabel}>Delivery Address</Text>
          <Text style={styles.detailValue}>
            {item.user.address || item.user.googleAddress}
          </Text>
        </View>

        {item.orderNote ? (
          <View style={styles.detailBlockFull}>
            <Text style={styles.detailLabel}>Special Notes</Text>
            <Text style={styles.detailValue}>{item.orderNote}</Text>
          </View>
        ) : null}

        <View style={styles.itemsContainer}>
          <Text style={styles.sectionTitle}>Items</Text>
          {item.items.map((itm, idx) => {
            const priceDisplay =
              typeof itm.price === "number"
                ? itm.price.toFixed(2)
                : itm.price;

            return (
              <View
                key={`${item.id}-item-${idx}`}
                style={[
                  styles.itemRow,
                  idx === item.items.length - 1 && styles.lastItemRow,
                ]}
              >
                <View>
                  <Text style={styles.itemName}>{itm.title}</Text>
                  <Text style={styles.itemMeta}>Qty {itm.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>£{priceDisplay}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.totalAmount}>
            Total £{(item.amount / 100).toFixed(2)}
          </Text>
        </View>

        {isLive && (
          <View style={styles.actionsSection}>
            {allowedStatuses.length > 0 && (
              <View style={styles.pickerContainer}>
                <Text style={styles.detailLabel}>Update Status</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={item.status}
                    style={styles.picker}
                    dropdownIconColor={theme.colors.primaryDark}
                    onValueChange={(value) => updateOrderStatus(item.id, value)}
                  >
                    {allowedStatuses.map((statusOption) => (
                      <Picker.Item
                        key={statusOption}
                        label={statusOption}
                        value={statusOption}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.printButton}>
              <Text style={styles.printButtonText}>Print Ticket</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
);

export default OrderCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    ...theme.shadow.card,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  orderNumberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderId: {
    fontFamily: "Outfit_700Bold",
    fontSize: 20,
    color: theme.colors.text,
  },
  liveBadge: {
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.accent,
    color: "#fff",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
  },
  timestamp: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.muted,
    fontFamily: "Outfit_400Regular",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  statusPillText: {
    color: "#fff",
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailBlock: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  detailBlockFull: {
    marginTop: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    fontFamily: "Outfit_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  detailValue: {
    fontSize: 15,
    color: theme.colors.text,
    fontFamily: "Outfit_400Regular",
    marginTop: 4,
    lineHeight: 20,
  },
  itemsContainer: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  lastItemRow: {
    borderBottomWidth: 0,
  },
  itemName: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
    color: theme.colors.text,
  },
  itemMeta: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  itemPrice: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
    color: theme.colors.primaryDark,
  },
  footerRow: {
    marginTop: theme.spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalAmount: {
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
    color: theme.colors.text,
  },
  actionsSection: {
    marginTop: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  pickerContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  pickerWrapper: {
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    overflow: "hidden",
    backgroundColor: "#f9fafb",
  },
  picker: {
    height: 44,
    color: theme.colors.text,
  },
  printButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
    ...theme.shadow.card,
  },
  printButtonText: {
    color: "#fff",
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
  },
});
