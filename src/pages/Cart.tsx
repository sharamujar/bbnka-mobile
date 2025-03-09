import { IonContent, IonImg, IonItem, IonList, IonPage } from '@ionic/react'
import React, { useEffect, useState } from 'react'
import { auth, db } from '../firebase-config'
import { collection, getDocs, onSnapshot } from 'firebase/firestore';

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
      <IonContent fullscreen>
        <h1>Cart</h1>
          {loading ? (
            <p>Loading...</p>
          ) : cartItems.length === 0 ? (
            <p>No items in your cart.</p>
          ) : (
            <ul>
              {cartItems.map((item, index) => (
                <IonList key={index}>
                  <IonItem>
                    <IonImg src={item.imageURL} />
                    <h3>{item.name}</h3>
                    <p>Stock: {item.stock}</p>
                    <p>Unit: {item.unit}</p>
                    <p>Price: {item.price}</p>
                  </IonItem>
                </IonList>
              ))}
            </ul>
          )}
      </IonContent>
    </IonPage>
  )
}

export default Cart