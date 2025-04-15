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
    status: string;
    orderStatus: string;
    updatedAt?: string;
  };
  userDetails?: {
    firstName: string;
    lastName: string;
    name?: string;
    email?: string;
  };
}

interface OrderTrackingProgressProps {
  currentStatus: string;
  paymentStatus: string;
  createdAt: any;
  orderId: string;
  isScheduled: boolean;
  paymentMethod: string;
}

const OrderTrackingProgress: React.FC<OrderTrackingProgressProps> = ({
  currentStatus,
  paymentStatus,
  createdAt,
  orderId,
  isScheduled,
  paymentMethod,
}) => {
  // Order step definitions with optional Stock Reserved step for scheduled orders
  const getOrderSteps = () => {
    const baseSteps = [
      {
        label: "Order Confirmed",
        icon: checkmarkCircleOutline,
        description: "Your order has been confirmed",
      },
    ];

    // Add Stock Reserved step only for scheduled orders
    if (isScheduled) {
      baseSteps.push({
        label: "Stock Reserved",
        icon: flagOutline,
        description: "Items have been reserved for your order",
      });
    }

    // Add remaining steps for all orders
    return [
      ...baseSteps,
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
  };

  const orderSteps = getOrderSteps();

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

    // Only show GCash-specific pending for GCash payment method
    if (isGcashPending && paymentMethod === "gcash") {
      return -2; // Special value for pending payment
    }

    // Map status directly to step index
    switch (currentStatus) {
      // Inventory system status values
      case "Order Confirmed":
        return 0;
      case "Stock Reserved":
        return isScheduled ? 1 : 0; // If not scheduled, treat as Order Confirmed
      case "Preparing Order":
        return isScheduled ? 2 : 1; // Index depends on whether Stock Reserved is included
      case "Ready for Pickup":
        return isScheduled ? 3 : 2;
      case "Completed":
        return isScheduled ? 4 : 3;

      // Mobile app status values - map to matching inventory system values
      case "processing":
        return isScheduled ? 2 : 1; // Maps to Preparing Order
      case "ready":
        return isScheduled ? 3 : 2; // Maps to Ready for Pickup
      case "completed":
        return isScheduled ? 4 : 3; // Maps to Completed
      case "scheduled":
        return 0; // Maps to Order Confirmed
      case "pending":
        return 0; // Maps to Order Confirmed
      case "awaiting_payment_verification":
        // For cash payments, map to Order Confirmed (0)
        return 0;

      case "Cancelled":
        return -1; // Special value for cancelled

      default:
        return 0; // Default to Order Confirmed
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

  // Get date for each step - we only show the actual order creation date
  // instead of simulating dates for each step
  const getStepDate = (stepIndex: number): string => {
    // Only show the timestamp for the first step (Order Placed)
    // or for the current active step
    if (stepIndex === 0 || stepIndex === currentStepIndex) {
      return formatDate(createdAt);
    }

    // Don't show dates for future steps or intermediate steps
    return "";
  };

  return (
    <div className="order-detail-progress-container vertical">
      {isCancelled && (
        <div className="order-detail-cancelled-badge">
          <IonChip color="danger" className="order-detail-cancelled-chip">
            <IonIcon icon={closeCircle} />
            Order Cancelled
          </IonChip>
        </div>
      )}

      <div className="order-detail-steps-vertical">
        {orderSteps.map((step, index) => {
          // For cancelled orders, all steps are inactive
          const isActive = currentStepIndex === index;
          const isCompleted = !isCancelled && currentStepIndex > index;
          const isPending =
            isGcashPending && paymentMethod === "gcash" && index === 0; // Only show pending for GCash

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

        // Check if this is a GCash payment that just got approved
        const isGcashPaymentApproved =
          orderWithId.orderDetails.paymentMethod === "gcash" &&
          orderWithId.orderDetails.paymentStatus === "approved" &&
          previousPaymentStatus === "pending" &&
          orderWithId.orderDetails.orderStatus ===
            "awaiting_payment_verification";

        // If GCash payment just got approved, we need to update the status from awaiting_payment_verification to Order Confirmed
        if (isGcashPaymentApproved) {
          try {
            // Update status in Firestore
            await updateDoc(orderDocRef, {
              "orderDetails.status": "Order Confirmed",
              "orderDetails.orderStatus": "Order Confirmed",
            });

            console.log(
              "Updated GCash payment status from 'awaiting_payment_verification' to 'Order Confirmed'"
            );

            // Update the order object for the rest of this function
            orderWithId.orderDetails.status = "Order Confirmed";
            orderWithId.orderDetails.orderStatus = "Order Confirmed";
          } catch (error) {
            console.error(
              "Error updating order status after payment approval:",
              error
            );
          }
        }

        // Get current status
        const currentStatus = orderWithId.orderDetails.orderStatus;
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
      // Inventory system status values first for priority
      case "Order Confirmed":
        return "primary";
      case "Stock Reserved":
        return "tertiary"; // Use a different color for stock reserved
      case "Preparing Order":
        return "warning";
      case "Ready for Pickup":
        return "success";
      case "Completed":
        return "success";
      case "Cancelled":
        return "danger";

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
    paymentStatus: string,
    pickupOption: string
  ) => {
    // Special case for GCash pending payment verification
    if (
      paymentMethod === "gcash" &&
      paymentStatus !== "approved" &&
      status === "awaiting_payment_verification"
    ) {
      return "Order Confirmed"; // Map to Order Confirmed instead of pending
    }

    // For cash payments with pending verification, show as Order Confirmed
    if (
      paymentMethod === "cash" &&
      status === "awaiting_payment_verification"
    ) {
      return "Order Confirmed";
    }

    // Check if this is a scheduled order (pickup tomorrow/later)
    const isScheduled = pickupOption === "later";

    // The inventory system status values are already in display format
    if (
      [
        "Order Confirmed",
        "Stock Reserved",
        "Preparing Order",
        "Ready for Pickup",
        "Completed",
        "Cancelled",
      ].includes(status)
    ) {
      // If we have "Stock Reserved" but it's not a scheduled order,
      // we should convert it to "Order Confirmed"
      if (status === "Stock Reserved" && !isScheduled) {
        return "Order Confirmed";
      }
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
        return "Order Confirmed";
      case "pending":
        return "Order Confirmed";
      case "awaiting_payment_verification":
        return "Order Confirmed";
      default:
        return "Order Confirmed";
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
        "orderDetails.status": "Cancelled",
        "orderDetails.orderStatus": "cancelled",
        "orderDetails.updatedAt": new Date().toISOString(),
      });
      console.log(`Updated order status in Firestore to cancelled`);

      // Update local state
      setOrder({
        ...order,
        orderDetails: {
          ...order.orderDetails,
          status: "Cancelled",
          orderStatus: "cancelled",
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
          <div className="order-detail-loading-container">
            <IonSpinner name="crescent" />
            <p>Loading order details...</p>
          </div>
        ) : error ? (
          <div className="order-detail-error-container">
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
                    <div className="order-detail-header">
                      <div className="order-detail-id">
                        <h4>Order #{order.id.slice(0, 6)}</h4>
                        <p className="order-detail-date">
                          {formatTimestamp(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <OrderTrackingProgress
                      currentStatus={getDisplayStatusForTracking(
                        order?.orderDetails?.orderStatus || "",
                        order?.orderDetails?.paymentMethod || "cash",
                        order?.orderDetails?.paymentStatus || "pending",
                        order?.orderDetails?.pickupOption || "now"
                      )}
                      paymentStatus={
                        order?.orderDetails?.paymentStatus || "pending"
                      }
                      createdAt={order?.createdAt}
                      orderId={order?.id || ""}
                      isScheduled={
                        order?.orderDetails?.pickupOption === "later"
                      }
                      paymentMethod={
                        order?.orderDetails?.paymentMethod || "cash"
                      }
                    />
                  </>
                )}
              </IonCardContent>
            </IonCard>

            <IonCard className="order-detail-items-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={bagHandleOutline} /> Order Items
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList lines="full" className="order-detail-item-list">
                  {order?.items?.map((item, index) => (
                    <IonItem key={index} className="order-detail-item">
                      <div className="order-detail-item-content">
                        <div className="order-detail-item-main">
                          <div className="order-detail-size-badge-container">
                            <IonChip className="order-detail-size-badge">
                              {typeof item.productSize === "object"
                                ? item.productSize.name
                                : item.productSize}
                            </IonChip>
                          </div>
                          <div className="order-detail-item-details">
                            {item.productVarieties &&
                              item.productVarieties.length > 0 && (
                                <p className="order-detail-varieties">
                                  {item.productVarieties.join(", ")}
                                </p>
                              )}
                            <div className="order-detail-quantity-price">
                              <span className="order-detail-quantity">
                                {item.productQuantity}{" "}
                                {item.productQuantity > 1 ? "items" : "item"}
                              </span>
                              <span className="order-detail-price">
                                ₱{item.productPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </IonItem>
                  ))}
                </IonList>

                <div className="order-detail-total-section">
                  <div className="order-detail-total-row">
                    {/* <span>Subtotal</span>
                    <span>
                      ₱
                      {order?.orderDetails?.totalAmount?.toLocaleString() ||
                        "0"}
                    </span> */}
                  </div>
                  <div className="order-detail-total-row grand-total">
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

            <IonCard className="order-detail-pickup-details-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={calendarOutline} /> Pickup Details
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="order-detail-detail-row">
                  <IonIcon icon={calendarOutline} />
                  <div className="order-detail-detail-label">Date</div>
                  <div className="order-detail-detail-value">
                    {order?.orderDetails?.pickupDate || "N/A"}
                  </div>
                </div>
                <div className="order-detail-detail-row">
                  <IonIcon icon={timeOutline} />
                  <div className="order-detail-detail-label">Time</div>
                  <div className="order-detail-detail-value">
                    {order?.orderDetails?.pickupTime || "N/A"}
                  </div>
                </div>
                <div className="order-detail-detail-row">
                  <IonIcon icon={locationOutline} />
                  <div className="order-detail-detail-label">Location</div>
                  <div className="order-detail-detail-value">
                    Store Address, City, Philippines
                  </div>
                </div>
                <div className="order-detail-detail-row">
                  <IonIcon
                    icon={
                      order?.orderDetails?.pickupOption === "now"
                        ? timerOutline
                        : calendarOutline
                    }
                  />
                  <div className="order-detail-detail-label">Pickup Option</div>
                  <div className="order-detail-detail-value">
                    {order?.orderDetails?.pickupOption === "now"
                      ? "Today"
                      : "Scheduled"}
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="order-detail-payment-details-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={receiptOutline} /> Payment Details
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="order-detail-detail-row">
                  <IonIcon
                    icon={
                      order?.orderDetails?.paymentMethod === "cash"
                        ? cashOutline
                        : cardOutline
                    }
                  />
                  <div className="order-detail-detail-label">Method</div>
                  <div className="order-detail-detail-value">
                    {order?.orderDetails?.paymentMethod === "cash"
                      ? "Cash"
                      : "GCash"}
                  </div>
                </div>
                <div className="order-detail-detail-row">
                  <IonIcon
                    icon={
                      order?.orderDetails?.paymentStatus === "approved"
                        ? checkmarkCircle
                        : timerOutline
                    }
                  />
                  <div className="order-detail-detail-label">Status</div>
                  <div className="order-detail-detail-value">
                    <IonChip
                      color={
                        order?.orderDetails?.paymentStatus === "approved"
                          ? "success"
                          : "warning"
                      }
                      className="order-detail-payment-status-chip"
                    >
                      {order?.orderDetails?.paymentStatus === "approved"
                        ? "Paid"
                        : order?.orderDetails?.paymentMethod === "cash"
                        ? "Pending"
                        : "Pending Verification"}
                    </IonChip>
                  </div>
                </div>
                {order?.orderDetails?.paymentMethod === "gcash" &&
                  order?.orderDetails?.gcashReference && (
                    <div className="order-detail-detail-row">
                      <IonIcon icon={cardOutline} />
                      <div className="order-detail-detail-label">
                        Reference #
                      </div>
                      <div className="order-detail-detail-value reference">
                        {order?.orderDetails?.gcashReference}
                      </div>
                    </div>
                  )}
              </IonCardContent>
            </IonCard>

            <IonCard className="order-detail-customer-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={personOutline} /> Customer Details
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="order-detail-customer-info">
                  <IonAvatar className="order-detail-customer-avatar">
                    <div className="order-detail-initials-avatar">
                      {getInitials(order.customerName || "User")}
                    </div>
                  </IonAvatar>
                  <div className="order-detail-customer-details">
                    <h3>{order.customerName || "Customer"}</h3>
                    {order.userDetails?.email && (
                      <p>{order.userDetails.email}</p>
                    )}
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Cancel Order button for active orders that aren't completed or already cancelled */}
            {(order.orderDetails.orderStatus ===
              "awaiting_payment_verification" ||
              !["completed", "cancelled", "Completed", "Cancelled"].includes(
                order.orderDetails.orderStatus
              )) && (
              <div className="order-detail-action-container">
                <IonButton
                  expand="block"
                  color="danger"
                  className="order-detail-cancel-button"
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

      {/* <IonLoading isOpen={loading} message="Loading order details..." /> */}
    </IonPage>
  );
};

export default OrderDetail;
