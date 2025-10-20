declare module "@notifee/react-native" {
  export enum EventType {
    UNKNOWN = 0,
    ACTION_PRESS = 1,
    DELIVERED = 2,
    PRESS = 3,
    DISMISSED = 4,
    APP_BLOCKED = 5,
  }

  export enum AndroidImportance {
    DEFAULT = 3,
    HIGH = 4,
  }

  export enum AndroidVisibility {
    PRIVATE = -1000,
    PUBLIC = 1,
  }

  export enum AuthorizationStatus {
    NOT_DETERMINED = 0,
    DENIED = 1,
    AUTHORIZED = 2,
    PROVISIONAL = 3,
  }

  export type NotificationDetail = {
    notification?: {
      id?: string;
    };
  };

  export type NotifeeEvent = {
    type: EventType;
    detail: NotificationDetail;
  };

  export type EventHandler = (event: NotifeeEvent) => void | Promise<void>;

  export type AndroidChannel = {
    id: string;
    name: string;
    sound?: string;
    importance?: AndroidImportance;
    visibility?: AndroidVisibility;
    vibration?: boolean;
  };

  export type DisplayNotificationOptions = {
    title: string;
    body?: string;
    android?: {
      channelId: string;
      sound?: string;
      pressAction?: { id: string };
    };
    ios?: {
      sound?: string;
    };
  };

  export function onForegroundEvent(handler: EventHandler): () => void;
  export function onBackgroundEvent(handler: EventHandler): void;
  export function requestPermission(): Promise<{ authorizationStatus: AuthorizationStatus }>;
  export function createChannel(channel: AndroidChannel): Promise<string>;
  export function cancelNotification(notificationId: string): Promise<void>;
  export function displayNotification(
    options: DisplayNotificationOptions
  ): Promise<string>;

  const notifee: {
    onForegroundEvent: typeof onForegroundEvent;
    onBackgroundEvent: typeof onBackgroundEvent;
    requestPermission: typeof requestPermission;
    createChannel: typeof createChannel;
    cancelNotification: typeof cancelNotification;
    displayNotification: typeof displayNotification;
  };

  export default notifee;
}
