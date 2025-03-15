import { IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonContent, IonFooter, IonGrid, IonHeader, IonIcon, IonImg, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonPage, IonRow, IonText, IonThumbnail, IonTitle, IonToolbar } from '@ionic/react'
import React, { useEffect, useState } from 'react'
import { auth, db } from '../firebase-config'
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { add, arrowForward, cart, remove, trash } from 'ionicons/icons';

const Cart: React.FC = () => {
  const user = auth.currentUser;

  // state to store cart items and loading state
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // fetch cart items from Firestore
  useEffect(() => {
      if (!user) {
        console.log("User is not logged in...");
        setLoading(false); // end loading when no user
        return;
      }

      // Reference to the user's cart subcollection
      const cartRef = collection(db, "customers", user.uid, "cart");

      // Set up real-time listener to fetch cart items
      const unsubscribe = onSnapshot(cartRef, (querySnapshot) => {
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data()); // Fetch the product details
      });

      setCartItems(items); // Update state with fetched cart items
      setLoading(false); // Stop loading after fetching
    });

    // Clean up listener when the component unmounts
    return () => unsubscribe();
  }, [user]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className='title-toolbar'>Cart</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        {cartItems.length === 0 ? (
          <div className="empty-cart-container">
            <IonIcon icon={cart} className="empty-cart-icon" />
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any items yet.</p>
            <IonButton expand="block" color="primary">
              Start Shopping
            </IonButton>
          </div>
        ) : (
          <>
            <IonList>
              {cartItems.map(item => (
                <IonItemSliding key={item.id}>
                  <IonItem lines="full">
                    <IonThumbnail slot="start">
                      <IonImg src={item.imageURL} />
                    </IonThumbnail>
                    <IonLabel>
                      <h2>{item.name}</h2>
                      <p>{item.size}</p>
                      <p className="varieties-text"></p>
                      <p className="price-text">₱</p>
                    </IonLabel>
                    <div className="quantity-control">
                      <IonButton 
                        fill="clear" 
                        size="small"
                      >
                        <IonIcon icon={remove} />
                      </IonButton>
                      <IonBadge color="light" className="quantity-badge">
                        <IonText color="dark">{item.quantity}</IonText>
                      </IonBadge>
                      <IonButton 
                        fill="clear" 
                        size="small"
                      >
                        <IonIcon icon={add} />
                      </IonButton>
                    </div>
                  </IonItem>
                  
                  <IonItemOptions side="end">
                    <IonItemOption color="danger">
                      <IonIcon slot="icon-only" icon={trash} />
                    </IonItemOption>
                  </IonItemOptions>
                </IonItemSliding>
              ))}
            </IonList>
            
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Order Summary</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol>Subtotal</IonCol>
                    <IonCol className="ion-text-right">₱</IonCol>
                  </IonRow>
                  <IonRow>
                    <IonCol>Delivery Fee</IonCol>
                    <IonCol className="ion-text-right">₱</IonCol>
                  </IonRow>
                  <IonRow className="total-row">
                    <IonCol><strong>Total</strong></IonCol>
                    <IonCol className="ion-text-right"><strong>₱</strong></IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>
          </>
        )}
      </IonContent>
      
      {cartItems.length > 0 && (
        <IonFooter>
          <IonToolbar>
            <IonButton expand="block" className="checkout-button">
              Proceed to Checkout
              <IonIcon slot="end" icon={arrowForward} />
            </IonButton>
          </IonToolbar>
        </IonFooter>
      )}
    </IonPage>
  )
}

export default Cart