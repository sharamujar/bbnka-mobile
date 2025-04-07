import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonToast,
  IonModal,
} from "@ionic/react";
import {
  chevronBackCircleOutline,
  chevronForwardCircle,
  checkmarkCircleSharp,
  timeOutline,
  calendarOutline,
  cardOutline,
  locationOutline,
  closeCircleOutline,
  storefront,
  home,
} from "ionicons/icons";
import { auth, db } from "../firebase-config";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import CheckoutStepProgress from "../components/CheckoutStepProgress";
import "./Review.css";

const Review: React.FC = () => {
  const history = useHistory();
  const [currentStep, setCurrentStep] = useState(2);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderId, setOrderId] = useState("");

  // Get data from localStorage
  const [orderDetails, setOrderDetails] = useState({
    pickupDate: "",
    pickupTime: "",
    paymentMethod: "cash",
    gcashReference: "",
    pickupOption: "later",
  });

  // Force update when component becomes active
  useEffect(() => {
    // Function to update order details from localStorage
    const updateOrderDetails = () => {
      const pickupOptionFromStorage = localStorage.getItem("pickupOption");

      setOrderDetails({
        pickupDate: localStorage.getItem("pickupDate") || "",
        pickupTime: localStorage.getItem("pickupTime") || "",
        paymentMethod: localStorage.getItem("paymentMethod") || "cash",
        gcashReference: localStorage.getItem("gcashReference") || "",
        pickupOption: pickupOptionFromStorage === "now" ? "now" : "later",
      });
    };

    // Update initially
    updateOrderDetails();

    // Set up a polling interval to check for localStorage changes
    // This ensures we catch changes when navigating between pages
    const intervalId = setInterval(updateOrderDetails, 500);

    // Create a custom event for localStorage changes (for other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "paymentMethod" ||
        e.key === "gcashReference" ||
        e.key === "pickupDate" ||
        e.key === "pickupTime" ||
        e.key === "pickupOption"
      ) {
        updateOrderDetails();
      }
    };

    // Add event listener for storage changes
    window.addEventListener("storage", handleStorageChange);

    // Add event listener for when the component mounts/remounts
    const handleRouteChange = () => {
      updateOrderDetails();
    };

    // Use this to detect route changes (this is a hack but works)
    const originalPushState = history.push;
    history.push = (...args: Parameters<typeof originalPushState>) => {
      handleRouteChange();
      return originalPushState.apply(history, args);
    };

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
      history.push = originalPushState;
    };
  }, [history]);

  // Add useEffect to log orderDetails changes for debugging
  useEffect(() => {
    console.log("Order Details updated:", orderDetails);
  }, [orderDetails]);

  // Fetch cart items
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const cartRef = collection(db, "customers", user.uid, "cart");
    const unsubscribe = onSnapshot(cartRef, (querySnapshot) => {
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ ...doc.data(), id: doc.id });
      });
      setCartItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate totals
  const subtotal = cartItems.reduce(
    (total, item) => total + item.productPrice,
    0
  );
  const discountPercentage = 0;
  const discountAmount = (subtotal * discountPercentage) / 100;
  const total = subtotal - discountAmount;

  const createOrder = async () => {
    const user = auth.currentUser;
    if (!user) {
      setToastMessage("Please login to place an order");
      setShowToast(true);
      return;
    }

    if (cartItems.length === 0) {
      setToastMessage("Your cart is empty");
      setShowToast(true);
      return;
    }

    setIsOrdering(true);

    try {
      // Get the customer data first
      const customerDocRef = doc(db, "customers", user.uid);
      const customerDoc = await getDoc(customerDocRef);
      const customerData = customerDoc.data();

      // Extract customer name using various possible fields
      const customerName =
        customerData?.name ||
        (customerData?.firstName && customerData?.lastName)
          ? `${customerData.firstName} ${customerData.lastName}`
          : customerData?.firstName || "Customer";

      // Add user details directly to order
      const userDetails = {
        firstName:
          customerData?.firstName || customerData?.name?.split(" ")[0] || "New",
        lastName:
          customerData?.lastName ||
          (customerData?.name
            ? customerData.name.split(" ").slice(1).join(" ")
            : "User"),
        name:
          customerData?.name ||
          customerData?.name ||
          `${customerData?.firstName || "New"} ${
            customerData?.lastName || "User"
          }`,
        email: user.email || customerData?.email || "",
      };

      // Calculate total amount
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.productPrice,
        0
      );

      // Determine order status based on payment method only
      let orderStatus = "scheduled"; // Default is "Order Placed"

      // For GCash payments, we need payment verification
      if (orderDetails.paymentMethod === "gcash") {
        orderStatus = "awaiting_payment_verification";
      }

      const ordersRef = collection(db, "orders");
      const orderData = {
        userId: user.uid,
        customerName: customerName,
        status: orderStatus, // Changed from orderStatus to status
        createdAt: serverTimestamp(),
        items: cartItems.map((item) => ({
          cartId: item.id,
          createdAt: item.createdAt,
          productSize: item.productSize,
          productVarieties: item.productVarieties || [],
          productQuantity: item.productQuantity || 1,
          productPrice: item.productPrice,
        })),
        orderDetails: {
          createdAt: new Date().toISOString(),
          gcashReference: orderDetails.gcashReference || null,
          paymentMethod: orderDetails.paymentMethod,
          paymentStatus:
            orderDetails.paymentMethod === "cash" ? "approved" : "pending",
          pickupDate: orderDetails.pickupDate,
          pickupTime: orderDetails.pickupTime,
          pickupOption: orderDetails.pickupOption,
          totalAmount: totalAmount,
        },
      };

      const orderRef = await addDoc(ordersRef, orderData);
      setOrderId(orderRef.id);

      // Create notification with appropriate message
      let notificationMessage = `Your order #${orderRef.id} has been placed successfully. `;

      if (orderDetails.paymentMethod === "cash") {
        if (orderDetails.pickupOption === "now") {
          notificationMessage +=
            "Please wait at the store. Your order has been placed.";
        } else {
          notificationMessage +=
            "Please prepare the exact amount when picking up your order.";
        }
      } else {
        notificationMessage += "Your GCash payment is pending verification.";
      }

      const notificationsRef = collection(db, "notifications");
      await addDoc(notificationsRef, {
        userId: user.uid,
        title: "Order Placed Successfully",
        message: notificationMessage,
        type: "success",
        createdAt: serverTimestamp(),
        isRead: false,
        orderId: orderRef.id,
      });

      // Clear cart items
      const batch = writeBatch(db);
      cartItems.forEach((item) => {
        const cartItemRef = doc(db, "customers", user.uid, "cart", item.id);
        batch.delete(cartItemRef);
      });
      await batch.commit();

      // Log pickup details for debugging
      console.log("Order created with pickup details:", {
        date: orderDetails.pickupDate,
        time: orderDetails.pickupTime,
        option: orderDetails.pickupOption,
      });

      // Show confirmation modal
      setShowConfirmation(true);
    } catch (error) {
      console.error("Error creating order:", error);
      setToastMessage("Failed to place order. Please try again.");
      setShowToast(true);
    } finally {
      setIsOrdering(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep((prevStep) => prevStep + 1);
      history.replace("/home/cart/schedule/payment/review");
    } else {
      createOrder();
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);

    // Only clear localStorage after confirmation is dismissed
    localStorage.removeItem("pickupDate");
    localStorage.removeItem("pickupTime");
    localStorage.removeItem("paymentMethod");
    localStorage.removeItem("gcashReference");
    localStorage.removeItem("pickupOption");
    localStorage.removeItem("status");

    history.push("/home");
  };

  // Force refresh when coming back to this page
  useEffect(() => {
    // This will run when the component is focused
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") {
        // Force refresh state from localStorage
        const pickupOptionFromStorage = localStorage.getItem("pickupOption");

        setOrderDetails({
          pickupDate: localStorage.getItem("pickupDate") || "",
          pickupTime: localStorage.getItem("pickupTime") || "",
          paymentMethod: localStorage.getItem("paymentMethod") || "cash",
          gcashReference: localStorage.getItem("gcashReference") || "",
          pickupOption: pickupOptionFromStorage === "now" ? "now" : "later",
        });
      }
    };

    document.addEventListener("visibilitychange", refreshOnFocus);
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      document.removeEventListener("visibilitychange", refreshOnFocus);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, []);

  // Load order details from localStorage on component mount
  useEffect(() => {
    const pickupDate = localStorage.getItem("pickupDate");
    const pickupTime = localStorage.getItem("pickupTime");
    const paymentMethod = localStorage.getItem("paymentMethod") || "cash";
    const gcashReference = localStorage.getItem("gcashReference") || "";
    const pickupOption =
      localStorage.getItem("pickupOption") === "now" ? "now" : "later";

    // Log the values we're loading to help with debugging
    console.log("Loading order details from localStorage:", {
      pickupDate,
      pickupTime,
      paymentMethod,
      pickupOption,
    });

    setOrderDetails({
      pickupDate: pickupDate || "",
      pickupTime: pickupTime || "",
      paymentMethod,
      gcashReference,
      pickupOption,
    });
  }, []);

  // badge color
  const getSizeColor = (sizeName: any): string => {
    // Handle case where sizeName is undefined or null
    if (!sizeName) {
      return "hsl(0, 0%, 50%)"; // Default gray color
    }

    // Handle case where sizeName is an object
    if (typeof sizeName === "object") {
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

  // badge initials
  const getSizeAbbreviation = (sizeName: any): string => {
    // Handle case where sizeName is undefined or null
    if (!sizeName) {
      return "N/A";
    }

    // Handle case where sizeName is an object
    if (typeof sizeName === "object") {
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Review</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="checkout-progress-container">
          <CheckoutStepProgress currentStep={currentStep} />
        </div>
        <div className="review-container">
          {/* Order Summary Section */}
          <IonCard className="review-card">
            <IonCardHeader>
              <IonCardTitle>Items</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList lines="none" className="clean-list">
                {cartItems.map((item) => (
                  <IonItem key={item.id} className="review-item">
                    <IonLabel>
                      <div className="review-item-content">
                        <div className="review-item-header">
                          <IonBadge
                            className="size-badge"
                            style={{
                              backgroundColor: getSizeColor(item.productSize),
                            }}
                          >
                            {getSizeAbbreviation(item.productSize)}
                          </IonBadge>
                          <IonText className="review-item-name">
                            {typeof item.productSize === "object"
                              ? item.productSize.name
                              : item.productSize}
                          </IonText>
                        </div>
                        {Array.isArray(item.productVarieties) &&
                          item.productVarieties.length > 0 && (
                            <IonText className="review-varieties">
                              {item.productVarieties.join(", ")}
                            </IonText>
                          )}
                        <div className="review-item-footer">
                          <IonText className="review-quantity">
                            {item.productQuantity}{" "}
                            {item.productQuantity > 1 ? "items" : "item"}
                          </IonText>
                          <IonText className="review-price">
                            ₱{item.productPrice.toLocaleString()}
                          </IonText>
                        </div>
                      </div>
                    </IonLabel>
                  </IonItem>
                ))}

                <IonItem className="total-item">
                  <IonLabel>
                    <div className="total-content">
                      <div className="total-header">
                        <span className="total-label">Total</span>
                        <span className="total-amount">
                          ₱{total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </IonLabel>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Pickup & Payment Details Combined Section */}
          <IonCard className="review-card details-card">
            <IonCardHeader>
              <IonCardTitle>Order Details</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="details-section">
                <h4 className="section-subtitle">Pickup Information</h4>
                <div className="detail-item">
                  <IonIcon icon={calendarOutline} className="detail-icon" />
                  <div className="detail-content">
                    <div className="review-detail-label">Date</div>
                    <div className="detail-value">
                      {orderDetails.pickupDate}
                    </div>
                  </div>
                </div>
                <div className="detail-item">
                  <IonIcon icon={timeOutline} className="detail-icon" />
                  <div className="detail-content">
                    <div className="review-detail-label">Time</div>
                    <div className="detail-value">
                      {orderDetails.pickupTime}
                    </div>
                  </div>
                </div>
                <div className="detail-item">
                  <IonIcon icon={locationOutline} className="detail-icon" />
                  <div className="detail-content">
                    <div className="review-detail-label">Location</div>
                    <div className="detail-value">
                      Store Address, City, Philippines
                    </div>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4 className="section-subtitle">Payment Information</h4>
                <div className="detail-item">
                  <IonIcon icon={cardOutline} className="detail-icon" />
                  <div className="detail-content">
                    <div className="review-detail-label">Method</div>
                    <div className="detail-value">
                      {orderDetails.paymentMethod === "gcash"
                        ? "GCash"
                        : "Cash"}
                    </div>
                  </div>
                </div>
                {orderDetails.paymentMethod === "gcash" &&
                  orderDetails.gcashReference && (
                    <div className="detail-item">
                      <IonIcon icon={cardOutline} className="detail-icon" />
                      <div className="detail-content">
                        <div className="review-detail-label">Reference #</div>
                        <div className="detail-value ref-number">
                          {orderDetails.gcashReference}
                        </div>
                      </div>
                    </div>
                  )}
                <div className="detail-item">
                  <IonIcon
                    icon={
                      orderDetails.pickupOption === "now"
                        ? storefront
                        : calendarOutline
                    }
                    className="detail-icon"
                  />
                  <div className="detail-content">
                    <div className="review-detail-label">Pickup Option</div>
                    <div className="detail-value">
                      {orderDetails.pickupOption === "now"
                        ? "Pickup Today (Walk-in)"
                        : "Scheduled for Later"}
                    </div>
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>

      <IonFooter>
        <IonToolbar className="product-footer">
          <div className="footer-content">
            <div className="footer-back-action-button-container">
              <IonButton
                className="footer-back-action-button"
                routerLink="/home/cart/schedule/payment"
                fill="outline"
                disabled={isOrdering}
                onClick={() => {
                  // No review-specific data to clear, but could be added here if needed
                }}
              >
                <IonIcon icon={chevronBackCircleOutline} slot="start" />
                Back
              </IonButton>
            </div>
            <div className="footer-action-button-container">
              <IonButton
                className="footer-action-button"
                onClick={nextStep}
                disabled={isOrdering}
              >
                <IonIcon icon={checkmarkCircleSharp} slot="start" />
                {isOrdering ? "Processing..." : "Place Order"}
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonFooter>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="bottom"
        color={toastMessage.includes("successfully") ? "success" : "danger"}
      />

      <IonModal
        isOpen={showConfirmation}
        onDidDismiss={handleCloseConfirmation}
        className="review-order-confirmation-modal"
      >
        <div className="review-confirmation-modal">
          <div className="review-confirmation-header">
            <div className="review-result-icon">
              <IonIcon
                icon={checkmarkCircleSharp}
                className="review-success-icon"
              />
            </div>
            <h2>Order Placed Successfully</h2>
          </div>

          <div className="review-confirmation-content">
            <div className="compact-order-info">
              <p className="review-order-id">
                <strong>Order #</strong>
                <span className="order-id-value">{orderId}</span>
              </p>

              <div className="info-row">
                <div className="info-item">
                  <IonIcon icon={cardOutline} />
                  <span>
                    {orderDetails.paymentMethod === "gcash" ? "GCash" : "Cash"}
                  </span>
                </div>

                <div className="info-item">
                  <IonIcon
                    icon={
                      orderDetails.pickupOption === "now"
                        ? storefront
                        : calendarOutline
                    }
                  />
                  <span>
                    {orderDetails.pickupOption === "now"
                      ? "Today"
                      : "Scheduled"}
                  </span>
                </div>
              </div>
            </div>

            <div className="compact-pickup-details">
              <div className="pickup-label">Pickup Details</div>
              <div className="pickup-row">
                <div className="pickup-date">
                  <IonIcon icon={calendarOutline} />
                  <span>{orderDetails.pickupDate}</span>
                </div>
                <div className="pickup-time">
                  <IonIcon icon={timeOutline} />
                  <span>{orderDetails.pickupTime}</span>
                </div>
              </div>
            </div>

            <div className="payment-instructions">
              {orderDetails.paymentMethod === "gcash" ? (
                <p className="instruction-text">
                  Your GCash payment is pending verification. We'll notify you
                  when confirmed.
                </p>
              ) : (
                <p className="instruction-text">
                  {orderDetails.pickupOption === "now"
                    ? "Please pay at the store when your order is ready."
                    : "Please prepare the exact amount for pickup."}
                </p>
              )}

              {/* {orderDetails.pickupOption === "now" && (
                <p className="instruction-note">
                  Please wait at the store while your order is being prepared.
                </p>
              )} */}
            </div>
          </div>

          <div className="review-confirmation-actions">
            <IonButton
              expand="block"
              onClick={handleCloseConfirmation}
              className="home-return-button"
            >
              <IonIcon icon={home} slot="start" />
              Return to Home
            </IonButton>
          </div>
        </div>
      </IonModal>
    </IonPage>
  );
};

export default Review;
