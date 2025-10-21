import { Platform } from "react-native";
import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from "@notifee/react-native";
import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging";

export const ORDER_CHANNEL_ID = "orders";

export const ensureOrderChannel = async (): Promise<void> => {
  if (Platform.OS !== "android") {
    return;
  }

  await notifee.createChannel({
    id: ORDER_CHANNEL_ID,
    name: "New Order",
    sound: "default",
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
  });
};

type OrderNotificationInput = {
  title: string;
  body?: string;
  data?: Record<string, string> | undefined;
};

export const displayOrderNotification = async (
  notification: OrderNotificationInput
): Promise<string> => {
  await ensureOrderChannel();

  return notifee.displayNotification({
    ...notification,
    android: {
      channelId: ORDER_CHANNEL_ID,
      sound: "default",
      pressAction: {
        id: "default",
      },
    },
    ios: {
      sound: "default",
    },
    data: notification.data,
  });
};

export const displayRemoteMessageNotification = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<string> => {
  const { notification, data = {} } = remoteMessage;

  const title =
    notification?.title ??
    data.title ??
    "📦 New Order Received!";
  const body =
    notification?.body ??
    data.body ??
    (data.orderNumber
      ? `Order #${data.orderNumber} is waiting for action.`
      : "Tap to review the latest order.");

  return displayOrderNotification({
    title,
    body,
    data,
  });
};
