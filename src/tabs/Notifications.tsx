import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonChip,
  IonCard,
  IonCardContent,
  IonSkeletonText,
  IonSpinner,
  useIonToast,
  RefresherEventDetail,
  IonBadge,
} from "@ionic/react";
import {
  notificationsOutline,
  checkmarkCircle,
  alertCircle,
  informationCircle,
  refreshOutline,
  timeOutline,
  arrowForwardOutline,
  checkmarkDoneOutline,
  closeCircle,
} from "ionicons/icons";
import { auth, db } from "../firebase-config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  updateDoc,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import "./Notifications.css";
import { useHistory } from "react-router-dom";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: any;
  orderId?: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [present] = useIonToast();
  const history = useHistory();

  // Fetch notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsList: Notification[] = [];

        snapshot.docs.forEach((docSnapshot) => {
          // Safely extract the data
          const data = docSnapshot.data();

          // Make sure createdAt is properly handled
          const createdAt = data.createdAt?.toDate
            ? data.createdAt
            : typeof data.createdAt === "string"
            ? new Date(data.createdAt)
            : new Date();

          notificationsList.push({
            id: docSnapshot.id,
            userId: data.userId || user.uid,
            title: data.title || "Notification",
            message: data.message || "",
            type: data.type || "info",
            isRead: data.isRead || false,
            createdAt: createdAt,
            orderId: data.orderId || undefined,
          });
        });

        // Sort by date (newest first) in case the order was disrupted
        notificationsList.sort((a, b) => {
          const dateA =
            a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB =
            b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

        setNotifications(notificationsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        present({
          message: "Failed to load notifications. Please try again.",
          duration: 3000,
          color: "danger",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [present]);

  // Mark notification as read
  const markAsRead = async (notification: Notification) => {
    try {
      if (notification.isRead) return;

      const notificationRef = doc(db, "notifications", notification.id);
      await updateDoc(notificationRef, {
        isRead: true,
      });

      // If it has an orderId, navigate to the order details
      if (notification.orderId) {
        history.push(`/orders/${notification.orderId}`);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      present({
        message: "Failed to update notification status.",
        duration: 2000,
        color: "danger",
      });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const unreadNotifications = notifications.filter(
        (notification) => !notification.isRead
      );

      if (unreadNotifications.length === 0) {
        present({
          message: "No unread notifications.",
          duration: 2000,
          color: "medium",
        });
        return;
      }

      const batch = writeBatch(db);
      unreadNotifications.forEach((notification) => {
        const notificationRef = doc(db, "notifications", notification.id);
        batch.update(notificationRef, { isRead: true });
      });

      await batch.commit();

      present({
        message: "All notifications marked as read.",
        duration: 2000,
        color: "success",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      present({
        message: "Failed to update notifications.",
        duration: 2000,
        color: "danger",
      });
    }
  };

  // Handle refresh
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        event.detail.complete();
        return;
      }

      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const notificationsList: Notification[] = [];

      snapshot.docs.forEach((docSnapshot) => {
        // Safely extract the data
        const data = docSnapshot.data();

        // Make sure createdAt is properly handled
        const createdAt = data.createdAt?.toDate
          ? data.createdAt
          : typeof data.createdAt === "string"
          ? new Date(data.createdAt)
          : new Date();

        notificationsList.push({
          id: docSnapshot.id,
          userId: data.userId || user.uid,
          title: data.title || "Notification",
          message: data.message || "",
          type: data.type || "info",
          isRead: data.isRead || false,
          createdAt: createdAt,
          orderId: data.orderId || undefined,
        });
      });

      // Sort by date (newest first) in case the order was disrupted
      notificationsList.sort((a, b) => {
        const dateA =
          a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB =
          b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setNotifications(notificationsList);

      present({
        message: "Notifications refreshed",
        duration: 1500,
        color: "success",
      });
    } catch (error) {
      console.error("Error refreshing notifications:", error);
      present({
        message: "Failed to refresh notifications. Please try again.",
        duration: 2000,
        color: "danger",
      });
    } finally {
      // Always complete the refresh
      event.detail.complete();
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string, title: string) => {
    // Special handling for order status updates
    if (title.includes("Order Status Updated")) {
      if (title.includes("Completed") || title.includes("Ready")) {
        return checkmarkCircle;
      } else if (title.includes("Cancelled")) {
        return closeCircle;
      } else if (title.includes("Preparing")) {
        return informationCircle;
      }
    }

    // Payment-related notifications
    if (title.includes("Payment Approved")) {
      return checkmarkCircle;
    }

    // Default behavior based on type
    switch (type) {
      case "success":
        return checkmarkCircle;
      case "error":
        return alertCircle;
      case "info":
        return informationCircle;
      default:
        return notificationsOutline;
    }
  };

  // Get color for notification type
  const getNotificationColor = (type: string, title: string) => {
    // Special handling for order status updates
    if (title.includes("Order Status Updated")) {
      if (title.includes("Completed") || title.includes("Ready for Pickup")) {
        return "success";
      } else if (title.includes("Cancelled")) {
        return "danger";
      } else if (title.includes("Preparing")) {
        return "warning";
      } else if (title.includes("Order Confirmed")) {
        return "primary";
      }
    }

    // Payment-related notifications
    if (title.includes("Payment Approved")) {
      return "success";
    }

    // Default behavior based on type
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "danger";
      case "info":
        return "primary";
      default:
        return "medium";
    }
  };

  // Format date for display
  const formatDate = (timestamp: any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

      // Calculate time difference
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

      if (diff < 60) {
        return "Just now";
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
      } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      } else if (diff < 604800) {
        const days = Math.floor(diff / 86400);
        return `${days} day${days > 1 ? "s" : ""} ago`;
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      }
    } catch (error) {
      return "Unknown date";
    }
  };

  // Get unread count
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  // Extract status attribute for CSS styling
  const getNotificationStatusAttribute = (
    title: string,
    message: string
  ): string => {
    if (title.includes("Order Status Updated")) {
      if (message.includes("Completed")) {
        return "completed";
      } else if (message.includes("Ready for Pickup")) {
        return "ready";
      } else if (message.includes("Cancelled")) {
        return "cancelled";
      } else if (message.includes("Preparing Order")) {
        return "preparing";
      } else if (message.includes("Order Confirmed")) {
        return "confirmed";
      }
    }
    return "";
  };

  // Extract payment attribute for CSS styling
  const getPaymentStatusAttribute = (title: string): string => {
    if (title.includes("Payment Approved")) {
      return "approved";
    }
    return "";
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            Notifications
            {unreadCount > 0 && (
              <IonBadge color="danger" className="notification-count-badge">
                {unreadCount}
              </IonBadge>
            )}
          </IonTitle>
          {notifications.length > 0 && (
            <IonButton
              slot="end"
              fill="clear"
              onClick={markAllAsRead}
              className="mark-all-read-button"
            >
              <IonIcon icon={checkmarkDoneOutline} />
            </IonButton>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={refreshOutline}
            pullingText="Pull to refresh"
            refreshingSpinner="circles"
            refreshingText="Refreshing..."
          ></IonRefresherContent>
        </IonRefresher>

        {loading ? (
          <div className="notifications-loading">
            {[...Array(3)].map((_, index) => (
              <IonCard key={index} className="notification-card skeleton">
                <IonCardContent>
                  <div className="notification-header">
                    <IonSkeletonText
                      animated
                      style={{ width: "60%", height: "16px" }}
                    />
                    <IonSkeletonText
                      animated
                      style={{ width: "20%", height: "14px" }}
                    />
                  </div>
                  <IonSkeletonText
                    animated
                    style={{ width: "100%", height: "20px", marginTop: "10px" }}
                  />
                  <div className="notification-footer">
                    <IonSkeletonText
                      animated
                      style={{ width: "30%", height: "12px" }}
                    />
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-notifications">
            <IonIcon icon={notificationsOutline} className="empty-icon" />
            <IonText className="empty-text">
              No notifications at this time
            </IonText>
            <p className="empty-subtext">
              We'll notify you about order updates, promotions, and more.
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <IonCard
                key={notification.id}
                className={`notification-card ${
                  notification.isRead ? "read" : "unread"
                }`}
                onClick={() => markAsRead(notification)}
                data-type={notification.type}
                data-status={getNotificationStatusAttribute(
                  notification.title,
                  notification.message
                )}
                data-payment={getPaymentStatusAttribute(notification.title)}
              >
                <IonCardContent>
                  <div className="notification-header">
                    <h3 className="notification-title">
                      <IonIcon
                        icon={getNotificationIcon(
                          notification.type,
                          notification.title
                        )}
                        color={getNotificationColor(
                          notification.type,
                          notification.title
                        )}
                        className="notification-icon"
                      />
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <IonChip
                        color="primary"
                        outline={true}
                        className="unread-chip"
                      >
                        New
                      </IonChip>
                    )}
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-footer">
                    <span className="notification-time">
                      <IonIcon icon={timeOutline} className="time-icon" />
                      {formatDate(notification.createdAt)}
                    </span>
                    {notification.orderId && (
                      <IonButton
                        fill="clear"
                        size="small"
                        className="view-order-btn"
                        color={getNotificationColor(
                          notification.type,
                          notification.title
                        )}
                      >
                        View Order Details
                        <IonIcon
                          slot="end"
                          icon={arrowForwardOutline}
                          className="view-icon"
                        />
                      </IonButton>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Notifications;
