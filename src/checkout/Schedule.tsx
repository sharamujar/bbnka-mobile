import {
  IonBackButton,
  IonButtons,
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonLabel,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  IonIcon,
} from "@ionic/react";
import { cardOutline, timeOutline } from "ionicons/icons";
import React from "react";
import { Link } from "react-router-dom";

function Schedule() {
  return (
    <IonPage>
      <IonContent fullscreen>
        <IonHeader>
          <IonToolbar>
            <IonTitle className="title-toolbar">Schedule</IonTitle>
          </IonToolbar>
        </IonHeader>
      </IonContent>

      <IonFooter>
        <IonToolbar className="product-footer">
          <div className="footer-content">
            <div className="action-button-container">
              <Link
                to="/home/cart/schedule/payment"
                className="checkout-button-Link"
              >
                <IonButton className="action-button payment-button">
                  Payment
                  <IonIcon slot="start" icon={cardOutline} />
                </IonButton>
              </Link>
            </div>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
}

export default Schedule;
