import React from "react";
import { View, Button, StyleSheet, Alert } from "react-native";
import { Asset } from "expo-asset";
import PrinterSDK from "react-native-printer-imin";

const PrintTestScreen = () => {
  const handleTestPrint = async () => {
    try {
      await PrinterSDK.initPrinter();

      const logoAsset = Asset.fromModule(
        require("../assets/images/small-logo.png")
      );
      await logoAsset.downloadAsync();
      const fileUri = logoAsset.localUri || logoAsset.uri;

      await PrinterSDK.printSingleBitmapBlackWhite(fileUri, {
        width: 384,
        height: 100,
      });

      await PrinterSDK.fullCut();

      Alert.alert("Success", "Logo printed!");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unknown error");
      console.error("Print error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="🖨️ Test Print Logo" onPress={handleTestPrint} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#f8f9fa",
  },
});

export default PrintTestScreen;
