import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonChip,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonLoading,
  IonAlert,
  useIonToast,
  IonNote,
  IonBadge,
  IonAvatar,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from "@ionic/react";
import {
  timeOutline,
  calendarOutline,
  cashOutline,
  cardOutline,
  locationOutline,
  chevronBackOutline,
  receiptOutline,
  checkmarkCircle,
  closeCircle,
  timerOutline,
  chevronForwardOutline,
  bagHandleOutline,
  personOutline,
  arrowUndoOutline,
  alertCircleOutline,
  cafeOutline,
  flagOutline,
  bagCheckOutline,
  checkmarkCircleOutline,
  restaurantOutline,
  checkmarkDoneOutline,
  hourglassOutline,
  informationCircleOutline,
} from "ionicons/icons";
import { useParams, useHistory } from "react-router-dom";
import {
  doc,
  getDoc,
  Timestamp,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase-config";
import "./OrderDetail.css";

interface OrderItem {
  productPrice: number;
  productQuantity: number;
  productSize: string | { name: string };
  productVarieties: string[];
}

interface Order {
  id: string;
  status: string;
  items: OrderItem[];
  createdAt: any;
  customerName: string;
  orderDetails: {
    createdAt: string;
    pickupDate: string;
    pickupTime: string;
    paymentMethod: string;
    paymentStatus: string;
    totalAmount: number;
    pickupOption: string;
    gcashReference?: string;
    status?: string;
    updatedAt?: string;
  };
  userDetails?: {
    firstName: string;
    lastName: string;
    name?: string;
    email?: string;
  };
  trackingStatus?: string;
}

interface OrderTrackingProgressProps {
  currentStatus: string;
  paymentStatus: string;
  createdAt: any;
  orderId: string;
}

const OrderTrackingProgress: React.FC<OrderTrackingProgressProps> = ({
  currentStatus,
  paymentStatus,
  createdAt,
  orderId,
}) => {
  // Order step definitions - standardized to match inventory system
  const orderSteps = [
    {
      label: "Order Placed",
      icon: receiptOutline,
      description: "Your order has been received",
    },
    {
      label: "Order Confirmed",
      icon: checkmarkCircleOutline,
      description: "Your order has been confirmed",
    },
    {
      label: "Preparing Order",
      icon: restaurantOutline,
      description: "Your order is being prepared",
    },
    {
      label: "Ready for Pickup",
      icon: bagHandleOutline,
      description: "Your order is ready for pickup",
    },
    {
      label: "Completed",
      icon: checkmarkDoneOutline,
      description: "Order has been completed",
    },
  ];

  // Handle cancelled as a special case
  const isCancelled =
    currentStatus === "Cancelled" || currentStatus === "cancelled";

  // If GCash payment and not approved, show special "Pending" step
  const isGcashPending =
    currentStatus === "awaiting_payment_verification" ||
    (paymentStatus === "pending" && currentStatus !== "cancelled");

  // Calculate the current step index
  const getCurrentStepIndex = () => {
    if (isCancelled) {
      return -1; // Special value for cancelled
    }

    if (isGcashPending) {
      return -2; // Special value for pending payment
    }

    // Map status directly to step index
    switch (currentStatus) {
      // Mobile app status display format and Inventory system status values
      case "Order Placed":
        return 0;
      case "Order Confirmed":
        return 1;
      case "Preparing Order":
        return 2;
      case "Ready for Pickup":
        return 3;
      case "Completed":
        return 4;

      // Mobile app status values
      case "scheduled":
        return 0;
      case "pending":
        return 1;
      case "processing":
        return 2;
      case "ready":
        return 3;
      case "completed":
        return 4;
      case "awaiting_payment_verification":
        return 0; // Map to Order Placed but will be displayed as pending payment

      case "Cancelled":
        return -1; // Special value for cancelled

      default:
        return 0; // Default to first step
    }
  };

  const currentStepIndex = getCurrentStepIndex();

  // Format date helper function
  const formatDate = (timestamp: any): string => {
    try {
      // Handle Firestore timestamp
      if (timestamp?.toDate) {
        const date = timestamp.toDate();
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }

      // Handle date string
      if (typeof timestamp === "string") {
        const date = new Date(timestamp);
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }

      // Handle Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }

      return "";
    } catch (error) {
      return "";
    }
  };

  // Calculate dates for each step
  const getStepDate = (stepIndex: number): string => {
    // All orders have a createdAt timestamp for the first step
    if (stepIndex === 0) {
      return formatDate(createdAt);
    }

    // For subsequent steps, we'd ideally fetch timestamps from backend
    // This is a placeholder for demonstration
    if (stepIndex <= currentStepIndex) {
      let baseDate: Date;

      // Generate a consistent base date from the createdAt timestamp
      if (createdAt?.toDate) {
        baseDate = createdAt.toDate();
      } else if (typeof createdAt === "string") {
        baseDate = new Date(createdAt);
      } else if (createdAt instanceof Date) {
        baseDate = createdAt;
      } else {
        return "";
      }

      // Add time for each step
      const simulatedDate = new Date(baseDate);
      simulatedDate.setMinutes(simulatedDate.getMinutes() + stepIndex * 30);
      return formatDate(simulatedDate);
    }

    return ""; // No date for future steps
  };

  return (
    <div className="order-detail-progress-container vertical">
      {isCancelled && (
        <div className="order-detail-cancelled-badge">
          <IonChip color="danger" className="cancelled-chip">
            <IonIcon icon={closeCircle} />
            Order Cancelled
          </IonChip>
        </div>
      )}

      {/* {isGcashPending && (
        <div className="order-detail-cancelled-badge">
          <IonChip color="warning" className="pending-chip">
            <IonIcon icon={hourglassOutline} />
            Payment Verification Pending
          </IonChip>
        </div>
      )} */}

      <div className="order-detail-steps-vertical">
        {orderSteps.map((step, index) => {
          // For cancelled orders, all steps are inactive
          const isActive = currentStepIndex === index;
          const isCompleted = !isCancelled && currentStepIndex > index;
          const isPending = isGcashPending && index === 0; // Only first step affected by pending

          // Special handling for GCash pending
          if (isPending) {
            return (
              <div key={index} className="order-detail-step-vertical pending">
                <div className="order-detail-step-content">
                  <div className="order-detail-step-icon-vertical">
                    <IonIcon icon={hourglassOutline} />
                  </div>
                  <div className="order-detail-step-info">
                    <div className="order-detail-step-label-vertical">
                      Pending
                    </div>
                    <div className="order-detail-step-desc">
                      Waiting for payment verification
                      <span className="order-detail-step-date">
                        {getStepDate(0)}
                      </span>
                    </div>
                  </div>
                </div>
                {index < orderSteps.length - 1 && (
                  <div className="order-detail-step-line-vertical" />
                )}
              </div>
            );
          }

          return (
            <div
              key={index}
              className={`order-detail-step-vertical ${
                isActive ? "active" : ""
              } ${isCompleted ? "completed" : ""} ${
                isCancelled ? "cancelled" : ""
              }`}
            >
              <div className="order-detail-step-content">
                <div className="order-detail-step-icon-vertical">
                  <IonIcon icon={step.icon} />
                </div>
                <div className="order-detail-step-info">
                  <div className="order-detail-step-label-vertical">
                    {step.label}
                  </div>
                  <div className="order-detail-step-desc">
                    {step.description}
                    {(isCompleted || isActive) && (
                      <span className="order-detail-step-date">
                        {getStepDate(index)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {index < orderSteps.length - 1 && (
                <div
                  className={`order-detail-step-line-vertical ${
                    isCompleted ? "completed" : ""
                  } ${isCancelled ? "cancelled" : ""}`}
                />
              )}
            </div>
          );
        })}

        {/* Cancelled step only shown when order is cancelled */}
        {isCancelled && (
          <div className="order-detail-step-vertical active cancelled">
            <div className="order-detail-step-content">
              <div className="order-detail-step-icon-vertical">
                <IonIcon icon={closeCircle} />
              </div>
              <div className="order-detail-step-info">
                <div className="order-detail-step-label-vertical">
                  Cancelled
                </div>
                <div className="order-detail-step-desc">
                  Order has been cancelled
                  <span className="order-detail-step-date">
                    {getStepDate(5)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [present] = useIonToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Fetch order details
  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Please log in to view your order");
        setLoading(false);
        return;
      }

      const orderDocRef = doc(db, "orders", id);
      const orderDoc = await getDoc(orderDocRef);

      if (!orderDoc.exists()) {
        setError("Order not found");
        setLoading(false);
        return;
      }

      const orderData = orderDoc.data() as Omit<Order, "id">;
      const orderWithId = { id: orderDoc.id, ...orderData } as Order;

      setOrder(orderWithId);
    } catch (error) {
      console.error("Error fetching order:", error);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  // Also set up a real-time listener to get live updates
  useEffect(() => {
    // Run the initial fetch
    fetchOrderDetails();

    const user = auth.currentUser;
    if (!user || !id) return;

    // Set up real-time listener for status updates
    const orderDocRef = doc(db, "orders", id);

    // Track the previous order status to detect changes
    let previousStatus: string | null = null;
    let previousPaymentStatus: string | null = null;

    const unsubscribe = onSnapshot(orderDocRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const orderData = docSnapshot.data() as Omit<Order, "id">;
        const orderWithId = { id: docSnapshot.id, ...orderData } as Order;

        // Get current status
        const currentStatus =
          orderWithId.orderDetails.status || orderWithId.status;
        const currentPaymentStatus = orderWithId.orderDetails.paymentStatus;

        // If this is not the initial load (previousStatus exists)
        // and the status has changed, create a notification
        if (previousStatus !== null && previousStatus !== currentStatus) {
          // Create a notification for the status change
          try {
            const notificationsRef = collection(db, "notifications");
            const statusMessage = getStatusText(
              currentStatus,
              orderWithId.orderDetails.paymentMethod,
              orderWithId.orderDetails.paymentStatus
            );

            await addDoc(notificationsRef, {
              userId: user.uid,
              title: "Order Status Updated",
              message: `Your order #${id.substring(
                0,
                6
              )} status has been updated to: ${statusMessage}`,
              type: "info",
              createdAt: serverTimestamp(),
              isRead: false,
              orderId: id,
            });
          } catch (error) {
            console.error("Error creating status notification:", error);
          }
        }

        // Check for payment status changes specifically for GCash orders
        if (
          orderWithId.orderDetails.paymentMethod === "gcash" &&
          previousPaymentStatus !== null &&
          previousPaymentStatus !== currentPaymentStatus &&
          currentPaymentStatus === "approved"
        ) {
          // Create a notification for payment approval
          try {
            const notificationsRef = collection(db, "notifications");
            await addDoc(notificationsRef, {
              userId: user.uid,
              title: "Payment Approved",
              message: `Your GCash payment for order #${id.substring(
                0,
                6
              )} has been approved.`,
              type: "success",
              createdAt: serverTimestamp(),
              isRead: false,
              orderId: id,
            });
          } catch (error) {
            console.error("Error creating payment notification:", error);
          }
        }

        // Update previous status for next comparison
        previousStatus = currentStatus;
        previousPaymentStatus = currentPaymentStatus;

        // Update order in state
        setOrder(orderWithId);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      await fetchOrderDetails();
    } finally {
      event.detail.complete();
    }
  };

  const getStatusColor = (
    status: string,
    paymentMethod?: string,
    paymentStatus?: string
  ) => {
    // Special case for GCash payments that are pending verification
    if (
      paymentMethod === "gcash" &&
      paymentStatus !== "approved" &&
      status !== "cancelled" &&
      status !== "Cancelled"
    ) {
      return "warning";
    }

    // Use status directly from database
    switch (status) {
      // Mobile app status values
      case "processing":
        return "warning";
      case "ready":
        return "success";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      case "awaiting_payment_verification":
        return "warning";
      case "scheduled":
        return "primary";
      case "pending":
        return "primary";

      // Inventory system status values
      case "Order Confirmed":
        return "primary";
      case "Preparing Order":
        return "warning";
      case "Ready for Pickup":
        return "success";
      case "Completed":
        return "success";
      case "Cancelled":
        return "danger";
      default:
        return "medium";
    }
  };

  const getStatusText = (
    status: string,
    paymentMethod: string,
    paymentStatus: string
  ) => {
    // Special case for GCash payments that are pending verification
    if (
      paymentMethod === "gcash" &&
      paymentStatus !== "approved" &&
      status !== "cancelled" &&
      status !== "Cancelled"
    ) {
      return "Pending";
    }

    // Convert database status to user-friendly text
    switch (status) {
      // Mobile app status values
      case "processing":
        return "Preparing Order";
      case "ready":
        return "Ready for Pickup";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "awaiting_payment_verification":
        return "Pending";
      case "scheduled":
        return "Order Placed";
      case "pending":
        return "Order Confirmed";

      // Inventory system status values - already in user-friendly format
      case "Order Confirmed":
      case "Preparing Order":
      case "Ready for Pickup":
      case "Completed":
      case "Cancelled":
        return status;
      default:
        return "Order Placed";
    }
  };

  const formatTimestamp = (timestamp: any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

      return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Unknown date";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // In the OrderDetail component, simplify function to get display status for tracking
  const getDisplayStatusForTracking = (
    status: string,
    paymentMethod: string,
    paymentStatus: string
  ) => {
    // Special case for GCash pending payment
    if (
      paymentMethod === "gcash" &&
      paymentStatus !== "approved" &&
      status !== "cancelled" &&
      status !== "Cancelled"
    ) {
      return "awaiting_payment_verification";
    }

    // The inventory system status values are already in display format
    if (
      [
        "Order Confirmed",
        "Preparing Order",
        "Ready for Pickup",
        "Completed",
        "Cancelled",
      ].includes(status)
    ) {
      return status;
    }

    // Map app statuses to tracking display format
    switch (status) {
      case "processing":
        return "Preparing Order";
      case "ready":
        return "Ready for Pickup";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "scheduled":
        return "Order Placed";
      case "pending":
        return "Order Confirmed";
      case "awaiting_payment_verification":
        return "Order Placed";
      default:
        return "Order Placed";
    }
  };

  const handleCancelOrder = async () => {
    try {
      if (!order) return;

      setShowCancelAlert(false);
      setCancelling(true);

      present({
        message: "Cancelling your order...",
        duration: 2000,
        color: "primary",
      });

      console.log(`Starting order cancellation for order: ${id}`);

      // Update order status in Firestore
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, {
        "orderDetails.status": "cancelled",
        "orderDetails.updatedAt": new Date().toISOString(),
      });
      console.log(`Updated order status in Firestore to cancelled`);

      // Update local state
      setOrder({
        ...order,
        orderDetails: {
          ...order.orderDetails,
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        },
      });

      // Create notification
      try {
        const user = auth.currentUser;
        if (user) {
          const notificationsRef = collection(db, "notifications");
          await addDoc(notificationsRef, {
            userId: user.uid,
            title: "Order Cancelled",
            message: `Your order #${id.substring(
              0,
              6
            )} has been cancelled successfully.`,
            type: "info",
            createdAt: serverTimestamp(),
            isRead: false,
            orderId: id,
          });
        }
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
      }

      present({
        message: "Your order has been cancelled successfully",
        duration: 3000,
        color: "success",
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      present({
        message: "Failed to cancel order. Please try again.",
        duration: 3000,
        color: "danger",
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <IonPage className="order-detail-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton
              defaultHref="/orders"
              icon={chevronBackOutline}
              text=""
            />
          </IonButtons>
          <IonTitle>Order Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={arrowUndoOutline}
            pullingText="Pull to refresh"
            refreshingSpinner="circles"
            refreshingText="Refreshing..."
          ></IonRefresherContent>
        </IonRefresher>

        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading order details...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <IonIcon icon={alertCircleOutline} color="danger" />
            <p>{error}</p>
            <IonButton onClick={() => history.goBack()}>Go Back</IonButton>
          </div>
        ) : order ? (
          <div className="order-detail-container">
            <IonCard className="order-detail-status-card order-status-card">
              <IonCardContent>
                {order && (
                  <>
                    <div className="order-header">
                      <div className="order-id">
                        <h4>Order #{order.id.slice(-6)}</h4>
                        <p className="order-date">
                          {formatTimestamp(order.createdAt)}
                        </p>
                      </div>
                      <IonChip
                        color={getStatusColor(
                          order.orderDetails.status || order.status,
                          order.orderDetails.paymentMethod,
                          order.orderDetails.paymentStatus
                        )}
                      >
                        {/* Show status based on GCash verification or direct from database */}
                        {(order.orderDetails.status ===
                          "awaiting_payment_verification" ||
                          order.status === "awaiting_payment_verification") &&
                        order.orderDetails.paymentStatus === "approved"
                          ? "Processing"
                          : getStatusText(
                              order.orderDetails.status || order.status,
                              order.orderDetails.paymentMethod,
                              order.orderDetails.paymentStatus
                            )}
                      </IonChip>
                    </div>

                    <OrderTrackingProgress
                      currentStatus={getDisplayStatusForTracking(
                        order?.orderDetails?.status || order?.status || "",
                        order?.orderDetails?.paymentMethod || "cash",
                        order?.orderDetails?.paymentStatus || "pending"
                      )}
                      paymentStatus={
                        order?.orderDetails?.paymentStatus || "pending"
                      }
                      createdAt={order?.createdAt}
                      orderId={order?.id || ""}
                    />
                  </>
                )}
              </IonCardContent>
            </IonCard>

            <IonCard className="order-items-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={bagHandleOutline} /> Order Items
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList lines="full" className="item-list">
                  {order?.items?.map((item, index) => (
                    <IonItem key={index} className="order-item">
                      <div className="item-content">
                        <div className="item-main">
                          <div className="size-badge-container">
                            <IonChip className="size-badge" color="primary">
                              {typeof item.productSize === "object"
                                ? item.productSize.name
                                : item.productSize}
                            </IonChip>
                          </div>
                          <div className="item-details">
                            {item.productVarieties &&
                              item.productVarieties.length > 0 && (
                                <p className="varieties">
                                  {item.productVarieties.join(", ")}
                                </p>
                              )}
                            <div className="quantity-price">
                              <span className="quantity">
                                {item.productQuantity}{" "}
                                {item.productQuantity > 1 ? "items" : "item"}
                              </span>
                              <span className="price">
                                ₱{item.productPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </IonItem>
                  ))}
                </IonList>

                <div className="total-section">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>
                      ₱
                      {order?.orderDetails?.totalAmount?.toLocaleString() ||
                        "0"}
                    </span>
                  </div>
                  <div className="total-row grand-total">
                    <span>Total</span>
                    <span>
                      ₱
                      {order?.orderDetails?.totalAmount?.toLocaleString() ||
                        "0"}
                    </span>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="pickup-details-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={calendarOutline} /> Pickup Details
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="detail-row">
                  <IonIcon icon={calendarOutline} />
                  <div className="detail-label">Date</div>
                  <div className="detail-value">
                    {order?.orderDetails?.pickupDate || "N/A"}
                  </div>
                </div>
                <div className="detail-row">
                  <IonIcon icon={timeOutline} />
                  <div className="detail-label">Time</div>
                  <div className="detail-value">
                    {order?.orderDetails?.pickupTime || "N/A"}
                  </div>
                </div>
                <div className="detail-row">
                  <IonIcon icon={locationOutline} />
                  <div className="detail-label">Location</div>
                  <div className="detail-value">
                    Store Address, City, Philippines
                  </div>
                </div>
                <div className="detail-row">
                  <IonIcon
                    icon={
                      order?.orderDetails?.pickupOption === "now"
                        ? timerOutline
                        : calendarOutline
                    }
                  />
                  <div className="detail-label">Pickup Option</div>
                  <div className="detail-value">
                    {order?.orderDetails?.pickupOption === "now"
                      ? "Ready Now (Walk-in)"
                      : "Scheduled for Later"}
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="payment-details-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={receiptOutline} /> Payment Details
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="detail-row">
                  <IonIcon
                    icon={
                      order?.orderDetails?.paymentMethod === "cash"
                        ? cashOutline
                        : cardOutline
                    }
                  />
                  <div className="detail-label">Method</div>
                  <div className="detail-value">
                    {order?.orderDetails?.paymentMethod === "cash"
                      ? "Cash"
                      : "GCash"}
                  </div>
                </div>
                <div className="detail-row">
                  <IonIcon
                    icon={
                      order?.orderDetails?.paymentStatus === "approved"
                        ? checkmarkCircle
                        : timerOutline
                    }
                  />
                  <div className="detail-label">Status</div>
                  <div className="detail-value">
                    <IonChip
                      color={
                        order?.orderDetails?.paymentStatus === "approved"
                          ? "success"
                          : "warning"
                      }
                      className="payment-status-chip"
                    >
                      {order?.orderDetails?.paymentStatus === "approved"
                        ? "Paid"
                        : "Pending"}
                    </IonChip>
                  </div>
                </div>
                {order?.orderDetails?.paymentMethod === "gcash" &&
                  order?.orderDetails?.gcashReference && (
                    <div className="detail-row">
                      <IonIcon icon={cardOutline} />
                      <div className="detail-label">Reference #</div>
                      <div className="detail-value reference">
                        {order?.orderDetails?.gcashReference}
                      </div>
                    </div>
                  )}
              </IonCardContent>
            </IonCard>

            <IonCard className="customer-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={personOutline} /> Customer Details
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="customer-info">
                  <IonAvatar className="customer-avatar">
                    <div className="initials-avatar">
                      {getInitials(order.customerName || "User")}
                    </div>
                  </IonAvatar>
                  <div className="customer-details">
                    <h3>{order.customerName || "Customer"}</h3>
                    {order.userDetails?.email && (
                      <p>{order.userDetails.email}</p>
                    )}
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Cancel Order button for active orders that aren't completed or already cancelled */}
            {(!order.orderDetails.status ||
              !["completed", "cancelled"].includes(
                order.orderDetails.status
              )) &&
              (!order.status ||
                !["completed", "cancelled"].includes(order.status)) && (
                <div className="action-container">
                  <IonButton
                    expand="block"
                    color="danger"
                    className="cancel-button"
                    onClick={() => setShowCancelAlert(true)}
                  >
                    <IonIcon icon={closeCircle} slot="start" />
                    Cancel Order
                  </IonButton>
                </div>
              )}
          </div>
        ) : null}
      </IonContent>

      <IonAlert
        isOpen={showCancelAlert}
        onDidDismiss={() => setShowCancelAlert(false)}
        header="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        buttons={[
          {
            text: "No",
            role: "cancel",
          },
          {
            text: "Yes, Cancel",
            role: "destructive",
            handler: handleCancelOrder,
          },
        ]}
      />

      <IonLoading isOpen={loading} message="Loading order details..." />
    </IonPage>
  );
};

export default OrderDetail;
