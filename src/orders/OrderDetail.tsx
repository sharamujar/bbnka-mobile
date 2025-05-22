import React, { useState, useEffect, useRef } from "react";
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
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonInput,
  IonSegment,
  IonSegmentButton,
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
  imageOutline,
  keyOutline,
  trash,
  refreshCircleOutline,
  alertOutline,
  copyOutline,
  cameraOutline,
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
  FieldValue,
} from "firebase/firestore";
import { db, auth } from "../firebase-config";
import "./OrderDetail.css";
import { notificationService } from "../services/NotificationService";

// Constants
const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/dbmofuvwn/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "bbnka-payment-screenshots";

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
    rejectionReason?: string; // Add field for payment rejection reason
    totalAmount: number;
    pickupOption: string;
    gcashReference?: string;
    gcashScreenshotUrl?: string | null; // Updated to allow null value
    status: string;
    orderStatus: string;
    updatedAt?: string;
    statusTimestamps?: Record<string, any>;
    cancellationReason?: string;
    cancellationNote?: string;
    hasAppealed?: boolean; // Track if payment has been appealed already
    appealTimestamp?: any; // When the appeal was submitted
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
  statusTimestamps?: Record<string, any>; // Add timestamps for each status
  rejectionReason?: string; // Add rejection reason prop
  cancellationReason?: string; // Add cancellation reason prop
  cancellationNote?: string; // Add cancellation note prop
}

interface CancellationReason {
  value: string;
  label: string;
}

const CANCELLATION_REASONS: CancellationReason[] = [
  { value: "change_of_mind", label: "Change of Mind" },
  { value: "found_alternative", label: "Found a Better Alternative" },
  { value: "schedule_issues", label: "Pickup time/location Conflict" },
  { value: "duplicate_order", label: "Duplicate Order" },
  { value: "payment_issues", label: "Payment Issues" },
  { value: "other", label: "Other Reason" },
];

const OrderTrackingProgress: React.FC<OrderTrackingProgressProps> = ({
  currentStatus,
  paymentStatus,
  createdAt,
  orderId,
  isScheduled,
  paymentMethod,
  statusTimestamps = {}, // Default to empty object if not provided
  rejectionReason, // Use the rejection reason
  cancellationReason, // Use the cancellation reason
  cancellationNote, // Use the cancellation note
}) => {
  const getOrderSteps = () => {
    const baseSteps = [
      {
        label: "Order Confirmed",
        icon: checkmarkCircleOutline,
        description: "Your order has been confirmed",
      },
    ];

    // Add Stock Reserved step only for scheduled orders (pickup tomorrow)
    if (isScheduled) {
      baseSteps.push({
        label: "Stock Reserved",
        icon: flagOutline,
        description: "Items have been reserved for your order",
      });
    }

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
    currentStatus === "Cancelled" ||
    currentStatus === "cancelled" ||
    statusTimestamps?.status === "Cancelled" ||
    (paymentMethod === "gcash" &&
      paymentStatus === "rejected" &&
      !!statusTimestamps?.hasAppealed);

  // If GCash payment and not approved or rejected, show special "Pending" step
  // If rejected, don't show the pending step (will show cancelled instead)
  const isGcashPending =
    (currentStatus === "awaiting_payment_verification" ||
      (paymentStatus === "pending" &&
        currentStatus !== "cancelled" &&
        currentStatus !== "Cancelled")) &&
    paymentStatus !== "rejected";

  // Special case for rejected GCash payments - but only if the order isn't cancelled
  // and the order hasn't been appealed (or appeal wasn't rejected)
  const isPaymentRejected =
    !isCancelled &&
    paymentMethod === "gcash" &&
    paymentStatus === "rejected" &&
    !statusTimestamps?.hasAppealed; // Only show payment rejected if not appealed

  // Calculate the current step index
  const getCurrentStepIndex = () => {
    // New check: If status shows cancelled but orderStatus doesn't,
    // status takes precedence (fixes specific issue with rejected payment appeals)
    if (
      statusTimestamps?.status === "Cancelled" ||
      (paymentMethod === "gcash" &&
        paymentStatus === "rejected" &&
        statusTimestamps?.hasAppealed)
    ) {
      return -1; // Special value for cancelled
    }

    if (isCancelled) {
      return -1; // Special value for cancelled
    }

    // Only show GCash-specific pending for GCash payment method
    if (isGcashPending && paymentMethod === "gcash") {
      return -2; // Special value for pending payment
    }

    switch (currentStatus) {
      // Inventory system status values
      case "Order Confirmed":
        return 0;
      case "Stock Reserved":
        // Stock Reserved is only valid for scheduled orders
        return isScheduled ? 1 : 0;
      case "Preparing Order":
        return isScheduled ? 2 : 1;
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

  // Map step labels to the corresponding status value
  const getStatusValueForStep = (index: number): string => {
    if (isScheduled) {
      switch (index) {
        case 0:
          return "Order Confirmed";
        case 1:
          return "Stock Reserved";
        case 2:
          return "Preparing Order";
        case 3:
          return "Ready for Pickup";
        case 4:
          return "Completed";
        default:
          return "";
      }
    } else {
      switch (index) {
        case 0:
          return "Order Confirmed";
        case 1:
          return "Preparing Order";
        case 2:
          return "Ready for Pickup";
        case 3:
          return "Completed";
        default:
          return "";
      }
    }
  };

  // Get date for each step - show the actual timestamp when the status was updated
  const getStepDate = (stepIndex: number): string => {
    const statusValue = getStatusValueForStep(stepIndex);

    // If we have a timestamp for this specific status, use it
    if (statusValue && statusTimestamps[statusValue]) {
      return formatDate(statusTimestamps[statusValue]);
    }

    // For the Order Confirmed step, use creation date if no specific timestamp
    if (stepIndex === 0) {
      return formatDate(createdAt);
    }

    // For cancelled step, use the cancellation timestamp if available
    if (isCancelled && statusTimestamps["Cancelled"]) {
      return formatDate(statusTimestamps["Cancelled"]);
    }

    // Don't use current time as fallback anymore - only show actual timestamps
    // Don't show dates for steps without timestamps
    return "";
  };

  return (
    <div className="order-detail-progress-container vertical">
      {/* Remove the standalone cancelled badge since we'll show it inline with the steps */}
      <div className="order-detail-steps-vertical">
        {/* Special step for rejected GCash payments - show only this step when rejected */}
        {isPaymentRejected ? (
          <div className="order-detail-step-vertical active rejected">
            <div className="order-detail-step-content">
              <div className="order-detail-step-icon-vertical">
                <IonIcon icon={closeCircle} />
              </div>
              <div className="order-detail-step-info">
                <div className="order-detail-step-label-vertical">
                  Payment Rejected
                </div>
                <div className="order-detail-step-desc">
                  Your GCash payment was rejected
                  <span className="order-detail-step-date">
                    {statusTimestamps["Rejected"]
                      ? formatDate(statusTimestamps["Rejected"])
                      : formatDate(
                          statusTimestamps["Order Confirmed"] || createdAt
                        )}
                  </span>
                </div>
                {/* {rejectionReason && (
                  <div className="order-detail-rejection-reason">
                    Reason: {rejectionReason}
                  </div>
                )} */}
              </div>
            </div>
          </div>
        ) : isGcashPending && paymentMethod === "gcash" ? (
          // Special handling for GCash pending payments - show only the pending step
          <div className="order-detail-step-vertical active pending">
            <div className="order-detail-step-content">
              <div className="order-detail-step-icon-vertical">
                <IonIcon icon={hourglassOutline} />
              </div>
              <div className="order-detail-step-info">
                <div className="order-detail-step-label-vertical">
                  Payment Verification Pending
                </div>
                <div className="order-detail-step-desc">
                  Waiting for GCash payment verification
                  <span className="order-detail-step-date">
                    {formatDate(createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : isCancelled ? ( // Enhanced design for cancelled orders
          <div className="order-detail-step-vertical active cancelled rejected">
            <div className="order-detail-step-content">
              <div className="order-detail-step-icon-vertical">
                <IonIcon icon={closeCircle} />
              </div>
              <div className="order-detail-step-info">
                {" "}
                <div className="order-detail-step-label-vertical">
                  Order Cancelled
                </div>
                <div className="order-detail-step-desc">
                  <div>Your order has been cancelled</div>
                  <span className="order-detail-step-date">
                    {statusTimestamps["Cancelled"]
                      ? formatDate(statusTimestamps["Cancelled"])
                      : formatDate(createdAt)}
                  </span>
                </div>{" "}
                {/* Simple, modern cancellation reason display */}
                {cancellationReason && (
                  <div className="cancellation-reason-minimal">
                    <span className="reason-label">Reason: </span>
                    {CANCELLATION_REASONS.find(
                      (reason) => reason.value === cancellationReason
                    )?.label || cancellationReason}
                    {cancellationNote && (
                      <span className="note-text">{cancellationNote}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Only show regular order steps when not in special states */
          orderSteps.map((step, index) => {
            const isActive = currentStepIndex === index;
            const isCompleted = currentStepIndex > index;

            return (
              <div
                key={index}
                className={`order-detail-step-vertical ${
                  isActive ? "active" : ""
                } ${isCompleted ? "completed" : ""}`}
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
                    }`}
                  />
                )}
              </div>
            );
          })
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
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [cancellationNote, setCancellationNote] = useState<string>("");

  console.log("OrderDetail component loaded with id:", id); // Debug logging

  // New states for payment appeal
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealLoading, setAppealLoading] = useState(false);
  const [appealVerificationMethod, setAppealVerificationMethod] = useState<
    "reference" | "screenshot"
  >("reference");
  const [newReferenceNumber, setNewReferenceNumber] = useState("");
  const [newScreenshot, setNewScreenshot] = useState<string | null>(null);
  const [isValidReference, setIsValidReference] = useState(false);
  const [referenceError, setReferenceError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GCash modal states
  const [showGcashModal, setShowGcashModal] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(
    null
  );

  // Helper function for badge color based on size name
  const getSizeColor = (sizeName: any): string => {
    // Handle case where sizeName is an object
    if (typeof sizeName === "object" && sizeName !== null) {
      // If it's an object with a name property
      if (sizeName.name) {
        sizeName = sizeName.name;
      } else {
        // If it's an object but no name property, return a default color
        return "hsl(0, 0%, 50%)";
      }
    }

    // Handle case where sizeName is not a string
    if (typeof sizeName !== "string") {
      return "hsl(0, 0%, 50%)";
    }

    let hash = 0;
    for (let i = 0; i < sizeName.length; i++) {
      hash = sizeName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = ((Math.abs(hash * 47) % 360) + 360) % 360;
    const saturation = 35 + (Math.abs(hash * 12) % 35);
    const lightness = 35 + (Math.abs(hash * 42) % 30);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Helper function for badge initials based on size name
  const getSizeAbbreviation = (sizeName: any): string => {
    // Handle case where sizeName is an object
    if (typeof sizeName === "object" && sizeName !== null) {
      // If it's an object with a name property
      if (sizeName.name) {
        sizeName = sizeName.name;
      } else {
        // If it's an object but no name property, return a default
        return "N/A";
      }
    }

    // Handle case where sizeName is not a string
    if (typeof sizeName !== "string") {
      return "N/A";
    }

    // Now we can safely split the string
    return sizeName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

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

      console.log(`Attempting to fetch order document with ID: ${id}`);

      if (!id) {
        console.error("Order ID is undefined or null");
        setError("Invalid order ID");
        setLoading(false);
        return;
      }

      const orderDocRef = doc(db, "orders", id);

      try {
        const orderDoc = await getDoc(orderDocRef);

        if (!orderDoc.exists()) {
          console.error(`Order document with ID ${id} not found`);
          setError("Order not found");
          setLoading(false);
          return;
        }

        const orderData = orderDoc.data() as Omit<Order, "id">;
        const orderWithId = { id: orderDoc.id, ...orderData } as Order;
        console.log("Order fetched successfully:", orderWithId.id);
        setOrder(orderWithId);
      } catch (docError) {
        console.error("Error fetching order document:", docError);
        setError(
          `Error loading order: ${
            docError instanceof Error ? docError.message : "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error in fetchOrderDetails:", error);
      setError(
        `Failed to load order details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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
            // Create a statusTimestamps object if it doesn't exist
            const statusTimestamps =
              orderWithId.orderDetails.statusTimestamps || {};

            // Add the current timestamp for Order Confirmed
            statusTimestamps["Order Confirmed"] = new Date();

            // Update status in Firestore
            await updateDoc(orderDocRef, {
              "orderDetails.status": "Order Confirmed",
              "orderDetails.orderStatus": "Order Confirmed",
              "orderDetails.updatedAt": new Date().toISOString(),
              "orderDetails.statusTimestamps": statusTimestamps,
            });

            console.log(
              "Updated GCash payment status from 'awaiting_payment_verification' to 'Order Confirmed'"
            );

            // Update the order object for the rest of this function
            orderWithId.orderDetails.status = "Order Confirmed";
            orderWithId.orderDetails.orderStatus = "Order Confirmed";
            orderWithId.orderDetails.updatedAt = new Date().toISOString();
            orderWithId.orderDetails.statusTimestamps = statusTimestamps;
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
          // Create a local notification for the status change
          try {
            const statusMessage = getStatusText(
              currentStatus,
              orderWithId.orderDetails.paymentMethod,
              orderWithId.orderDetails.paymentStatus
            );

            await notificationService.addNotification({
              title: "Order Status Updated",
              message: `Your order #${id.substring(
                0,
                6
              )} status has been updated to: ${statusMessage}`,
              type: "info",
              orderId: id,
            });

            console.log(
              "Created local notification for status change:",
              statusMessage
            );
          } catch (error) {
            console.error("Error creating local status notification:", error);
          }
        }

        // Check for payment status changes specifically for GCash orders
        if (
          orderWithId.orderDetails.paymentMethod === "gcash" &&
          previousPaymentStatus !== null &&
          previousPaymentStatus !== currentPaymentStatus
        ) {
          // Payment approved notification
          if (currentPaymentStatus === "approved") {
            // Create a local notification for payment approval
            try {
              await notificationService.addNotification({
                title: "Payment Approved",
                message: `Your GCash payment for order #${id.substring(
                  0,
                  6
                )} has been approved.`,
                type: "success",
                orderId: id,
              });

              console.log("Created local notification for payment approval");
            } catch (error) {
              console.error(
                "Error creating local payment notification:",
                error
              );
            }
          }
          // Payment rejected notification
          else if (currentPaymentStatus === "rejected") {
            // Create a local notification for payment rejection
            try {
              await notificationService.addNotification({
                title: "Payment Rejected",
                message: `Your GCash payment for order #${id.substring(
                  0,
                  6
                )} has been rejected. Please contact our support for assistance.`,
                type: "danger",
                orderId: id,
              });

              console.log("Created local notification for payment rejection");

              // If this is an appeal rejection (hasAppealed is true), automatically cancel the order
              if (orderWithId.orderDetails.hasAppealed) {
                console.log(
                  "Payment appeal was rejected - cancelling order automatically"
                );

                // Create or update statusTimestamps with current time for Cancelled status
                const statusTimestamps =
                  orderWithId.orderDetails.statusTimestamps || {};
                statusTimestamps["Cancelled"] = new Date();

                // Update order status in Firestore to cancelled
                await updateDoc(orderDocRef, {
                  "orderDetails.status": "Cancelled",
                  "orderDetails.orderStatus": "cancelled",
                  "orderDetails.updatedAt": new Date().toISOString(),
                  "orderDetails.statusTimestamps": statusTimestamps,
                  "orderDetails.cancellationReason": "payment_rejected",
                  "orderDetails.cancellationNote":
                    "Order cancelled due to rejected payment appeal",
                });

                // Update local order state to reflect cancellation
                orderWithId.orderDetails.status = "Cancelled";
                orderWithId.orderDetails.orderStatus = "cancelled";
                orderWithId.orderDetails.statusTimestamps = statusTimestamps;
                orderWithId.orderDetails.cancellationReason =
                  "payment_rejected";
                orderWithId.orderDetails.cancellationNote =
                  "Order cancelled due to rejected payment appeal";

                // Create a cancellation notification
                await notificationService.addNotification({
                  title: "Order Cancelled",
                  message: `Your order #${id.substring(
                    0,
                    6
                  )} has been cancelled due to rejected payment appeal.`,
                  type: "danger",
                  orderId: id,
                });

                console.log(
                  "Order cancelled automatically due to rejected payment appeal"
                );
              }
            } catch (error) {
              console.error(
                "Error creating local payment rejection notification:",
                error
              );
            }
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
    // Special case for GCash payments
    if (paymentMethod === "gcash") {
      // Rejected payment shows as danger/red
      if (paymentStatus === "rejected") {
        return "danger";
      }
      // Pending verification shows as warning/yellow
      else if (
        paymentStatus !== "approved" &&
        status !== "cancelled" &&
        status !== "Cancelled"
      ) {
        return "warning";
      }
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
    // Special case for GCash payments that are pending verification or rejected
    if (paymentMethod === "gcash") {
      // Show rejected status for rejected payments
      if (paymentStatus === "rejected") {
        return "Rejected";
      }
      // Show pending status for pending verification
      if (
        paymentStatus !== "approved" &&
        status !== "cancelled" &&
        status !== "Cancelled"
      ) {
        return "Pending";
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
      case "Cancelled":
        return status;

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
        return "Order Confirmed";
      default:
        return "Order Confirmed";
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

      // Check if order can be cancelled
      const currentStatus = order.orderDetails.orderStatus;
      const isPreparingOrLater = [
        "Preparing Order",
        "Ready for Pickup",
        "Completed",
        "preparing",
        "ready",
        "completed",
      ].includes(currentStatus);

      if (isPreparingOrLater) {
        present({
          message:
            "This order can no longer be cancelled as it's already being prepared.",
          duration: 3000,
          color: "warning",
        });
        return;
      }

      setShowCancelAlert(false);
      setCancelling(true);

      present({
        message: "Cancelling your order...",
        duration: 2000,
        color: "primary",
      });

      console.log(`Starting order cancellation for order: ${id}`);

      // Create or update statusTimestamps with current time for Cancelled status
      const statusTimestamps = order.orderDetails.statusTimestamps || {};
      statusTimestamps["Cancelled"] = new Date();

      // Update order status in Firestore
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, {
        "orderDetails.status": "Cancelled",
        "orderDetails.orderStatus": "cancelled",
        "orderDetails.updatedAt": new Date().toISOString(),
        "orderDetails.statusTimestamps": statusTimestamps,
        "orderDetails.cancellationReason": cancellationReason,
        "orderDetails.cancellationNote": cancellationNote,
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
          statusTimestamps: statusTimestamps,
          cancellationReason: cancellationReason,
          cancellationNote: cancellationNote,
        },
      });

      // Create notification
      try {
        const user = auth.currentUser;
        if (user) {
          const notificationsRef = collection(
            db,
            "orderNotifications",
            user.uid
          );
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

      // Create a notification about the cancellation
      try {
        await notificationService.addNotification({
          title: "Order Cancelled",
          message: `Your order #${id.substring(0, 6)} has been cancelled.`,
          type: "info",
          orderId: id,
        });
      } catch (error) {
        console.error("Error creating cancellation notification:", error);
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
      setCancellationReason("");
      setCancellationNote("");
    }
  };

  // Validate GCash reference number (basic validation)
  useEffect(() => {
    if (newReferenceNumber.trim() === "") {
      setIsValidReference(false);
      setReferenceError("");
      return;
    }

    // Check if input contains only digits
    if (!/^\d+$/.test(newReferenceNumber.trim())) {
      setIsValidReference(false);
      setReferenceError("Reference number should contain only digits");
      return;
    }

    // Check length - GCash reference numbers are 13 digits
    const refLength = newReferenceNumber.trim().length;
    if (refLength < 13) {
      setIsValidReference(false);
      setReferenceError(
        `Reference number is too short (${refLength}/13 digits)`
      );
      return;
    }

    if (refLength > 13) {
      setIsValidReference(false);
      setReferenceError(
        `Reference number is too long (${refLength}/13 digits)`
      );
      return;
    }

    // If all checks pass
    setIsValidReference(true);
    setReferenceError("");
  }, [newReferenceNumber]);

  // Helper function for upload to Cloudinary
  const uploadImageToCloudinary = async (
    base64Image: string
  ): Promise<string> => {
    try {
      console.log("Starting image upload to Cloudinary...");

      // Create form data
      const formData = new FormData();

      // For Cloudinary's API, we need to keep the data URL prefix
      formData.append("file", base64Image);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      console.log("Uploading to:", CLOUDINARY_UPLOAD_URL);
      console.log("Using upload preset:", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudinary error response:", errorText);
        throw new Error(`Image upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "Image uploaded successfully to Cloudinary:",
        data.secure_url
      );

      // Return the secure URL of the uploaded image
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      throw error; // Re-throw to be handled by the calling function
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        present({
          message: "Image is too large. Maximum size is 5MB.",
          duration: 3000,
          color: "warning",
        });
        return;
      }

      // Check file type
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        present({
          message: "Please upload a valid image (JPEG or PNG).",
          duration: 3000,
          color: "warning",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setNewScreenshot(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setNewScreenshot(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAppealSubmit = async () => {
    if (!order) return;

    // Validate based on verification method
    if (appealVerificationMethod === "reference" && !isValidReference) {
      present({
        message: "Please enter a valid reference number",
        duration: 3000,
        color: "warning",
      });
      return;
    }

    if (appealVerificationMethod === "screenshot" && !newScreenshot) {
      present({
        message: "Please upload a screenshot of your payment",
        duration: 3000,
        color: "warning",
      });
      return;
    }

    setAppealLoading(true);

    try {
      // Get current timestamp
      const appealTimestamp = new Date();
      let gcashScreenshotUrl = undefined;
      let gcashReference = undefined;

      // Handle screenshot upload if that's the method
      if (appealVerificationMethod === "screenshot" && newScreenshot) {
        try {
          console.log("Starting screenshot upload process...");
          // Upload to Cloudinary
          gcashScreenshotUrl = await uploadImageToCloudinary(newScreenshot);
          console.log("Screenshot uploaded successfully:", gcashScreenshotUrl);
          gcashReference = "SCREENSHOT_UPLOADED";
        } catch (uploadError) {
          console.error("Error uploading screenshot:", uploadError);
          present({
            message: "Failed to upload screenshot. Please try again.",
            duration: 3000,
            color: "danger",
          });
          setAppealLoading(false);
          return;
        }
      } else if (appealVerificationMethod === "reference") {
        // Use the reference number
        gcashReference = newReferenceNumber.trim();
        gcashScreenshotUrl = null; // Use null instead of undefined for Firestore compatibility
        console.log("Using reference number:", gcashReference);
      }

      console.log("Updating order in Firestore...");

      // Create the update object with proper typing
      const orderUpdateData = {
        "orderDetails.paymentStatus": "pending",
        "orderDetails.orderStatus": "awaiting_payment_verification",
        "orderDetails.gcashReference": gcashReference,
        "orderDetails.gcashScreenshotUrl": gcashScreenshotUrl,
        "orderDetails.hasAppealed": true,
        "orderDetails.appealTimestamp": appealTimestamp,
        "orderDetails.updatedAt": new Date().toISOString(),
      };

      // Log the update data to console for debugging
      console.log("Firestore update data:", orderUpdateData);

      // Update the order in Firestore
      const orderRef = doc(db, "orders", id);
      try {
        await updateDoc(orderRef, orderUpdateData);

        console.log("Order updated successfully in Firestore");

        // Create a notification in the app
        await notificationService.addNotification({
          title: "Payment Appeal Submitted",
          message: `Your payment appeal for order #${id.substring(
            0,
            6
          )} has been submitted and is awaiting verification.`,
          type: "info",
          orderId: id,
        });

        // Send notification to staff as well
        try {
          const staffNotificationsRef = collection(db, "orderNotifications");
          await addDoc(staffNotificationsRef, {
            title: "Payment Appeal Received",
            message: `Customer has appealed payment rejection for order #${id.substring(
              0,
              6
            )}. Please verify the new payment information.`,
            type: "payment",
            orderId: id,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error creating staff notification:", error);
          // Non-critical error, don't throw
        }

        // Success message
        present({
          message:
            "Your payment appeal has been submitted successfully. We'll notify you when reviewed.",
          duration: 3000,
          color: "success",
        });

        // Close modal and reset states
        setShowGcashModal(false); // Close the GCash modal (the one being used)
        setShowAppealModal(false); // Make sure the appeal modal is closed too
        setNewReferenceNumber("");
        setNewScreenshot(null);
        setIsValidReference(false);

        // Update local order state to reflect changes
        if (order) {
          setOrder({
            ...order,
            orderDetails: {
              ...order.orderDetails,
              paymentStatus: "pending",
              orderStatus: "awaiting_payment_verification",
              gcashReference: gcashReference,
              gcashScreenshotUrl: gcashScreenshotUrl,
              hasAppealed: true,
              appealTimestamp: appealTimestamp,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      } catch (firestoreError) {
        // Detailed error logging for Firestore errors
        console.error("Error updating order in Firestore:", firestoreError);

        // More specific error messaging based on the error type
        let errorMessage = "Failed to update order details. Please try again.";

        if (firestoreError instanceof Error) {
          if (firestoreError.message.includes("permission-denied")) {
            errorMessage =
              "You don't have permission to update this order. Please contact support.";
          } else if (firestoreError.message.includes("not-found")) {
            errorMessage =
              "Order information could not be found. Please refresh and try again.";
          }

          console.error("Firestore error details:", firestoreError.message);
        }

        present({
          message: errorMessage,
          duration: 3000,
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error submitting payment appeal:", error);
      present({
        message: "There was an error submitting your appeal. Please try again.",
        duration: 3000,
        color: "danger",
      });
    } finally {
      setAppealLoading(false);
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
                        <h4>Order #{order.id}</h4>
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
                      statusTimestamps={
                        order?.orderDetails?.statusTimestamps || {}
                      }
                      rejectionReason={order?.orderDetails?.rejectionReason}
                      cancellationReason={
                        order?.orderDetails?.cancellationReason
                      }
                      cancellationNote={order?.orderDetails?.cancellationNote}
                    />

                    {/* Only show payment rejection/appeal UI if the order is NOT cancelled */}
                    {order?.orderDetails?.orderStatus !== "cancelled" &&
                      order?.orderDetails?.orderStatus !== "Cancelled" && (
                        <>
                          {/* Updated Appeal Payment section for rejected GCash payments */}
                          {order?.orderDetails?.paymentMethod === "gcash" &&
                            order?.orderDetails?.paymentStatus === "rejected" &&
                            !order?.orderDetails?.hasAppealed && (
                              <div className="payment-appeal-container">
                                <div className="payment-rejection-info">
                                  <IonIcon icon={alertOutline} />
                                  <div>
                                    <h4>Payment Not Verified</h4>
                                    {order?.orderDetails?.rejectionReason && (
                                      <p className="order-detail-rejection-reason">
                                        <span className="highlighted-reason">
                                          Reason:{" "}
                                          {order.orderDetails.rejectionReason}
                                        </span>
                                      </p>
                                    )}
                                    <p>
                                      You can either update your payment details
                                      or cancel this order
                                    </p>
                                  </div>
                                </div>
                                <div className="payment-action-buttons">
                                  <IonButton
                                    expand="block"
                                    className="payment-appeal-button"
                                    onClick={() => {
                                      setShowGcashModal(true);
                                      setVerificationComplete(false);
                                      setVerificationResult(null);
                                    }}
                                  >
                                    <IonIcon
                                      icon={refreshCircleOutline}
                                      slot="start"
                                    />
                                    Update Payment Details
                                  </IonButton>
                                  <IonButton
                                    expand="block"
                                    color="danger"
                                    fill="outline"
                                    className="payment-cancel-button"
                                    onClick={() => setShowCancelAlert(true)}
                                  >
                                    <IonIcon icon={closeCircle} slot="start" />
                                    Cancel Order
                                  </IonButton>
                                </div>
                              </div>
                            )}

                          {/* Show message if they've already appealed - only if order is not cancelled */}
                          {/* {order?.orderDetails?.paymentMethod === "gcash" &&
                            order?.orderDetails?.paymentStatus === "pending" &&
                            order?.orderDetails?.hasAppealed && (
                              <div className="payment-already-appealed">
                                <IonIcon icon={checkmarkCircle} />
                                <div>
                                  <h4>Payment Update Submitted</h4>
                                  <p>Your updated details are being verified</p>
                                </div>
                              </div>
                            )} */}
                        </>
                      )}
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
                            <IonBadge
                              className="order-detail-size-badge"
                              style={{
                                backgroundColor: getSizeColor(
                                  item.productSize || "Default"
                                ),
                              }}
                            >
                              {getSizeAbbreviation(
                                item.productSize || "Default"
                              )}
                            </IonBadge>
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
                    102 Bonifacio Avenue, Cainta, 1900 Rizal
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
                      ? "Later"
                      : "Tomorrow"}
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
                      order?.orderDetails?.paymentStatus === "approved"
                        ? checkmarkCircle
                        : order?.orderDetails?.paymentStatus === "rejected"
                        ? closeCircle
                        : timerOutline
                    }
                  />
                  <div className="order-detail-detail-label">Status</div>
                  <div className="order-detail-detail-value">
                    <IonChip
                      color={
                        order?.orderDetails?.paymentMethod === "cash" &&
                        (order?.orderDetails?.orderStatus === "completed" ||
                          order?.orderDetails?.orderStatus === "Completed")
                          ? "success" // Use success color for cash payments on completed orders
                          : order?.orderDetails?.paymentStatus === "approved"
                          ? "success"
                          : order?.orderDetails?.paymentStatus === "rejected"
                          ? "danger"
                          : "warning"
                      }
                      className="order-detail-payment-status-chip"
                    >
                      {/* Show "Paid" for cash payments when order is completed */}
                      {order?.orderDetails?.paymentMethod === "cash" &&
                      (order?.orderDetails?.orderStatus === "completed" ||
                        order?.orderDetails?.orderStatus === "Completed")
                        ? "Paid"
                        : order?.orderDetails?.paymentStatus === "approved"
                        ? "Paid"
                        : order?.orderDetails?.paymentStatus === "rejected"
                        ? "Rejected"
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
                    <h3>
                      {order.userDetails?.firstName &&
                      order.userDetails?.lastName
                        ? `${order.userDetails.firstName} ${order.userDetails.lastName}`
                        : order.userDetails?.name
                        ? order.userDetails.name
                        : order.customerName
                        ? order.customerName
                        : "Customer"}
                    </h3>
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
              ![
                "completed",
                "cancelled",
                "Completed",
                "Cancelled",
                "Preparing Order",
                "preparing",
                "Ready for Pickup",
                "ready",
              ].includes(order.orderDetails.orderStatus)) &&
              // Hide the bottom cancel button if payment is rejected (to avoid duplicate cancel buttons)
              order.orderDetails.paymentStatus !== "rejected" && (
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

      {/* Updated Cancel Order Modal */}
      <IonModal
        isOpen={showCancelAlert}
        onDidDismiss={() => {
          setShowCancelAlert(false);
          setCancellationReason("");
          setCancellationNote("");
        }}
        className="cancel-order-modal"
      >
        <div className="cancel-order-content">
          <h2>Cancel Order</h2>
          <p>Please provide a reason for cancelling your order.</p>

          <div className="cancel-order-form">
            <IonSelect
              value={cancellationReason}
              placeholder="Select reason"
              onIonChange={(e) => setCancellationReason(e.detail.value)}
              className="cancel-order-select"
            >
              {CANCELLATION_REASONS.map((reason) => (
                <IonSelectOption key={reason.value} value={reason.value}>
                  {reason.label}
                </IonSelectOption>
              ))}
            </IonSelect>

            {cancellationReason === "other" && (
              <IonTextarea
                value={cancellationNote}
                placeholder="Please specify your reason"
                onIonChange={(e) => setCancellationNote(e.detail.value!)}
                className="cancel-order-textarea"
                rows={3}
              />
            )}
          </div>

          <div className="cancel-order-actions">
            <IonButton
              fill="outline"
              className="cancel-order-back-button"
              onClick={() => {
                setShowCancelAlert(false);
                setCancellationReason("");
                setCancellationNote("");
              }}
            >
              Back
            </IonButton>
            <IonButton
              color="danger"
              onClick={handleCancelOrder}
              disabled={
                !cancellationReason ||
                (cancellationReason === "other" && !cancellationNote)
              }
            >
              Confirm Cancellation
            </IonButton>
          </div>
        </div>
      </IonModal>

      {/* Appeal Payment Modal - Updated to match the design in the image */}
      <IonModal
        isOpen={showAppealModal}
        onDidDismiss={() => {
          setShowAppealModal(false);
          setNewReferenceNumber("");
          setNewScreenshot(null);
          setIsValidReference(false);
        }}
        className="appeal-payment-modal"
      >
        <div className="appeal-modal-header">
          <h2>Update Payment Information</h2>
          <IonButton
            fill="clear"
            className="appeal-modal-close-button"
            onClick={() => setShowAppealModal(false)}
          >
            <IonIcon icon={closeCircle} />
          </IonButton>
        </div>

        <div className="appeal-payment-content">
          <div className="appeal-one-time-notice">
            <IonIcon icon={informationCircleOutline} />
            <p>You can only submit corrected payment information once</p>
          </div>

          <div className="appeal-instructions">
            <p>
              Please provide the correct payment details to complete your order
              verification
            </p>
          </div>

          <div className="appeal-method-selector">
            <p className="method-label">Choose verification method</p>
            <div className="method-buttons">
              <div
                className={`method-button ${
                  appealVerificationMethod === "reference" ? "active" : ""
                }`}
                onClick={() => setAppealVerificationMethod("reference")}
              >
                <IonIcon icon={keyOutline} />
                <span>Reference Number</span>
              </div>
              <div
                className={`method-button ${
                  appealVerificationMethod === "screenshot" ? "active" : ""
                }`}
                onClick={() => setAppealVerificationMethod("screenshot")}
              >
                <IonIcon icon={imageOutline} />
                <span>Payment Screenshot</span>
              </div>
            </div>
          </div>

          {appealVerificationMethod === "reference" && (
            <div className="appeal-reference-input-field">
              <IonInput
                value={newReferenceNumber}
                placeholder="Enter 13-digit GCash reference number"
                onIonInput={(e) => setNewReferenceNumber(e.detail.value!)}
                className="appeal-reference-input"
                maxlength={13}
                inputmode="numeric"
                clearInput={true}
              />
              {referenceError && (
                <IonText color="danger" className="appeal-reference-error">
                  {referenceError}
                </IonText>
              )}
              {isValidReference && (
                <IonText color="success" className="appeal-reference-valid">
                  Reference number format is valid
                </IonText>
              )}
              <IonText color="medium" className="appeal-reference-help-text">
                You can find your 13-digit reference number in your GCash
                receipt
              </IonText>
            </div>
          )}

          {appealVerificationMethod === "screenshot" && (
            <div className="appeal-screenshot-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                hidden
              />
              {!newScreenshot ? (
                <div
                  className="appeal-upload-placeholder"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IonIcon icon={imageOutline} />
                  <h4>Upload GCash Receipt</h4>
                  <p>Tap here to select a screenshot</p>
                </div>
              ) : (
                <div className="appeal-uploaded-screenshot-preview">
                  <img src={newScreenshot} alt="Payment Receipt" />
                  <IonButton
                    color="light"
                    onClick={removeImage}
                    className="appeal-remove-image-button"
                  >
                    <IonIcon icon={trash} slot="icon-only" color="danger" />
                  </IonButton>
                </div>
              )}
            </div>
          )}

          <div className="appeal-actions">
            <IonButton
              className="appeal-submit-button"
              onClick={handleAppealSubmit}
              disabled={
                (appealVerificationMethod === "reference" &&
                  !isValidReference) ||
                (appealVerificationMethod === "screenshot" && !newScreenshot) ||
                appealLoading
              }
            >
              {appealLoading ? (
                <IonSpinner name="crescent" />
              ) : (
                "SUBMIT PAYMENT DETAILS"
              )}
            </IonButton>
          </div>
        </div>
      </IonModal>

      {/* GCash Modal */}
      <IonModal
        isOpen={showGcashModal}
        onDidDismiss={() => {
          setShowGcashModal(false);
          setNewReferenceNumber("");
          setNewScreenshot(null);
          setIsValidReference(false);
        }}
        className="order-gcash-modal"
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton
                onClick={() => setShowGcashModal(false)}
                className="order-modal-close-btn"
              >
                <IonIcon icon={closeCircle} />
              </IonButton>
            </IonButtons>
            <IonTitle>Update Payment Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="order-gcash-modal-content">
            {/* Appeal One-Time Warning Banner */}
            <div className="order-appeal-notice">
              <IonIcon icon={alertOutline} />
              <div>
                <h4>Important Notice</h4>
                <p>
                  You can only submit corrected payment information{" "}
                  <strong>ONCE</strong>.
                </p>
              </div>
            </div>

            {/* Verification Method Selection */}
            <div className="order-verification-selector">
              <IonSegment
                value={appealVerificationMethod}
                onIonChange={(e) =>
                  setAppealVerificationMethod(
                    e.detail.value as "reference" | "screenshot"
                  )
                }
              >
                <IonSegmentButton value="reference">
                  <IonLabel>Reference Number</IonLabel>
                  <IonIcon icon={keyOutline} />
                </IonSegmentButton>
                <IonSegmentButton value="screenshot">
                  <IonLabel>Screenshot</IonLabel>
                  <IonIcon icon={imageOutline} />
                </IonSegmentButton>
              </IonSegment>
            </div>

            {/* Reference Number Input - shown when reference method selected */}
            {appealVerificationMethod === "reference" && (
              <div className="order-reference-container">
                <h4>Enter GCash Reference Number</h4>
                <p>
                  Please provide the 13-digit reference number from your GCash
                  payment receipt
                </p>

                <IonItem lines="none" className="order-reference-input-item">
                  <IonInput
                    value={newReferenceNumber}
                    onIonInput={(e) => setNewReferenceNumber(e.detail.value!)}
                    placeholder="e.g., 1234567890123"
                    maxlength={13}
                    inputmode="numeric"
                    className={`order-reference-input ${
                      isValidReference ? "order-valid-reference" : ""
                    }`}
                  />
                </IonItem>

                {referenceError && (
                  <IonText color="danger" className="order-reference-error">
                    {referenceError}
                  </IonText>
                )}

                {isValidReference && (
                  <IonText color="success" className="order-reference-valid">
                    Reference number format is valid
                  </IonText>
                )}
              </div>
            )}

            {/* Screenshot Upload Section - shown when screenshot method selected */}
            {appealVerificationMethod === "screenshot" && (
              <div className="order-screenshot-container">
                <h4>Upload Payment Screenshot</h4>
                <p>
                  Please upload a clear screenshot of your GCash payment receipt
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  hidden
                />

                {!newScreenshot ? (
                  <div
                    className="order-upload-placeholder"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IonIcon
                      icon={cameraOutline}
                      className="order-upload-icon"
                    />
                    <p>Tap to select screenshot</p>
                  </div>
                ) : (
                  <div className="order-screenshot-preview">
                    <img src={newScreenshot} alt="Payment Receipt" />
                    <IonButton
                      fill="clear"
                      className="order-remove-screenshot-btn"
                      onClick={removeImage}
                    >
                      <IonIcon icon={trash} color="danger" />
                    </IonButton>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="order-submit-container">
              <IonButton
                expand="block"
                className="order-submit-button"
                disabled={
                  (appealVerificationMethod === "reference" &&
                    !isValidReference) ||
                  (appealVerificationMethod === "screenshot" &&
                    !newScreenshot) ||
                  appealLoading
                }
                onClick={handleAppealSubmit}
              >
                {appealLoading ? (
                  <>
                    <IonSpinner name="crescent" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  "Submit Payment Details"
                )}
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* <IonLoading isOpen={loading} message="Loading order details..." /> */}
    </IonPage>
  );
};

export default OrderDetail;
