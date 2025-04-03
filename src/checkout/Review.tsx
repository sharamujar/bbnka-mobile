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
} from "@ionic/react";
import {
  chevronBackCircleOutline,
  chevronForwardCircle,
  checkmarkCircleSharp,
  timeOutline,
  calendarOutline,
  cardOutline,
  locationOutline,
} from "ionicons/icons";
import { auth, db } from "../firebase-config";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  writeBatch,
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

  // Get data from localStorage
  const [orderDetails, setOrderDetails] = useState({
    pickupDate: localStorage.getItem("pickupDate") || "",
    pickupTime: localStorage.getItem("pickupTime") || "",
    paymentMethod: localStorage.getItem("paymentMethod") || "cash",
    gcashReference: localStorage.getItem("gcashReference") || "",
  });

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
      console.log("No user found, cannot create order");
      setToastMessage("Please login to place an order");
      setShowToast(true);
      return;
    }

    if (cartItems.length === 0) {
      console.log("Cart is empty, cannot create order");
      setToastMessage("Your cart is empty");
      setShowToast(true);
      return;
    }

    setIsOrdering(true);
    try {
      // Calculate totals
      const serviceFee = 50;
      const totalAmount = subtotal;

      console.log("Creating order with data:", {
        userId: user.uid,
        items: cartItems,
        orderDetails: {
          pickupDate: orderDetails.pickupDate,
          pickupTime: orderDetails.pickupTime,
          paymentMethod: orderDetails.paymentMethod,
          gcashReference: orderDetails.gcashReference || null,
          totalAmount: totalAmount,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      });

      // Create order document with hybrid structure
      const orderData = {
        userId: user.uid,
        customerRef: `customers/${user.uid}`,
        items: cartItems.map((item) => ({
          cartId: item.id,
          createdAt: item.createdAt,
        })),
        orderDetails: {
          pickupDate: orderDetails.pickupDate,
          pickupTime: orderDetails.pickupTime,
          paymentMethod: orderDetails.paymentMethod,
          gcashReference: orderDetails.gcashReference || null,
          totalAmount: totalAmount,
          paymentStatus:
            orderDetails.paymentMethod === "cash" ? "approved" : "pending",
          createdAt: new Date().toISOString(),
        },
      };

      console.log("Creating order with hybrid structure:", orderData);
      const orderRef = await addDoc(collection(db, "orders"), orderData);

      // Clear cart items
      const batch = writeBatch(db);
      cartItems.forEach((item) => {
        const cartItemRef = doc(db, "customers", user.uid, "cart", item.id);
        batch.delete(cartItemRef);
      });
      await batch.commit();
      console.log("Cart items cleared successfully");

      // Clear localStorage
      localStorage.removeItem("pickupDate");
      localStorage.removeItem("pickupTime");
      localStorage.removeItem("paymentMethod");
      localStorage.removeItem("gcashReference");
      console.log("LocalStorage cleared");

      // Show success message
      setToastMessage("Order placed successfully!");
      setShowToast(true);

      // Redirect to orders page
      setTimeout(() => {
        history.push("/orders");
      }, 1500);
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
          <IonTitle className="title-toolbar">Review Order</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <CheckoutStepProgress currentStep={currentStep} />
        <div className="review-container">
          {/* Order Summary Section */}
          <IonCard className="review-card">
            <IonCardHeader>
              <IonCardTitle>ORDER SUMMARY</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList lines="none">
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
                            Qty: {item.productQuantity}
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
                        <span className="total-label">TOTAL AMOUNT</span>
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

          {/* Pickup Details Section */}
          <IonCard className="review-card">
            <IonCardHeader>
              <IonCardTitle>PICKUP DETAILS</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="12">
                    <div className="detail-item">
                      <IonIcon icon={calendarOutline} className="detail-icon" />
                      <div className="detail-content">
                        <div className="detail-label">PICKUP DATE</div>
                        <div className="detail-value">
                          {orderDetails.pickupDate}
                        </div>
                      </div>
                    </div>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12">
                    <div className="detail-item">
                      <IonIcon icon={timeOutline} className="detail-icon" />
                      <div className="detail-content">
                        <div className="detail-label">PICKUP TIME</div>
                        <div className="detail-value">
                          {orderDetails.pickupTime}
                        </div>
                      </div>
                    </div>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12">
                    <div className="detail-item">
                      <IonIcon icon={locationOutline} className="detail-icon" />
                      <div className="detail-content">
                        <div className="detail-label">PICKUP LOCATION</div>
                        <div className="detail-value">
                          Store Address, City, Philippines
                        </div>
                      </div>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* Payment Details Section */}
          <IonCard className="review-card">
            <IonCardHeader>
              <IonCardTitle>PAYMENT DETAILS</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="12">
                    <div className="detail-item">
                      <IonIcon icon={cardOutline} className="detail-icon" />
                      <div className="detail-content">
                        <div className="detail-label">PAYMENT METHOD</div>
                        <div className="detail-value">
                          {orderDetails.paymentMethod.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </IonCol>
                </IonRow>
                {orderDetails.paymentMethod === "gcash" &&
                  orderDetails.gcashReference && (
                    <IonRow>
                      <IonCol size="12">
                        <div className="detail-item">
                          <IonIcon icon={cardOutline} className="detail-icon" />
                          <div className="detail-content">
                            <div className="detail-label">GCASH REFERENCE</div>
                            <div className="detail-value">
                              {orderDetails.gcashReference}
                            </div>
                          </div>
                        </div>
                      </IonCol>
                    </IonRow>
                  )}
              </IonGrid>
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
              >
                <IonIcon icon={chevronBackCircleOutline} slot="start" />
                Back to Payment
              </IonButton>
            </div>
            <div className="footer-action-button-container">
              <IonButton
                className="footer-action-button"
                onClick={nextStep}
                disabled={isOrdering}
              >
                <IonIcon icon={checkmarkCircleSharp} slot="start" />
                {isOrdering ? "Processing..." : "Confirm Order"}
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
    </IonPage>
  );
};

export default Review;
