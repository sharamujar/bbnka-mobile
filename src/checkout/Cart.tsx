import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonPage,
  IonRouterLink,
  IonRow,
  IonText,
  IonThumbnail,
  IonTitle,
  IonToolbar,
  useIonAlert,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase-config";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  add,
  addCircle,
  arrowForward,
  bag,
  cardOutline,
  cart,
  cartOutline,
  chevronForward,
  chevronForwardCircle,
  close,
  remove,
  removeCircle,
  timeOutline,
  trash,
  trashBin,
  trashBinOutline,
  trashSharp,
} from "ionicons/icons";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import "./Cart.css";
import BuildYourOwnModal from "../components/BuildYourOwnModal";

const Cart: React.FC = () => {
  const user = auth.currentUser;
  const history = useHistory(); //for navigation

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBYOKModal, setShowBYOKModal] = useState(false);

  const [quantity, setQuantity] = useState(1);

  // Toast message handler for BuildYourOwnModal
  const handleShowToastMessage = (message: string, success: boolean) => {
    console.log("Toast message (not shown):", message, success);
    // We're not showing a toast here, but the BuildYourOwnModal requires this prop
  };

  useEffect(() => {
    console.log("Cart component mounted");
    console.log("Auth state:", user ? "Logged in" : "Not logged in");

    // Clear any existing checkout data in localStorage
    localStorage.removeItem("pickupDate");
    localStorage.removeItem("pickupTime");
    localStorage.removeItem("paymentMethod");
    localStorage.removeItem("gcashReference");
    localStorage.removeItem("pickupOption");
    localStorage.removeItem("status");

    if (!user) {
      console.log("No user found, redirecting to login...");
      setLoading(false);
      return;
    }

    console.log("Setting up Firebase listener for user:", user.uid);
    const cartRef = collection(db, "customers", user.uid, "cart");

    const unsubscribe = onSnapshot(
      cartRef,
      (querySnapshot) => {
        console.log("Firebase snapshot received");
        console.log("Snapshot size:", querySnapshot.size);

        const items: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Document ID:", doc.id);
          console.log("Document data:", JSON.stringify(data, null, 2));
          items.push({ ...data, id: doc.id });
        });

        console.log("Total items processed:", items.length);
        setCartItems(items);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Firebase listener error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      console.log("Cleaning up Firebase listener");
      unsubscribe();
    };
  }, [user]);

  // Calculate cart totals
  const subtotal = cartItems.reduce((total, item) => {
    console.log("Calculating total for item:", item);
    return total + (item.productPrice || 0);
  }, 0);
  const discountPercentage = 0;
  const discountAmount = (subtotal * discountPercentage) / 100;
  const total = subtotal - discountAmount;

  const updateQuantity = async (cartId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const cartRef = doc(db, "customers", currentUser.uid, "cart", cartId);

    try {
      const cartDoc = await getDoc(cartRef);
      if (!cartDoc.exists()) return;

      const cartData = cartDoc.data();

      // Ensure originalPrice is always the base price
      const originalPrice = cartData.originalPrice; // Do not use productPrice as a fallback

      if (!originalPrice) {
        console.error("Original price is missing in cart data.");
        return;
      }

      // Calculate updated price
      const updatedPrice =
        newQuantity === 1 ? originalPrice : originalPrice * newQuantity;

      await updateDoc(cartRef, {
        productQuantity: newQuantity,
        productPrice: updatedPrice,
      });

      console.log(
        `Updated cart item ${cartId}: quantity = ${newQuantity}, price = ${updatedPrice}`
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (cartId: string) => {
    try {
      if (!user) return;

      const cartRef = collection(db, "customers", user.uid, "cart");

      const q = query(cartRef, where("cartId", "==", cartId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(db, "customers", user.uid, "cart", docToDelete.id));
        console.log("Item successfully removed from cart in Firestore");
      }

      const itemElement = document.getElementById(`cart-item-${cartId}`);
      if (itemElement) {
        itemElement.classList.add("removing");
        setTimeout(() => {
          setCartItems(cartItems.filter((item) => item.cartId !== cartId));
        }, 300);
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
    }
  };

  const sortedCartItems = [...cartItems].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // badge color
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

  // badge initials
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

  // Add error display in the UI
  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="end">
              <IonRouterLink routerLink="/home" routerDirection="back">
                <IonButton>
                  <IonIcon icon={close}></IonIcon>
                </IonButton>
              </IonRouterLink>
            </IonButtons>
            <IonTitle>Cart</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="error-container">
            <IonText color="danger">
              <h2>Error loading cart</h2>
              <p>{error}</p>
            </IonText>
            <IonButton expand="block" onClick={() => window.location.reload()}>
              Retry
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton>
              <IonRouterLink routerLink="/home" routerDirection="back">
                <IonIcon className="close-btn" icon={close}></IonIcon>
              </IonRouterLink>
            </IonButton>
          </IonButtons>
          <IonTitle>Cart</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {loading ? (
          <div className="skeleton-container">
            <div className="skeleton-header">
              <div className="skeleton-title"></div>
              <div className="skeleton-subtitle"></div>
            </div>
            {[1, 2, 3].map((item) => (
              <div className="skeleton-item" key={item}>
                <div className="skeleton-badge"></div>
                <div className="skeleton-content">
                  <div className="skeleton-name"></div>
                  <div className="skeleton-info"></div>
                  <div className="skeleton-price-row">
                    <div className="skeleton-price"></div>
                    <div className="skeleton-quantity"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : cartItems.length === 0 ? (
          <div className="empty-notifications">
            <IonIcon icon={cartOutline} className="empty-icon" />
            <IonText className="empty-text">Your cart is Empty</IonText>
            <p className="empty-subtext">You haven't added any items yet.</p>
            <IonButton
              className="browse-button"
              expand="block"
              onClick={() => setShowBYOKModal(true)}
            >
              Add Items to Cart
              <IonIcon slot="end" icon={chevronForward} />
            </IonButton>
          </div>
        ) : (
          // <div className="empty-cart-container">
          //   <IonIcon icon={cart} className="empty-cart-icon" />
          //   <IonTitle>Your cart is empty</IonTitle>
          //   <IonText>Looks like you haven't added any items yet.</IonText>
          //   <IonButton expand="block" color="primary" routerLink="/home">
          //     Browse Products
          //     <IonIcon slot="end" icon={arrowForward} />
          //   </IonButton>
          // </div>
          <>
            <IonGrid>
              <IonRow>
                <IonCol>
                  {sortedCartItems.map((item) => {
                    console.log("Rendering cart item:", item);
                    return (
                      <IonItemSliding
                        key={item.id}
                        id={`cart-item-${item.cartId}`}
                      >
                        <IonItem
                          className="cart-product-item-container"
                          lines="full"
                        >
                          <div className="cart-badge-container">
                            <IonBadge
                              className="cart-size-badge"
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

                          <div className="cart-content-container">
                            <div className="cart-bottom-row">
                              <div className="product-name-container">
                                <IonText className="cart-name-text">
                                  {typeof item.productSize === "object"
                                    ? item.productSize.name
                                    : item.productSize || "Unknown Size"}
                                </IonText>
                              </div>
                              <IonButton
                                className="cart-delete-icon"
                                fill="clear"
                                onClick={() => removeItem(item.id)}
                              >
                                <IonIcon icon={trashSharp} color="danger" />
                              </IonButton>
                            </div>

                            <div className="cart-size-container">
                              <div className="cart-varieties-container">
                                {Array.isArray(item.productVarieties) &&
                                  item.productVarieties.length > 0 && (
                                    <div className="cart-varieties-text">
                                      <IonText>
                                        {item.productVarieties.join(", ")}
                                      </IonText>
                                    </div>
                                  )}
                              </div>

                              <div className="price-quantity-container">
                                <IonText className="cart-price-text">
                                  ₱{item.productPrice.toLocaleString()}
                                </IonText>
                                <div className="cart-quantity-control">
                                  <IonButton
                                    className="byok-quantity-button"
                                    fill="clear"
                                    size="small"
                                    onClick={() =>
                                      updateQuantity(
                                        item.id,
                                        (item.productQuantity || 1) - 1
                                      )
                                    }
                                  >
                                    <IonIcon icon={removeCircle} />
                                  </IonButton>
                                  <IonInput
                                    type="number"
                                    value={item.productQuantity || 1}
                                    min={1}
                                    max={99}
                                    onIonChange={(e) => {
                                      const value = parseInt(
                                        e.detail.value!,
                                        10
                                      );
                                      if (!isNaN(value) && value > 0) {
                                        // Update the quantity in Firestore
                                        updateQuantity(item.id, value);
                                      }
                                    }}
                                    className="quantity-input"
                                  />
                                  <IonButton
                                    className="byok-quantity-button"
                                    fill="clear"
                                    size="small"
                                    onClick={() =>
                                      updateQuantity(
                                        item.id,
                                        (item.productQuantity || 1) + 1
                                      )
                                    }
                                  >
                                    <IonIcon icon={addCircle} />
                                  </IonButton>
                                </div>
                              </div>
                            </div>
                          </div>
                        </IonItem>

                        <IonItemOptions side="end">
                          <IonItemOption
                            className="cart-delete-button"
                            onClick={() => removeItem(item.id)}
                          >
                            <IonIcon slot="icon-only" icon={trash} />
                          </IonItemOption>
                        </IonItemOptions>
                      </IonItemSliding>
                    );
                  })}
                </IonCol>
              </IonRow>
            </IonGrid>
          </>
        )}
      </IonContent>

      {cartItems.length > 0 && (
        <IonFooter>
          <IonToolbar className="product-footer">
            <div className="footer-content">
              <div className="total-container">
                <IonLabel className="total-label">Total: </IonLabel>
                <IonText className="total-price-text">
                  ₱{total.toLocaleString()}
                </IonText>
              </div>
              <div className="footer-action-button-container">
                <Link to="/home/cart/schedule" className="checkout-button-link">
                  <IonButton className="footer-action-button schedule-button">
                    Checkout
                    <IonIcon slot="start" icon={bag} />
                    <IonIcon slot="end" icon={chevronForward} />
                  </IonButton>
                </Link>
              </div>
            </div>
          </IonToolbar>
        </IonFooter>
      )}

      {/* Build Your Own Kakanin Modal */}
      <BuildYourOwnModal
        isOpen={showBYOKModal}
        onClose={() => setShowBYOKModal(false)}
        showToastMessage={handleShowToastMessage}
      />
    </IonPage>
  );
};

export default Cart;
