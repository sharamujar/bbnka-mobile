import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import React from 'react'

function Notifications() {
  return (
    <IonPage>
        <IonContent fullscreen>
          <IonHeader>
            <IonToolbar>
              <IonTitle className='title-toolbar'>Notifications</IonTitle>
            </IonToolbar>
          </IonHeader>
        </IonContent>
    </IonPage>
  )
}

export default Notifications