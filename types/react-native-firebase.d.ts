declare module "@react-native-firebase/messaging" {
  export namespace FirebaseMessagingTypes {
    interface Notification {
      title?: string | undefined;
      body?: string | undefined;
    }

    interface RemoteMessage {
      messageId?: string;
      notification?: Notification;
      data?: Record<string, string> | undefined;
    }
  }

  type RemoteMessage = FirebaseMessagingTypes.RemoteMessage;

  interface MessagingModule {
    requestPermission(): Promise<number>;
    registerDeviceForRemoteMessages(): Promise<void>;
    getToken(): Promise<string>;
    onTokenRefresh(listener: (token: string) => void | Promise<void>): () => void;
    onMessage(
      listener: (message: RemoteMessage) => void | Promise<void>
    ): () => void;
    onNotificationOpenedApp(
      listener: (message: RemoteMessage) => void | Promise<void>
    ): () => void;
    getInitialNotification(): Promise<RemoteMessage | null>;
    setBackgroundMessageHandler(
      handler: (message: RemoteMessage) => void | Promise<void>
    ): void;
  }

  interface MessagingStatic extends MessagingModule {
    (): MessagingModule;
    AuthorizationStatus: {
      AUTHORIZED: number;
      PROVISIONAL: number;
      DENIED: number;
    };
  }

  const messaging: MessagingStatic;

  export default messaging;
  export { FirebaseMessagingTypes };
}
