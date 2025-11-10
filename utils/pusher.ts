import { Pusher, PusherEvent } from "@pusher/pusher-websocket-react-native";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Order } from "./types";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export const setupPusher = async (
  restaurantId: string,
  restaurantName: string,
  setOrders: SetState<Order[]>,
  setSoundObj: SetState<Audio.Sound | null>,
  setIsPlaying: SetState<boolean>,
  // sdkVersion: "v1" | "v2",
  setPusherState: SetState<string>,
  setNotificationId: SetState<string | null>,
  authToken: string
): Promise<void> => {
  const pusher = Pusher.getInstance();

  setPusherState("Initializing...");

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
    authEndpoint: "https://www.gbcanteen.com/api/pusher/auth",
    onConnectionStateChange: (state) => {
      setPusherState(state);
    },
    onError: () => {
      setPusherState("Error");
    },
    onAuthorizer: async (channelName, socketId) => {
      try {
        setPusherState("Authorizing...");

        const response = await fetch(
          "https://www.gbcanteen.com/api/pusher/auth",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              channel_name: channelName,
              socket_id: socketId,
              restaurantId,
              restaurantName,
            }),
          }
        );

        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(
            `Pusher auth failed (${response.status}): ${errorMessage}`
          );
        }

        const authData = await response.json();
        setPusherState("Authorized");
        return authData;
      } catch (error) {
        console.error("🔒 Pusher authorization failed", error);
        setPusherState("Auth Error");
        throw error;
      }
    },
  });

  console.log("🔌 Connecting to Pusher...");

  setPusherState("Connecting...");

  await pusher.connect();

  const channelName = `restaurant-${String(restaurantId)}`;
  console.log("📡 Subscribing to:", channelName);
  await pusher.unsubscribe({ channelName });
  const privateChannelName = `private-restaurant-${String(restaurantId)}`;
  const legacyChannelName = `restaurant-${String(restaurantId)}`;

  console.log("📡 Subscribing to:", privateChannelName);

  try {
    await pusher.unsubscribe({ channelName: legacyChannelName });
  } catch (error) {
    console.log("ℹ️ No legacy channel to unsubscribe", error);
  }

  try {
    await pusher.unsubscribe({ channelName: privateChannelName });
  } catch (error) {
    console.log("ℹ️ No existing private channel subscription", error);
  }

  await pusher.subscribe({
    channelName: privateChannelName,
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

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "📦 New Order Received!",
            body: `Order #${data.orderNumber.split("-")[1]} from ${
              data.user.name
            }`,
            sound: "default",
          },
          trigger: null,
        }).then((id) => setNotificationId(id));
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
          }, 50000);
        } catch (err) {
          console.error("🔊 Error playing notification sound", err);
        }
      }
    },
  });
};
