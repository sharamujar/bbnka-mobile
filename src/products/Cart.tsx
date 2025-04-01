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

const Cart: React.FC = () => {
  const user = auth.currentUser;
  const history = useHistory(); //for navigation

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!user) {
      console.log("User is not logged in...");
      setLoading(false);
      return;
    }

    // Reference to the user's cart subcollection
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
  }, [user]);

  // Calculate cart totals
  const subtotal = cartItems.reduce(
    (total, item) => total + item.productPrice,
    0
  );
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
  const getSizeColor = (sizeName: string) => {
    let hash = 0;
    for (let i = 0; i < sizeName.length; i++) {
      hash = sizeName.charCodeAt(i) + ((hash << 5) - hash); // More bit shifts for distribution
    }

    // Use prime numbers to distribute hue more evenly
    const hue = ((Math.abs(hash * 47) % 360) + 360) % 360;

    // More balanced contrast in saturation and lightness
    const saturation = 55 + (Math.abs(hash * 29) % 35); // Between 55% and 90%
    const lightness = 35 + (Math.abs(hash * 17) % 30); // Between 35% and 65%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // badge initials
  const getSizeAbbreviation = (sizeName: string): string => {
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
          <IonButtons slot="end">
            <IonRouterLink routerLink="/home" routerDirection="back">
              <IonButton>
                <IonIcon icon={close}></IonIcon>
              </IonButton>
            </IonRouterLink>
          </IonButtons>
          <IonTitle className="title-toolbar">Cart</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {cartItems.length === 0 ? (
          <div className="empty-cart-container">
            <IonTitle>Your cart is empty</IonTitle>
            <IonText>Looks like you haven't added any items yet.</IonText>
            <IonButton expand="block" color="primary">
              Start Shopping
            </IonButton>
          </div>
        ) : (
          <>
            <IonGrid>
              <IonRow>
                <IonCol>
                  {sortedCartItems.map((item) => (
                    <IonItemSliding
                      key={item.id}
                      id={`cart-item-${item.cartId}`}
                    >
                      <IonItem
                        className="cart-product-item-container"
                        lines="full"
                      >
                        {/* <div className="cart-image-container" slot="start">
                          <IonThumbnail className="cart-product-thumbnail">
                            <IonImg
                              className="cart-product-img"
                              src={item.productImg}
                            />
                          </IonThumbnail>
                        </div> */}
                        <div className="cart-badge-container">
                          <IonBadge
                            className="size-badge"
                            style={{
                              backgroundColor: getSizeColor(
                                item.productSize.name
                              ),
                            }}
                          >
                            {getSizeAbbreviation(item.productSize.name)}
                          </IonBadge>
                        </div>

                        <div className="cart-content-container">
                          <div className="cart-bottom-row">
                            <div className="product-name-container">
                              <IonText className="cart-name-text">
                                {item.productSize.name}
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
                            {/* Display size name from new structure */}
                            {/* <IonText className="cart-size-text">
                              {item.productSize && item.productSize.name
                                ? `${item.productSize.name}`
                                : ""}
                            </IonText> */}

                            <div className="cart-varieties-container">
                              {/* Display variety names from new field */}
                              {Array.isArray(item.productVarietiesNames) &&
                                item.productVarietiesNames.length > 0 && (
                                  <div className="cart-varieties-text">
                                    <IonText>
                                      {item.productVarietiesNames.join(", ")}
                                    </IonText>
                                  </div>
                                )}
                            </div>

                            <div className="price-quantity-container">
                              <IonText className="cart-price-text">
                                ₱{item.productPrice}
                              </IonText>
                              <div className="cart-quantity-control">
                                <IonButton
                                  className="byok-quantity-button"
                                  fill="clear"
                                  size="small"
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.productQuantity - 1
                                    )
                                  }
                                >
                                  <IonIcon icon={removeCircle} />
                                </IonButton>
                                {/* <IonBadge className="cart-quantity-badge">
                                  <IonText color="dark">
                                    {item.productQuantity}
                                  </IonText>
                                </IonBadge> */}
                                <IonInput
                                  type="number"
                                  value={item.productQuantity}
                                  min={1}
                                  max={99}
                                  onIonChange={(e) => {
                                    const value = parseInt(e.detail.value!, 10);
                                    if (!isNaN(value) && value > 0) {
                                      setQuantity(value);
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
                                      item.productQuantity + 1
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
                  ))}
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
                    <IonIcon slot="end" icon={chevronForwardCircle} />
                  </IonButton>
                </Link>
              </div>
            </div>
          </IonToolbar>
        </IonFooter>
      )}
    </IonPage>
  );
};

export default Cart;
