import notifee, { EventType, NotifeeEvent } from "@notifee/react-native";

notifee.onBackgroundEvent(async ({ type, detail }: NotifeeEvent) => {
  if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
    const notificationId = detail.notification?.id;
    if (notificationId) {
      await notifee.cancelNotification(notificationId);
    }
  }
});

export {};
