import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const sendPushNotification = functions.firestore
  .document("notifications/{userId}/items/{notificationId}")
  .onCreate(
    async (
      snap: functions.firestore.QueryDocumentSnapshot,
      context: functions.EventContext
    ) => {
      const notification = snap.data();
      const userId = context.params.userId;

      try {
        // Get the user's FCM token
        const userDoc = await admin
          .firestore()
          .collection("users")
          .doc(userId)
          .get();

        const userData = userDoc.data();
        if (!userData?.fcmToken) {
          console.log("No FCM token found for user:", userId);
          return;
        }

        // Prepare notification message
        const message = {
          token: userData.fcmToken,
          notification: {
            title: notification.title,
            body: notification.message,
          },
          data: {
            notificationId: context.params.notificationId,
            type: notification.type,
            orderId: notification.orderId || "",
          },
          android: {
            notification: {
              icon: "@drawable/ic_notification",
              color: "#FF9800",
              priority: "high" as const,
              defaultSound: true,
              channelId: "orders",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                badge: 1,
              },
            },
          },
        };

        // Send the notification
        const response = await admin.messaging().send(message);
        console.log("Successfully sent notification:", response);
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }
  );

// Manually send notification to a specific user
export const sendNotificationToUser = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    // Check if request is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    // Check if caller has admin rights
    const callerUid = context.auth.uid;
    const callerDoc = await admin
      .firestore()
      .collection("users")
      .doc(callerUid)
      .get();
    const callerData = callerDoc.data();

    if (!callerData?.isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can send notifications."
      );
    }

    const { userId, title, body, data: notificationData } = data;

    try {
      // Get user FCM token
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();
      const userData = userDoc.data();

      if (!userData?.fcmToken) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "The user doesn't have a registered FCM token."
        );
      }

      // Create the notification in Firestore first
      const notificationRef = admin
        .firestore()
        .collection("notifications")
        .doc(userId)
        .collection("items")
        .doc();

      await notificationRef.set({
        userId,
        title,
        message: body,
        type: notificationData.type || "info",
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        orderId: notificationData.orderId || null,
      });

      return { success: true, notificationId: notificationRef.id };
    } catch (error) {
      console.error("Error sending notification:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to send notification."
      );
    }
  }
);

// Send notification to a topic (e.g., all users, specific user groups)
export const sendNotificationToTopic = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    // Check if request is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    // Check if caller has admin rights
    const callerUid = context.auth.uid;
    const callerDoc = await admin
      .firestore()
      .collection("users")
      .doc(callerUid)
      .get();
    const callerData = callerDoc.data();

    if (!callerData?.isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can send notifications."
      );
    }

    const { topic, title, body, data: notificationData } = data;

    try {
      // Prepare the message
      const message = {
        topic,
        notification: {
          title,
          body,
        },
        data: notificationData || {},
        android: {
          notification: {
            icon: "@drawable/ic_notification",
            color: "#FF9800",
            priority: "high" as const,
            defaultSound: true,
            channelId: "general",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      // Send the notification
      const response = await admin.messaging().send(message);

      // For topic messages, we should also store them for users who are subscribed
      // to this topic so they appear in their notification history
      const usersSnapshot = await admin
        .firestore()
        .collection("users")
        .where("topics", "array-contains", topic)
        .get();

      const batch = admin.firestore().batch();

      usersSnapshot.forEach((userDoc) => {
        const userId = userDoc.id;
        const notificationRef = admin
          .firestore()
          .collection("notifications")
          .doc(userId)
          .collection("items")
          .doc();

        batch.set(notificationRef, {
          userId,
          title,
          message: body,
          type: notificationData.type || "info",
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          orderId: notificationData.orderId || null,
          fromTopic: topic,
        });
      });

      await batch.commit();

      return { success: true, response };
    } catch (error) {
      console.error("Error sending topic notification:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to send topic notification."
      );
    }
  }
);

// Trigger notification on order status change
export const orderStatusNotification = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(
    async (
      change: functions.Change<functions.firestore.QueryDocumentSnapshot>,
      context: functions.EventContext
    ) => {
      const orderId = context.params.orderId;
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // Check if status has changed
      if (
        beforeData.orderDetails.orderStatus ===
        afterData.orderDetails.orderStatus
      ) {
        console.log("Order status unchanged, skipping notification");
        return null;
      }

      const userId = afterData.userId;
      const newStatus = afterData.orderDetails.orderStatus;
      const orderNumber = orderId.substring(0, 6); // Use first 6 chars as readable ID

      try {
        // Get the user's FCM token
        const userDoc = await admin
          .firestore()
          .collection("users")
          .doc(userId)
          .get();

        const userData = userDoc.data();
        if (!userData?.fcmToken) {
          console.log("No FCM token found for user:", userId);
          return null;
        }

        // Format a user-friendly status message
        let statusMessage = "updated";
        switch (newStatus) {
          case "Order Confirmed":
          case "pending":
          case "scheduled":
            statusMessage = "Order Confirmed";
            break;
          case "Stock Reserved":
            statusMessage = "Stock Reserved";
            break;
          case "Preparing Order":
          case "processing":
            statusMessage = "Preparing Order";
            break;
          case "Ready for Pickup":
          case "ready":
            statusMessage = "Ready for Pickup";
            break;
          case "Completed":
          case "completed":
            statusMessage = "Completed";
            break;
          case "Cancelled":
          case "cancelled":
            statusMessage = "Cancelled";
            break;
          default:
            statusMessage = newStatus;
        }

        // Create a notification in Firestore
        const notificationRef = admin
          .firestore()
          .collection("notifications")
          .doc(userId)
          .collection("items")
          .doc();

        await notificationRef.set({
          userId,
          title: "Order Status Updated",
          message: `Your order #${orderNumber} status has been updated to: ${statusMessage}`,
          type: "info",
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          orderId,
        });

        console.log(`Created order status notification for order ${orderId}`);
        return null;
      } catch (error) {
        console.error("Error creating order status notification:", error);
        return null;
      }
    }
  );
