import React, { useEffect } from "react";
import { Stack } from "expo-router";
import {
  useFonts,
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import * as SplashScreen from "expo-splash-screen";
import { View, ActivityIndicator, Platform } from "react-native";
import notifee, { EventType, NotifeeEvent } from "@notifee/react-native";

import "@/notifications/background";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const unsubscribeForeground = notifee.onForegroundEvent(
      async ({ type, detail }: NotifeeEvent) => {
        if (
          type === EventType.ACTION_PRESS ||
          type === EventType.PRESS
        ) {
          const notificationId = detail.notification?.id;
          if (notificationId) {
            await notifee.cancelNotification(notificationId);
          }
        }
      }
    );

    return () => {
      unsubscribeForeground();
    };
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  SplashScreen.hideAsync();

  return <Stack screenOptions={{ headerShown: false }} />;
}
