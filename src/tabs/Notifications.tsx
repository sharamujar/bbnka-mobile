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
  IonButton,
  IonChip,
  IonCard,
  IonCardContent,
  IonSkeletonText,
  IonBadge,
  useIonToast,
  RefresherEventDetail,
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
import { useHistory } from "react-router-dom";
import "./Notifications.css";
import {
  notificationService,
  Notification,
} from "../services/NotificationService";

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [present] = useIonToast();
  const history = useHistory();

  // Fetch notifications using our service
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const allNotifications = await notificationService.getNotifications();
      setNotifications(allNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      present({
        message: "Failed to load notifications",
        duration: 3000,
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark notification as read
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.id);

      // Update local state to show the notification as read
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
    }

    // Navigate to order details if this is an order notification
    if (notification.orderId) {
      history.push(`/orders/${notification.orderId}`);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => ({ ...n, isRead: true }))
      );

      present({
        message: "All notifications marked as read",
        duration: 2000,
        color: "success",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      present({
        message: "Failed to update notifications",
        duration: 2000,
        color: "danger",
      });
    }
  };

  // Handle refresh
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      await fetchNotifications();
      present({
        message: "Notifications refreshed",
        duration: 1500,
        color: "success",
      });
    } finally {
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
      const date = new Date(timestamp);

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
      console.error("Error formatting date:", error, timestamp);
      return "Unknown date";
    }
  };

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
                onClick={() => handleNotificationClick(notification)}
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
