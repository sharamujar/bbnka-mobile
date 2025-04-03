import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonBadge,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from "@ionic/react";
import {
  timeOutline,
  calendarOutline,
  cardOutline,
  locationOutline,
  chevronForwardOutline,
} from "ionicons/icons";
import { auth, db } from "../firebase-config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import "./Orders.css";

interface Order {
  id: string;
  userId: string;
  customerRef: string;
  items: {
    cartId: string;
    createdAt: string;
  }[];
  orderDetails: {
    pickupDate: string;
    pickupTime: string;
    paymentMethod: string;
    gcashReference: string | null;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
  };
}

interface CartItem {
  originalPrice: number;
  productPrice: number;
  productQuantity: number;
  productSize: string;
  productVarieties: string[];
  specialInstructions?: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<{ [key: string]: CartItem }>({});

  // Function to fetch cart item details
  const fetchCartItemDetails = async (userId: string, cartId: string) => {
    try {
      console.log(
        "Fetching cart item details for user:",
        userId,
        "cartId:",
        cartId
      );
      const cartItemRef = doc(db, "customers", userId, "cart", cartId);
      const cartItemDoc = await getDoc(cartItemRef);
      if (cartItemDoc.exists()) {
        const data = cartItemDoc.data();
        console.log("Cart item data found:", data);
        return data as CartItem;
      }
      console.log("No cart item found for cartId:", cartId);
      return null;
    } catch (error) {
      console.error("Error fetching cart item:", error);
      return null;
    }
  };

  useEffect(() => {
    console.log("Orders component mounted");
    const user = auth.currentUser;
    if (!user) {
      console.log("No user found, setting loading to false");
      setLoading(false);
      return;
    }

    console.log("Setting up orders listener for user:", user.uid);
    const ordersRef = collection(db, "orders");

    // Set up the listener with the correct query
    const q = query(
      ordersRef,
      where("userId", "==", user.uid),
      orderBy("orderDetails.createdAt", "desc")
    );

    console.log("Setting up listener with query:", q);
    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        console.log("Orders snapshot received");
        console.log("Snapshot size:", querySnapshot.size);

        const ordersList: Order[] = [];
        const cartItemsMap: { [key: string]: CartItem } = {};

        // Process each order
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          console.log("Processing order document:", doc.id);
          console.log("Order data:", JSON.stringify(data, null, 2));

          // Only process orders that match our expected structure
          if (data.orderDetails && data.items && Array.isArray(data.items)) {
            console.log("Valid order structure found");
            console.log("Items array:", data.items);

            // Fetch cart item details for each item
            for (const item of data.items) {
              console.log("Processing cart item:", item.cartId);
              if (!cartItemsMap[item.cartId]) {
                console.log("Fetching cart item details for:", item.cartId);
                const cartItemDetails = await fetchCartItemDetails(
                  user.uid,
                  item.cartId
                );
                console.log("Cart item details:", cartItemDetails);
                if (cartItemDetails) {
                  cartItemsMap[item.cartId] = cartItemDetails;
                }
              } else {
                console.log("Cart item already in map:", item.cartId);
              }
            }

            ordersList.push({ id: doc.id, ...data } as Order);
            console.log("Order added to list:", doc.id);
          } else {
            console.warn("Invalid order data structure:", data);
          }
        }

        console.log("Total orders processed:", ordersList.length);
        console.log("Final orders list:", ordersList);
        console.log("Final cart items map:", cartItemsMap);
        setOrders(ordersList);
        setCartItems(cartItemsMap);
        setLoading(false);
      },
      (error) => {
        console.error("Error in orders listener:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          stack: error.stack,
        });
        setLoading(false);
      }
    );

    return () => {
      console.log("Cleaning up orders listener");
      unsubscribe();
    };
  }, []);

  const handleRefresh = async (event: CustomEvent) => {
    const user = auth.currentUser;
    if (!user) {
      event.detail.complete();
      return;
    }

    try {
      // Query orders again
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("userId", "==", user.uid),
        orderBy("orderDetails.createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const ordersList: Order[] = [];
      const cartItemsMap: { [key: string]: CartItem } = {};

      // Process each order
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        console.log("Refreshed order data:", data);

        if (data.orderDetails && data.items && Array.isArray(data.items)) {
          // Fetch cart item details for each item
          for (const item of data.items) {
            if (!cartItemsMap[item.cartId]) {
              const cartItemDetails = await fetchCartItemDetails(
                user.uid,
                item.cartId
              );
              if (cartItemDetails) {
                cartItemsMap[item.cartId] = cartItemDetails;
              }
            }
          }

          ordersList.push({ id: doc.id, ...data } as Order);
        }
      }

      setOrders(ordersList);
      setCartItems(cartItemsMap);
    } catch (error) {
      console.error("Error refreshing orders:", error);
    }

    event.detail.complete();
  };

  const getStatusColor = (status: string | undefined) => {
    // If status is undefined, return a default color
    if (!status) {
      return "medium";
    }

    switch (status.toLowerCase()) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "medium";
    }
  };

  const getPaymentStatus = (paymentMethod: string, status: string) => {
    if (paymentMethod === "cash") {
      return "Verified";
    }
    // For GCash payments
    switch (status.toLowerCase()) {
      case "pending":
        return "Pending Verification";
      case "approved":
        return "Verified";
      case "rejected":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    // Return the time string as is since it's already in the correct format
    return timeString;
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>My Orders</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="orders-container">
            {[1, 2, 3].map((index) => (
              <IonCard key={index} className="order-card">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonSkeletonText animated style={{ width: "60%" }} />
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonSkeletonText animated style={{ width: "80%" }} />
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        </IonContent>
      </IonPage>
    );
  }

  console.log("Rendering orders page with orders:", orders);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Orders</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="orders-container">
          {orders.length === 0 ? (
            <div className="no-orders">
              <IonIcon icon={timeOutline} className="no-orders-icon" />
              <p>No orders found</p>
            </div>
          ) : (
            orders.map((order) => {
              console.log("Rendering order:", order.id, order);
              return (
                <IonCard key={order.id} className="order-card">
                  <IonCardHeader>
                    <div className="order-header">
                      <div className="order-title">
                        <IonCardTitle>
                          Order #{order.id.slice(0, 6)}
                        </IonCardTitle>
                        <IonBadge
                          color={getStatusColor(
                            order.orderDetails.paymentStatus
                          )}
                        >
                          {(
                            order.orderDetails.paymentStatus || "PENDING"
                          ).toUpperCase()}
                        </IonBadge>
                      </div>
                      <IonIcon
                        icon={chevronForwardOutline}
                        className="order-arrow"
                      />
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList lines="none">
                      <IonItem>
                        <IonIcon icon={calendarOutline} slot="start" />
                        <IonLabel>
                          <div className="order-detail">
                            <span className="detail-label">Pickup Date</span>
                            <span className="detail-value">
                              {formatDate(order.orderDetails.pickupDate)}
                            </span>
                          </div>
                        </IonLabel>
                      </IonItem>
                      <IonItem>
                        <IonIcon icon={timeOutline} slot="start" />
                        <IonLabel>
                          <div className="order-detail">
                            <span className="detail-label">Pickup Time</span>
                            <span className="detail-value">
                              {formatTime(order.orderDetails.pickupTime)}
                            </span>
                          </div>
                        </IonLabel>
                      </IonItem>
                      <IonItem>
                        <IonIcon icon={cardOutline} slot="start" />
                        <IonLabel>
                          <div className="order-detail">
                            <span className="detail-label">Payment Method</span>
                            <span className="detail-value">
                              {order.orderDetails.paymentMethod.toUpperCase()}
                            </span>
                          </div>
                        </IonLabel>
                      </IonItem>
                      {order.orderDetails.paymentMethod === "gcash" &&
                        order.orderDetails.gcashReference && (
                          <IonItem>
                            <IonIcon icon={cardOutline} slot="start" />
                            <IonLabel>
                              <div className="order-detail">
                                <span className="detail-label">
                                  GCash Reference
                                </span>
                                <span className="detail-value">
                                  {order.orderDetails.gcashReference}
                                </span>
                              </div>
                            </IonLabel>
                          </IonItem>
                        )}
                      <IonItem>
                        <IonIcon icon={locationOutline} slot="start" />
                        <IonLabel>
                          <div className="order-detail">
                            <span className="detail-label">
                              Pickup Location
                            </span>
                            <span className="detail-value">
                              Store Address, City, Philippines
                            </span>
                          </div>
                        </IonLabel>
                      </IonItem>
                      <IonItem className="order-items">
                        <IonLabel>
                          <div className="order-items-content">
                            {order.items.map((item) => {
                              const cartItem = cartItems[item.cartId];
                              return cartItem ? (
                                <div key={item.cartId} className="order-item">
                                  <span className="item-size">
                                    {cartItem.productSize}
                                  </span>
                                  <span className="item-quantity">
                                    x{cartItem.productQuantity}
                                  </span>
                                  <span className="item-price">
                                    ₱{cartItem.productPrice}
                                  </span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </IonLabel>
                      </IonItem>
                      <IonItem className="order-total">
                        <IonLabel>
                          <div className="order-detail">
                            <span className="detail-label">Total Amount</span>
                            <span className="detail-value total-amount">
                              ₱{order.orderDetails.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </IonLabel>
                      </IonItem>
                    </IonList>
                  </IonCardContent>
                </IonCard>
              );
            })
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Orders;
