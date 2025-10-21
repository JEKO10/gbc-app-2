import type { Dispatch, SetStateAction } from "react";
import { Pusher, PusherEvent } from "@pusher/pusher-websocket-react-native";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Order } from "./types";
import { displayOrderNotification } from "@/notifications/orderNotifications";

type SetState<T> = Dispatch<SetStateAction<T>>;

export const setupPusher = async (
  restaurantId: string,
  restaurantName: string,
  setOrders: SetState<Order[]>,
  setSoundObj: SetState<Audio.Sound | null>,
  setIsPlaying: SetState<boolean>,
  // sdkVersion: "v1" | "v2",
  setPusherState: SetState<string>,
  setNotificationId: SetState<string | null>
): Promise<void> => {
  const pusher = Pusher.getInstance();

  setPusherState("Initializing...");

  console.log("🟡 Initializing Pusher...");

  try {
    await pusher.disconnect();
    console.log("🔌 Cleaned old connection");
  } catch (e) {
    console.log("⚠️ Disconnect error (ignored):", e);
  }

  await pusher.init({
    apiKey: "7c04fe4812262418fc07",
    cluster: "eu",
    useTLS: true,
    activityTimeout: 30000,
    pongTimeout: 10000,
    onConnectionStateChange: (state) => {
      setPusherState(state);
    },
    onError: () => {
      setPusherState("Error");
    },
  });

  console.log("🔌 Connecting to Pusher...");

  setPusherState("Connecting...");

  await pusher.connect();

  const channelName = `restaurant-${String(restaurantId)}`;
  console.log("📡 Subscribing to:", channelName);
  await pusher.unsubscribe({ channelName });

  await pusher.subscribe({
    channelName,
    onEvent: async (event: PusherEvent) => {
      if (event.eventName === "new-order") {
        const data: Order = JSON.parse(event.data);
        setOrders((prev) => {
          const exists = prev.some((order) => order.id === data.id);
          if (exists) return prev;
          return [data, ...prev];
        });

        // await printOrder(data);
        // await printOrder(data, sdkVersion);

        const notificationId = await displayOrderNotification({
          title: "📦 New Order Received!",
          body: `Order #${data.orderNumber.split("-")[1]} from ${
            data.user.name
          }`,
          data: {
            orderNumber: data.orderNumber,
            orderId: String(data.id),
            customerName: data.user.name,
          },
        });
        setNotificationId(notificationId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: false,
          });

          const { sound } = await Audio.Sound.createAsync(
            require("../assets/notification.mp3"),
            { isLooping: true, volume: 1.0 }
          );

          await sound.playAsync();
          setSoundObj(sound);
          setIsPlaying(true);

          setTimeout(async () => {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSoundObj(null);
            setIsPlaying(false);
          }, 10000);
        } catch (err) {
          console.error("🔊 Error playing notification sound", err);
        }
      }
    },
  });
};
