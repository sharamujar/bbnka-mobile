import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonChip,
  IonCard,
  IonCardContent,
  IonIcon,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonText,
  IonSearchbar,
  RefresherEventDetail,
  IonBadge,
  useIonToast,
  IonButton,
  IonRow,
  IonCol,
  IonGrid,
} from "@ionic/react";
import {
  timeOutline,
  calendarOutline,
  refreshOutline,
  documentTextOutline,
  chevronForwardOutline,
  cashOutline,
  cardOutline,
} from "ionicons/icons";
import { auth, db } from "../firebase-config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  writeBatch,
  doc,
  updateDoc,
} from "firebase/firestore";
import "./Orders.css";
import { useHistory } from "react-router-dom";

interface OrderItem {
  productPrice: number;
  productQuantity: number;
  productSize: string | { name: string };
  productVarieties: string[];
}

interface Order {
  id: string;
  createdAt: any;
  customerName: string;
  items: OrderItem[];
  orderDetails: {
    createdAt: string;
    pickupDate: string;
    pickupTime: string;
    paymentMethod: string;
    paymentStatus: string;
    totalAmount: number;
    pickupOption: string;
    gcashReference?: string;
    status: string; // User-friendly display name
    orderStatus: string; // Technical status value
    updatedAt?: string;
    statusTimestamps?: Record<string, any>; // Timestamps for each status change
    cancellationReason?: string;
    cancellationNote?: string;
    hasAppealed?: boolean; // Track if payment has been appealed
    appealTimestamp?: any; // Timestamp when appeal was submitted
  };
  userDetails?: {
    firstName: string;
    lastName: string;
    name?: string;
    email?: string;
  };
}

// Tab interface for order status
type OrderTab = "active" | "completed" | "cancelled";

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTab>("active");
  const [searchText, setSearchText] = useState("");
  const history = useHistory();
  const [present] = useIonToast();

  // Fetch orders for the logged-in user
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("userId", "==", user.uid),
      orderBy("orderDetails.createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const ordersList: Order[] = [];
        const batch = writeBatch(db);
        let hasPendingUpdates = false;

        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data() as Omit<Order, "id">;
          const order = {
            id: docSnapshot.id,
            ...data,
          } as Order;

          // Check if this is a GCash payment that's approved but still in awaiting_payment_verification status
          if (
            order.orderDetails.paymentMethod === "gcash" &&
            order.orderDetails.paymentStatus === "approved" &&
            order.orderDetails.orderStatus === "awaiting_payment_verification"
          ) {
            // Create or update statusTimestamps with current time for Order Confirmed
            const statusTimestamps = order.orderDetails.statusTimestamps || {};
            statusTimestamps["Order Confirmed"] = new Date();

            // Update the status in the batch
            const orderRef = doc(db, "orders", docSnapshot.id);
            batch.update(orderRef, {
              "orderDetails.status": "Order Confirmed",
              "orderDetails.orderStatus": "Order Confirmed",
              "orderDetails.updatedAt": new Date().toISOString(),
              "orderDetails.statusTimestamps": statusTimestamps,
            });

            // Update the order in memory too for immediate UI update
            order.orderDetails.status = "Order Confirmed";
            order.orderDetails.orderStatus = "Order Confirmed";
            order.orderDetails.statusTimestamps = statusTimestamps;

            hasPendingUpdates = true;
          }

          ordersList.push(order);
        });

        // Commit batch updates if needed
        if (hasPendingUpdates) {
          try {
            await batch.commit();
            console.log("Updated status for approved GCash payments");
          } catch (error) {
            console.error("Error updating order statuses:", error);
          }
        }

        setOrders(ordersList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        present({
          message: "Failed to load orders. Please try again.",
          duration: 3000,
          color: "danger",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [present]);

  const doRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        event.detail.complete();
        return;
      }

      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("userId", "==", user.uid),
        orderBy("orderDetails.createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const ordersList: Order[] = [];

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data() as Omit<Order, "id">;

        // Check if this is a GCash payment that's approved but still in awaiting_payment_verification status
        if (
          data.orderDetails.paymentMethod === "gcash" &&
          data.orderDetails.paymentStatus === "approved" &&
          data.orderDetails.orderStatus === "awaiting_payment_verification"
        ) {
          // Create or update statusTimestamps with current time for Order Confirmed
          const statusTimestamps = data.orderDetails.statusTimestamps || {};
          statusTimestamps["Order Confirmed"] = new Date();

          // Update the order in memory for immediate UI update
          data.orderDetails.status = "Order Confirmed";
          data.orderDetails.orderStatus = "Order Confirmed";
          data.orderDetails.statusTimestamps = statusTimestamps;

          // Also update in the database (don't wait for it)
          const orderRef = doc(db, "orders", docSnapshot.id);
          updateDoc(orderRef, {
            "orderDetails.status": "Order Confirmed",
            "orderDetails.orderStatus": "Order Confirmed",
            "orderDetails.updatedAt": new Date().toISOString(),
            "orderDetails.statusTimestamps": statusTimestamps,
          }).catch((error) => {
            console.error("Error updating order status:", error);
          });
        }

        ordersList.push({
          id: docSnapshot.id,
          ...data,
        } as Order);
      });

      setOrders(ordersList);
    } catch (error) {
      console.error("Error refreshing orders:", error);
      present({
        message: "Failed to refresh orders. Please try again.",
        duration: 3000,
        color: "danger",
      });
    } finally {
      event.detail.complete();
    }
  };

  const getStatusBadgeColor = (
    status: string,
    paymentMethod?: string,
    paymentStatus?: string,
    pickupOption?: string
  ) => {
    // Special case for GCash payments
    if (paymentMethod === "gcash") {
      // Rejected payment shows as danger/red
      if (paymentStatus === "rejected") {
        return "danger";
      }
      // Pending payment verification shows as warning/yellow
      else if (paymentStatus !== "approved") {
        return "warning";
      }
      // Approved payment but still in verification status shows as primary/blue
      else if (status === "awaiting_payment_verification") {
        return "primary";
      }
    }

    // Use status directly from database
    switch (status) {
      // Inventory system status values (prioritize these)
      case "Order Confirmed":
        return "primary";
      case "Stock Reserved":
        return "tertiary"; // A different color for stock reserved status
      case "Preparing Order":
        return "warning";
      case "Ready for Pickup":
        return "success";
      case "Completed":
        return "success";
      case "Cancelled":
        return "danger";

      // Mobile app status values (fallback)
      case "processing":
        return "warning";
      case "ready":
        return "success";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      case "awaiting_payment_verification":
        return "warning"; // Default is warning for awaiting verification
      case "scheduled":
        return "primary";
      default:
        return "medium";
    }
  };

  const getStatusText = (
    status: string,
    paymentMethod?: string,
    paymentStatus?: string,
    pickupOption?: string,
    hasAppealed?: boolean
  ) => {
    // First check if the order is already cancelled - this should override other status displays
    if (status === "cancelled" || status === "Cancelled") {
      return "Cancelled";
    }

    // Special case for GCash payments
    if (paymentMethod === "gcash") {
      // Rejected payment shows as "Cancelled" if it had been appealed and rejected
      if (paymentStatus === "rejected") {
        if (hasAppealed) {
          return "Cancelled";
        }
        return "Rejected - Action Required";
      }
      // Pending payment shows as "Pending"
      else if (paymentStatus !== "approved") {
        return "Pending Verification";
      }
      // Approved payment but still in verification status shows as "Order Confirmed"
      else if (status === "awaiting_payment_verification") {
        return "Order Confirmed";
      }
    }

    // Convert database status to user-friendly text
    switch (status) {
      // Inventory system status values - already in user-friendly format
      case "Order Confirmed":
      case "Stock Reserved":
      case "Preparing Order":
      case "Ready for Pickup":
      case "Completed":
        return status;

      // Mobile app status values
      case "processing":
        return "Preparing Order";
      case "ready":
        return "Ready for Pickup";
      case "completed":
        return "Completed";
      case "awaiting_payment_verification":
        return "Pending";
      case "scheduled":
        return "Order Confirmed";
      default:
        return "Order Confirmed";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format timestamp for order placement time
  const formatTimestamp = (timestamp: any) => {
    try {
      // Handle Firestore timestamp or date string
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

      // Format to show date and time (e.g. "Apr 15, 2:30 PM")
      return (
        date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }) +
        ", " +
        date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    } catch (error) {
      return "Unknown date";
    }
  };

  // Group orders by status, including search results if any
  const getOrdersByTab = () => {
    // First filter by search if there's a search term
    const searchFiltered = searchText
      ? orders.filter(
          (order) =>
            order.id.toLowerCase().includes(searchText.toLowerCase()) ||
            getStatusText(
              order.orderDetails.orderStatus,
              order.orderDetails.paymentMethod,
              order.orderDetails.paymentStatus,
              undefined,
              order.orderDetails.hasAppealed
            )
              .toLowerCase()
              .includes(searchText.toLowerCase())
        )
      : orders;

    // Then organize by tab
    if (activeTab === "active") {
      return searchFiltered.filter((order) => {
        // Get effective status from orderDetails.orderStatus
        const status = order.orderDetails.orderStatus;

        // Check if this is a rejected GCash appeal - treat as cancelled
        if (
          order.orderDetails.paymentMethod === "gcash" &&
          order.orderDetails.paymentStatus === "rejected" &&
          order.orderDetails.hasAppealed
        ) {
          return false; // Don't include in active tab
        }

        // Special case for GCash payments that have been approved but status not updated
        if (
          order.orderDetails.paymentMethod === "gcash" &&
          order.orderDetails.paymentStatus === "approved" &&
          !["completed", "cancelled", "Completed", "Cancelled"].includes(status)
        ) {
          return true; // Keep in active orders until explicitly completed or cancelled
        }

        // Handle both mobile app status values and inventory system status values
        const activeAppStatuses = [
          "scheduled",
          "processing",
          "ready",
          "awaiting_payment_verification",
        ];

        const activeInventoryStatuses = [
          "Order Confirmed",
          "Stock Reserved", // Include Stock Reserved as an active status
          "Preparing Order",
          "Ready for Pickup",
        ];

        return (
          activeAppStatuses.includes(status) ||
          activeInventoryStatuses.includes(status)
        );
      });
    } else if (activeTab === "completed") {
      return searchFiltered.filter((order) => {
        const status = order.orderDetails.orderStatus;
        return status === "completed" || status === "Completed";
      });
    } else {
      return searchFiltered.filter((order) => {
        const status = order.orderDetails.orderStatus;

        // Include orders that are explicitly cancelled
        if (status === "cancelled" || status === "Cancelled") {
          return true;
        }

        // Also include rejected GCash appeals as cancelled
        if (
          order.orderDetails.paymentMethod === "gcash" &&
          order.orderDetails.paymentStatus === "rejected" &&
          order.orderDetails.hasAppealed
        ) {
          return true;
        }

        return false;
      });
    }
  };

  const displayOrders = getOrdersByTab();

  // Get counts for each tab
  const activeCounts = orders.filter((order) => {
    const status = order.orderDetails.orderStatus;

    // Don't count rejected GCash appeals as active
    if (
      order.orderDetails.paymentMethod === "gcash" &&
      order.orderDetails.paymentStatus === "rejected" &&
      order.orderDetails.hasAppealed
    ) {
      return false;
    }

    // Special case for GCash payments that have been approved but status not updated
    if (
      order.orderDetails.paymentMethod === "gcash" &&
      order.orderDetails.paymentStatus === "approved" &&
      !["completed", "cancelled", "Completed", "Cancelled"].includes(status)
    ) {
      return true; // Count as active until explicitly completed or cancelled
    }

    // Handle both mobile app status values and inventory system status values
    const activeAppStatuses = [
      "scheduled",
      "processing",
      "ready",
      "awaiting_payment_verification",
    ];

    const activeInventoryStatuses = [
      "Order Confirmed",
      "Stock Reserved", // Include Stock Reserved in active count
      "Preparing Order",
      "Ready for Pickup",
    ];

    return (
      activeAppStatuses.includes(status) ||
      activeInventoryStatuses.includes(status)
    );
  }).length;

  const completedCounts = orders.filter((order) => {
    const status = order.orderDetails.orderStatus;
    return status === "completed" || status === "Completed";
  }).length;

  const cancelledCounts = orders.filter((order) => {
    const status = order.orderDetails.orderStatus;

    // Count explicitly cancelled orders
    if (status === "cancelled" || status === "Cancelled") {
      return true;
    }

    // Also count rejected GCash appeals as cancelled
    if (
      order.orderDetails.paymentMethod === "gcash" &&
      order.orderDetails.paymentStatus === "rejected" &&
      order.orderDetails.hasAppealed
    ) {
      return true;
    }

    return false;
  }).length;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Orders</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
          <IonRefresherContent
            pullingIcon={refreshOutline}
            pullingText="Pull to refresh"
            refreshingSpinner="circles"
            refreshingText="Refreshing..."
          ></IonRefresherContent>
        </IonRefresher>

        <div className="orders-container">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search orders..."
            animated
            className="orders-search"
          ></IonSearchbar>

          {/* Status tabs with counts */}
          <IonSegment
            value={activeTab}
            onIonChange={(e) => setActiveTab(e.detail.value as OrderTab)}
            className="order-tabs"
          >
            <IonSegmentButton value="active" className="tab-button">
              <div className="tab-content">
                <IonLabel>Active</IonLabel>
                {activeCounts > 0 && (
                  <IonChip className="count-chip">{activeCounts}</IonChip>
                )}
              </div>
            </IonSegmentButton>

            <IonSegmentButton value="completed" className="tab-button">
              <div className="tab-content">
                <IonLabel>Completed</IonLabel>
                {completedCounts > 0 && (
                  <IonChip className="count-chip">{completedCounts}</IonChip>
                )}
              </div>
            </IonSegmentButton>

            <IonSegmentButton value="cancelled" className="tab-button">
              <div className="tab-content">
                <IonLabel>Cancelled</IonLabel>
                {cancelledCounts > 0 && (
                  <IonChip className="count-chip">{cancelledCounts}</IonChip>
                )}
              </div>
            </IonSegmentButton>
          </IonSegment>

          {loading ? (
            <div className="orders-loading">
              {[...Array(3)].map((_, index) => (
                <IonCard key={index} className="order-mini-card skeleton">
                  <IonCardContent>
                    <div className="mini-card-content">
                      <div className="mini-card-row">
                        <IonSkeletonText
                          animated
                          style={{ width: "25%", height: "14px" }}
                        />
                        <IonSkeletonText
                          animated
                          style={{ width: "20%", height: "14px" }}
                        />
                      </div>

                      <div className="mini-card-row">
                        <div style={{ width: "70%" }}>
                          <IonSkeletonText
                            animated
                            style={{
                              width: "80%",
                              height: "13px",
                              marginBottom: "6px",
                            }}
                          />
                          <IonSkeletonText
                            animated
                            style={{ width: "50%", height: "13px" }}
                          />
                        </div>
                        <IonSkeletonText
                          animated
                          style={{
                            width: "20%",
                            height: "15px",
                            float: "right",
                          }}
                        />
                      </div>

                      <div className="mini-card-row items-row">
                        <IonSkeletonText
                          animated
                          style={{ width: "20%", height: "13px" }}
                        />
                        <IonSkeletonText
                          animated
                          style={{ width: "30%", height: "13px" }}
                        />
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          ) : displayOrders.length === 0 ? (
            <div className="orders-empty">
              <IonIcon
                icon={documentTextOutline}
                className="empty-orders-icon"
              />
              <IonText className="empty-orders-text">
                {searchText
                  ? "No orders match your search"
                  : `No ${activeTab} orders`}
              </IonText>
              {searchText && (
                <IonButton fill="clear" onClick={() => setSearchText("")}>
                  Clear Search
                </IonButton>
              )}
            </div>
          ) : (
            <div className="orders-list-mini">
              {displayOrders.map((order) => (
                <IonCard
                  key={order.id}
                  className="order-mini-card"
                  onClick={() => history.push(`/orders/${order.id}`)}
                >
                  <IonCardContent>
                    <div className="mini-card-content">
                      <div className="mini-card-row">
                        <div className="mini-order-id">#{order.id}</div>
                        <IonBadge
                          color={getStatusBadgeColor(
                            order.orderDetails.orderStatus,
                            order.orderDetails.paymentMethod,
                            order.orderDetails.paymentStatus
                          )}
                          className="mini-badge"
                        >
                          {order.orderDetails.orderStatus ===
                            "awaiting_payment_verification" &&
                          order.orderDetails.paymentStatus === "approved"
                            ? "Order Confirmed"
                            : getStatusText(
                                order.orderDetails.orderStatus,
                                order.orderDetails.paymentMethod,
                                order.orderDetails.paymentStatus,
                                order.orderDetails.pickupOption,
                                order.orderDetails.hasAppealed
                              )}
                        </IonBadge>
                      </div>

                      <div className="mini-card-row">
                        <div className="mini-order-details">
                          <div className="mini-order-date-time">
                            <IonIcon
                              icon={calendarOutline}
                              className="mini-icon"
                            />
                            {formatDate(order.orderDetails.pickupDate)}
                            <IonIcon
                              icon={timeOutline}
                              className="mini-icon with-margin"
                            />
                            {order.orderDetails.pickupTime}
                          </div>
                          <div className="mini-order-payment">
                            <IonIcon
                              icon={
                                order.orderDetails.paymentMethod === "cash"
                                  ? cashOutline
                                  : cardOutline
                              }
                              className="mini-icon"
                            />
                            {order.orderDetails.paymentMethod === "cash"
                              ? "Cash"
                              : "GCash"}
                            {order.orderDetails.paymentStatus && (
                              <span
                                className={`payment-status ${
                                  order.orderDetails.paymentMethod === "cash" &&
                                  (order.orderDetails.orderStatus ===
                                    "completed" ||
                                    order.orderDetails.orderStatus ===
                                      "Completed")
                                    ? "approved" // Use "approved" class for cash payments on completed orders
                                    : order.orderDetails.paymentStatus
                                }`}
                              >
                                •{" "}
                                {/* Show "Paid" for cash payments when order is completed */}
                                {order.orderDetails.paymentMethod === "cash" &&
                                (order.orderDetails.orderStatus ===
                                  "completed" ||
                                  order.orderDetails.orderStatus ===
                                    "Completed")
                                  ? "Paid"
                                  : order.orderDetails.paymentStatus ===
                                    "approved"
                                  ? "Paid"
                                  : order.orderDetails.paymentStatus ===
                                    "rejected"
                                  ? "Rejected"
                                  : "Pending"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mini-order-price">
                          ₱{order.orderDetails.totalAmount.toLocaleString()}
                        </div>
                      </div>

                      <div className="mini-card-row items-row">
                        <div className="mini-order-items">
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "item" : "items"}
                        </div>
                        <div className="view-details">
                          View details <IonIcon icon={chevronForwardOutline} />
                        </div>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Orders;
