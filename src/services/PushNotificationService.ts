import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  PushNotificationSchema,
  ActionPerformed,
} from "@capacitor/push-notifications";
import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, messaging } from "../firebase-config";

class PushNotificationService {
  private initialized = false;
  private vapidKey =
    "BNO8YyXrp-2f53nTMvqxP9Wbk8U3mKQuxU8pwns8o7R87D7K2LUDsDv_BKo8bNYN9ke0YgdvvKkvAQ2ofRNHiD0";

  async initialize() {
    if (this.initialized) return;

    if (Capacitor.getPlatform() !== "web") {
      // Request permission and register for push notifications
      await PushNotifications.requestPermissions();
      await PushNotifications.register();

      // Listen for push notification received
      PushNotifications.addListener(
        "pushNotificationReceived",
        (notification: PushNotificationSchema) => {
          console.log("Push notification received:", notification);
        }
      );

      // Listen for push notification tapped
      PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (notification: ActionPerformed) => {
          console.log("Push notification tapped:", notification);
          // Handle notification tap - e.g., navigate to specific screen
          if (notification.notification.data?.orderId) {
            // Navigate to order details
            window.location.href = `/orders/${notification.notification.data.orderId}`;
          }
        }
      );
    } else {
      // Web platform - use Firebase Cloud Messaging
      try {
        // Register service worker for FCM
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            {
              scope: "/",
            }
          );
          console.log("Service worker registered:", registration);
        }

        const permission = await Notification.requestPermission();
        console.log("Notification permission status:", permission);

        if (permission === "granted") {
          // Get FCM token
          const token = await getToken(messaging, {
            vapidKey: this.vapidKey,
          });

          console.log("FCM Token:", token);

          if (token) {
            await this.saveTokenToDatabase(token);
          } else {
            console.error("No registration token available");
          }

          // Handle foreground messages
          onMessage(messaging, (payload) => {
            console.log("Foreground message received:", payload);
            this.showNotification(payload);
          });
        } else {
          console.warn("Notification permission not granted");
        }
      } catch (error) {
        console.error("Error setting up Firebase messaging:", error);
      }
    }

    this.initialized = true;
  }

  private showNotification(payload: any) {
    // Display a notification for foreground messages
    const notificationTitle = payload.notification?.title || "New Notification";
    const notificationOptions = {
      body: payload.notification?.body || "",
      icon: "/favicon.png",
      data: payload.data,
    };

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notificationTitle, notificationOptions);
    }
  }

  private async saveTokenToDatabase(token: string) {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // Update existing user document with the new token
      await setDoc(
        userRef,
        {
          ...userDoc.data(),
          fcmToken: token,
          tokenUpdatedAt: new Date(),
        },
        { merge: true }
      );
      console.log("FCM token saved to database");
    }
  }

  async updateToken() {
    if (Capacitor.getPlatform() === "web") {
      try {
        const token = await getToken(messaging, {
          vapidKey: this.vapidKey,
        });

        if (token) {
          await this.saveTokenToDatabase(token);
          console.log("FCM token updated");
          return token;
        } else {
          console.error("No registration token available");
        }
      } catch (error) {
        console.error("Error updating FCM token:", error);
      }
    }
    return null;
  }
}

export const pushNotificationService = new PushNotificationService();
