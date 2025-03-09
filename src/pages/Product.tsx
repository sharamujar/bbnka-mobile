import { IonBackButton, IonButtons, IonContent, IonHeader, IonImg, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React, { useEffect } from 'react'
import { useHistory, useLocation } from 'react-router'

const Products: React.FC = () => {
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (!location.state) {
      history.replace('/home');
    }
  }, [location.state, history]);

  // checks if the product details is available
  if (!location.state) {
    return (
      <IonPage>
        <IonContent fullscreen>
          <div>Loading product details...</div>
        </IonContent>
      </IonPage>
    );
  }
  
  const { productDetails } = location.state as any;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
            <IonButtons>
              <IonBackButton></IonBackButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div>
            <IonImg src={productDetails.imageURL} />
            <h1>{productDetails.name}</h1>
            <p>{productDetails.description}</p>
            <p>Stock: {productDetails.stock}</p>
            <p>Unit: {productDetails.unit}</p>
            <p>₱{productDetails.price}</p>
          </div>
        </IonContent>
    </IonPage>
  )
}

export default Products