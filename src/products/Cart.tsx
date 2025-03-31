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
} from "ionicons/icons";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import "./Cart.css";

const Cart: React.FC = () => {
  const user = auth.currentUser;
  const history = useHistory(); //for navigation

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    (total, item) => total + item.productPrice * item.productQuantity,
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
      await updateDoc(cartRef, { productQuantity: newQuantity });

      setCartItems((prevCart) =>
        prevCart.map((item) =>
          item.id === cartId ? { ...item, productQuantity: newQuantity } : item
        )
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
                        <div className="cart-image-container" slot="start">
                          <IonThumbnail className="cart-product-thumbnail">
                            <IonImg
                              className="cart-product-img"
                              src={item.productImg}
                            />
                          </IonThumbnail>
                        </div>

                        <div className="cart-content-container">
                          <div className="cart-bottom-row">
                            <div className="product-name-container">
                              <IonText className="cart-name-text">
                                {item.productName}
                              </IonText>
                            </div>
                          </div>

                          <div className="cart-size-container">
                            <IonText className="cart-size-text">
                              {item.productSize && item.productSize.name
                                ? ` ${item.productSize.name}`
                                : ""}
                            </IonText>

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
                                ₱{item.productPrice}
                              </IonText>
                              <div className="cart-quantity-control">
                                <IonButton
                                  className="cart-quantity-button"
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
                                <IonBadge className="cart-quantity-badge">
                                  <IonText color="dark">
                                    {item.productQuantity}
                                  </IonText>
                                </IonBadge>
                                <IonButton
                                  className="cart-quantity-button"
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
