import { Storage } from "@capacitor/storage";
import { auth } from "../firebase-config";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string; // Store as ISO string
  orderId?: string;
}

// Add a type for notification counter event listeners
type NotificationCountListener = (count: number) => void;

/**
 * Service for managing in-app notifications using local storage
 */
class NotificationService {
  private STORAGE_KEY = "notifications";
  private notificationCounter = 0;
  private countListeners: NotificationCountListener[] = [];

  /**
   * Get the full storage key for the current user
   */
  private getUserStorageKey(): string {
    const user = auth.currentUser;
    if (!user)
      throw new Error("User must be logged in to access notifications");
    return `${this.STORAGE_KEY}_${user.uid}`;
  }

  /**
   * Generate a unique ID for notifications
   * This uses a timestamp + counter approach instead of UUID
   */
  private generateNotificationId(): string {
    // Current timestamp in milliseconds
    const timestamp = Date.now();
    // Increment counter to ensure uniqueness even for notifications created at the same millisecond
    this.notificationCounter++;
    // Combine user ID fragment, timestamp and counter
    const user = auth.currentUser;
    const userFragment = user ? user.uid.substring(0, 5) : "guest";
    return `${userFragment}-${timestamp}-${this.notificationCounter}`;
  }

  /**
   * Add a new notification to the user's collection
   */
  async addNotification(
    notification: Omit<Notification, "id" | "userId" | "isRead" | "createdAt">
  ) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User must be logged in to add notification");
      }

      // Create full notification object with the new ID generation method
      const newNotification: Notification = {
        id: this.generateNotificationId(),
        userId: user.uid,
        title: notification.title,
        message: notification.message,
        type: notification.type || "info",
        isRead: false,
        createdAt: new Date().toISOString(),
        orderId: notification.orderId,
      };

      // Get existing notifications
      const notifications = await this.getNotifications();

      // Add new notification to the beginning of the array
      const updatedNotifications = [newNotification, ...notifications];

      // Save to storage
      await Storage.set({
        key: this.getUserStorageKey(),
        value: JSON.stringify(updatedNotifications),
      });

      // Notify listeners of the unread count change
      this.notifyCountChange();

      return newNotification.id;
    } catch (error) {
      console.error("Error adding notification:", error);
      throw error;
    }
  }

  /**
   * Get all notifications for the current user
   */
  async getNotifications(): Promise<Notification[]> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return [];
      }

      // Get notifications from storage
      const { value } = await Storage.get({
        key: this.getUserStorageKey(),
      });

      if (!value) {
        return [];
      }

      const notifications: Notification[] = JSON.parse(value);

      // Sort by date (newest first)
      return notifications.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const notifications = await this.getNotifications();

      // Update the notification
      const updatedNotifications = notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      );

      // Save to storage
      await Storage.set({
        key: this.getUserStorageKey(),
        value: JSON.stringify(updatedNotifications),
      });

      // Notify listeners of the unread count change
      this.notifyCountChange();

      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const notifications = await this.getNotifications();

      // Mark all as read
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        isRead: true,
      }));

      // Save to storage
      await Storage.set({
        key: this.getUserStorageKey(),
        value: JSON.stringify(updatedNotifications),
      });

      // Notify listeners of the unread count change
      this.notifyCountChange();

      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string) {
    try {
      const notifications = await this.getNotifications();

      // Filter out the notification to delete
      const updatedNotifications = notifications.filter(
        (notification) => notification.id !== notificationId
      );

      // Save to storage
      await Storage.set({
        key: this.getUserStorageKey(),
        value: JSON.stringify(updatedNotifications),
      });

      // Notify listeners of the unread count change
      this.notifyCountChange();

      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }

  /**
   * Clear all notifications for the current user
   */
  async clearAllNotifications() {
    try {
      // Just set an empty array
      await Storage.set({
        key: this.getUserStorageKey(),
        value: JSON.stringify([]),
      });

      // Notify listeners of the unread count change
      this.notifyCountChange();

      return true;
    } catch (error) {
      console.error("Error clearing notifications:", error);
      return false;
    }
  }

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter((notification) => !notification.isRead)
        .length;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  /**
   * Subscribe to changes in the unread notification count
   * @param listener Function to call when the count changes
   * @returns A function to unsubscribe the listener
   */
  onUnreadCountChange(listener: NotificationCountListener): () => void {
    this.countListeners.push(listener);

    // Immediately update with current count
    this.getUnreadCount().then((count) => {
      listener(count);
    });

    // Return unsubscribe function
    return () => {
      this.countListeners = this.countListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of a change in the unread count
   */
  private async notifyCountChange(): Promise<void> {
    if (this.countListeners.length === 0) return;

    const count = await this.getUnreadCount();
    this.countListeners.forEach((listener) => listener(count));
  }
}

export const notificationService = new NotificationService();
