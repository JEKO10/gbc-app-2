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
import messaging from "@react-native-firebase/messaging";
import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import notifee, { EventType, NotifeeEvent } from "@notifee/react-native";

import {
  displayRemoteMessageNotification,
  ensureOrderChannel,
} from "@/notifications/orderNotifications";
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
        if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
          const notificationId = detail.notification?.id;
          if (notificationId) {
            await notifee.cancelNotification(notificationId);
          }
        }
      }
    );

    const unsubscribeOnMessage = messaging().onMessage(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        try {
          await displayRemoteMessageNotification(remoteMessage);
        } catch (error: unknown) {
          console.error("📨 Failed to display foreground notification", error);
        }
      }
    );

    const unsubscribeOnTokenRefresh = messaging().onTokenRefresh(() => {
      // Ensure the notification channel exists when the messaging instance wakes up.
      ensureOrderChannel().catch((error: unknown) => {
        console.error("📡 Unable to refresh notification channel", error);
      });
    });

    messaging()
      .getInitialNotification()
      .then(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
        if (!remoteMessage) {
          return;
        }

        const notificationId = remoteMessage.messageId;
        if (notificationId) {
          await notifee.cancelDisplayedNotification(notificationId);
        }
      })
      .catch((error: unknown) => {
        console.error("📨 Failed to read initial notification", error);
      });

    const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        if (!remoteMessage?.messageId) {
          return;
        }
        await notifee.cancelDisplayedNotification(remoteMessage.messageId);
      }
    );

    return () => {
      unsubscribeForeground();
      unsubscribeOnMessage();
      unsubscribeOnTokenRefresh();
      unsubscribeOpenedApp();
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
