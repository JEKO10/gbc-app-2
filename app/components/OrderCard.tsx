import { Order } from "@/utils/types";
import { Picker } from "@react-native-picker/picker";
import { printOrder } from "@/utils/print";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { statusOrder } from "@/constants/statusOrder";

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

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.orderId}>
              #{item.orderNumber.split("-")[1]}
            </Text>
            {isLive && <Text style={styles.liveBadge}>LIVE</Text>}
          </View>
          <Text style={styles.statusBadge}>{item.status}</Text>
        </View>

        <Text style={styles.orderInfo}>Customer: {item.user.name}</Text>
        <Text style={styles.orderInfo}>Phone: {item.user.phone}</Text>
        <Text style={styles.orderInfo}>
          Address: {item.user.address || item.user.googleAddress}
        </Text>
        <Text style={styles.orderInfo}>
          Time: {new Date(item.createdAt).toLocaleString()}
        </Text>
        {item.orderNote && (
          <Text style={styles.orderInfo}>Note: {item.orderNote}</Text>
        )}
        <Text style={styles.orderInfo}>Items:</Text>
        {item.items.map((itm, idx) => (
          <View key={idx} style={{ marginBottom: 6 }}>
            <Text style={styles.itemRow}>
              {itm.quantity}x {itm.title.toUpperCase()} {"  "} £{itm.price}
            </Text>
          </View>
        ))}
        <Text style={styles.totalAmount}>
          Total: £{(item.amount / 100).toFixed(2)}
        </Text>

        {isLive && (
          <>
            {allowedStatuses.length > 0 && (
              <Picker
                selectedValue={item.status}
                style={styles.picker}
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
            )}

            <TouchableOpacity
              style={{
                marginTop: 10,
                backgroundColor: "#007bff",
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: "center",
              }}
              onPress={() => printOrder(item)}
              // onPress={() => printOrder(item, sdkVersion)}
            >
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "Outfit_600SemiBold",
                  fontSize: 19,
                }}
              >
                Print
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }
);

export default OrderCard;

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderId: {
    fontFamily: "Outfit_700Bold",
    fontSize: 17,
    color: "#111",
  },
  statusBadge: {
    backgroundColor: "#007bff",
    color: "#fff",
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
    overflow: "hidden",
  },
  liveBadge: {
    marginLeft: 8,
    backgroundColor: "#E11D48",
    color: "#fff",
    fontFamily: "Outfit_600SemiBold",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 50,
    fontSize: 13,
  },
  orderInfo: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    color: "#444",
    marginBottom: 2,
  },
  itemRow: {
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    marginLeft: 8,
    color: "#111",
  },

  totalAmount: {
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
    marginTop: 10,
    color: "#111",
  },
  picker: {
    marginTop: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    height: 60,
    fontFamily: "Outfit_400Regular",
  },
});
