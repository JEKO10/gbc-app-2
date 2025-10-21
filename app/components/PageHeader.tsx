import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onMenuPress: () => void;
  auxiliary?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onMenuPress,
  auxiliary,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.brandWrap}>
        <Image
          source={require("../../assets/images/small-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.textGroup}>
          <Text style={styles.subtitle}>GBC Operator</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.caption}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.actions}>
        {auxiliary}
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <Ionicons name="menu" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 12,
  },
  textGroup: {
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "Outfit_400Regular",
  },
  title: {
    fontSize: 22,
    color: "#0f172a",
    fontFamily: "Outfit_700Bold",
  },
  caption: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
    fontFamily: "Outfit_400Regular",
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#fff",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
});

export default PageHeader;
