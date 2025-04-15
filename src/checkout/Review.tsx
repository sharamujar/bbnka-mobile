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
  IonLoading,
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
  imageOutline,
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
import dayjs from "dayjs";

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = "bbnka-payment-screenshots"; // Set your upload preset here
const CLOUDINARY_CLOUD_NAME = "dbmofuvwn"; // Set your cloud name here
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/dbmofuvwn/image/upload`;

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
  const [isUploading, setIsUploading] = useState(false);

  // Get data from localStorage
  const [orderDetails, setOrderDetails] = useState({
    pickupDate: "",
    pickupTime: "",
    paymentMethod: "cash",
    gcashReference: "",
    pickupOption: "later",
  });

  // Helper function to upload GCash screenshot to Cloudinary
  const uploadImageToCloudinary = async (
    base64Image: string
  ): Promise<string> => {
    // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
    const imageData = base64Image.split(",")[1];

    // setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", `data:image/jpeg;base64,${imageData}`);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();
      console.log("Image uploaded successfully:", data);

      // Return the secure URL of the uploaded image
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      throw error;
    } finally {
      // setIsUploading(false);
    }
  };

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

      console.log("Customer data from Firestore:", customerData);

      // Extract customer name following the same logic as in inventory
      let customerName = "";

      if (customerData) {
        if (customerData.name) {
          // For users who signed in with Google
          customerName = customerData.name;
        } else if (customerData.firstName && customerData.lastName) {
          // For users who registered directly
          customerName = `${customerData.firstName} ${customerData.lastName}`;
        } else if (customerData.firstName) {
          customerName = customerData.firstName;
        } else {
          customerName = "Customer";
        }
      } else {
        // Fallback if no customer data
        customerName = user.displayName || "Customer";
      }

      console.log("Using customer name:", customerName);

      // Handle GCash screenshot upload if present
      let gcashData = orderDetails.gcashReference || null;
      let gcashScreenshotUrl = null;

      if (
        orderDetails.paymentMethod === "gcash" &&
        orderDetails.gcashReference === "SCREENSHOT_UPLOADED"
      ) {
        // Get the screenshot from localStorage
        const screenshot = localStorage.getItem("gcashScreenshot");

        if (screenshot) {
          try {
            // Upload to Cloudinary and get the URL
            gcashScreenshotUrl = await uploadImageToCloudinary(screenshot);
            console.log(
              "GCash screenshot uploaded to Cloudinary:",
              gcashScreenshotUrl
            );

            // Keep gcashReference as SCREENSHOT_UPLOADED
            gcashData = "SCREENSHOT_UPLOADED";
          } catch (error) {
            console.error("Failed to upload GCash screenshot:", error);
            setToastMessage(
              "Failed to upload payment screenshot. Please try again."
            );
            setShowToast(true);
            setIsOrdering(false);
            return;
          }
        }
      }

      // Calculate total amount
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.productPrice,
        0
      );

      // Set initial order status
      let orderStatus = "Order Confirmed"; // Technical status value
      let statusDisplay = "Order Confirmed"; // User-friendly display name
      let paymentStatus = "pending"; // All payments start as pending now

      // For GCash payments with pending verification, keep the special status
      if (orderDetails.paymentMethod === "gcash") {
        // If we have a screenshot or reference number, mark for verification
        orderStatus = "awaiting_payment_verification";
        statusDisplay = "Payment Pending"; // User-friendly display name
      }

      const ordersRef = collection(db, "orders");
      const orderData = {
        userId: user.uid,
        customerName: customerName, // Store only the customer name
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
          gcashReference: gcashData,
          gcashScreenshotUrl: gcashScreenshotUrl, // Add the screenshot URL separately
          paymentMethod: orderDetails.paymentMethod,
          paymentStatus: paymentStatus,
          pickupDate: orderDetails.pickupDate,
          pickupTime: orderDetails.pickupTime,
          pickupOption: orderDetails.pickupOption,
          totalAmount: totalAmount,
          status: statusDisplay, // User-friendly display name
          orderStatus: orderStatus, // Technical status value
        },
      };

      // Log the final order data for debugging
      console.log("Saving order with data:", {
        userId: orderData.userId,
        customerName: orderData.customerName,
        itemCount: orderData.items.length,
        orderDetails: orderData.orderDetails,
      });

      const orderRef = await addDoc(ordersRef, orderData);
      setOrderId(orderRef.id);

      // Create notification with appropriate message
      let notificationMessage = `Your order #${orderRef.id} has been placed successfully. `;

      if (orderDetails.paymentMethod === "cash") {
        if (orderDetails.pickupOption === "now") {
          notificationMessage +=
            "Please proceed to the payment counter to complete your purchase.";
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
    localStorage.removeItem("gcashScreenshot");
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
    const pickupDate = localStorage.getItem("pickupDate") || "";
    const pickupTime = localStorage.getItem("pickupTime") || "";
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
      pickupDate,
      pickupTime,
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

  // Helper function to parse and format a date from YYYY-MM-DD format
  const formatDateToDisplay = (dateString: string) => {
    if (!dateString) return "Not selected";

    try {
      // Check for date in YYYY-MM-DD format
      const date = dayjs(dateString);
      if (date.isValid()) {
        return date.format("dddd, MMMM D, YYYY");
      }
      return dateString;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original string if there's an error
    }
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
                      {formatDateToDisplay(orderDetails.pickupDate)}
                    </div>
                  </div>
                </div>
                <div className="detail-item">
                  <IonIcon icon={timeOutline} className="detail-icon" />
                  <div className="detail-content">
                    <div className="review-detail-label">Time</div>
                    <div className="detail-value">
                      {orderDetails.pickupTime || "Not selected"}
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
                {orderDetails.paymentMethod === "gcash" && (
                  <div className="detail-item">
                    <IonIcon icon={cardOutline} className="detail-icon" />
                    <div className="detail-content">
                      <div className="review-detail-label">
                        Payment Verification
                      </div>
                      <div className="detail-value">
                        {orderDetails.gcashReference ===
                        "SCREENSHOT_UPLOADED" ? (
                          <span className="screenshot-indicator">
                            <IonIcon icon={imageOutline} /> Screenshot Uploaded
                          </span>
                        ) : (
                          <span className="ref-number">
                            Reference #: {orderDetails.gcashReference}
                          </span>
                        )}
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
                        ? "Today"
                        : "Scheduled"}
                    </div>
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <div className="modal-footer-buttons">
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

            <IonButton
              className="footer-action-button place-order-button"
              onClick={nextStep}
              disabled={isOrdering}
            >
              <IonIcon icon={checkmarkCircleSharp} slot="start" />
              {isOrdering ? "Processing..." : "Place Order"}
            </IonButton>
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

      {/* Loading indicator for Cloudinary upload */}
      <IonLoading
        isOpen={isUploading}
        message="Placing your order"
        spinner="circles"
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
                  <span>{formatDateToDisplay(orderDetails.pickupDate)}</span>
                </div>
                <div className="pickup-time">
                  <IonIcon icon={timeOutline} />
                  <span>{orderDetails.pickupTime || "Not selected"}</span>
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
                    ? "Please proceed to the payment counter to complete your purchase."
                    : "Please bring payment when you pick up your order at the scheduled time."}
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
