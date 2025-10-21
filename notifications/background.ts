import messaging from "@react-native-firebase/messaging";
import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import notifee, { EventType, NotifeeEvent } from "@notifee/react-native";

import { displayRemoteMessageNotification } from "./orderNotifications";

messaging().setBackgroundMessageHandler(
  async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    try {
      await displayRemoteMessageNotification(remoteMessage);
    } catch (error: unknown) {
      console.error("📨 Failed to display background notification", error);
    }
  }
);

notifee.onBackgroundEvent(async ({ type, detail }: NotifeeEvent) => {
  if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
    const notificationId = detail.notification?.id;
    if (notificationId) {
      await notifee.cancelNotification(notificationId);
    }
  }
});

export {};
