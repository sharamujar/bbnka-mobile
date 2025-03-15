import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import React from 'react'

function Orders() {
  return (
    <IonPage>
        <IonContent fullscreen>
          <IonHeader>
            <IonToolbar>
              <IonTitle className='title-toolbar'>Orders</IonTitle>
            </IonToolbar>
          </IonHeader>
        </IonContent>
    </IonPage>
  )
}

export default Orders