import {
  IonBackButton,
  IonButtons,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonPage,
  IonRadio,
  IonRadioGroup,
  IonText,
  IonThumbnail,
  IonTitle,
  IonToolbar,
  IonFooter,
  IonRow,
  IonCol,
} from "@ionic/react";
import {
  cardOutline,
  checkmarkCircle,
  createOutline,
  helpCircleOutline,
  lockClosed,
} from "ionicons/icons";
import React, { useState } from "react";
import axios from "axios";
import "./Payment.css";

const Payment: React.FC = () => {
  const [paymentMethod, setPaymentMethod] = useState("gcash");

  const handlePayment = async () => {
    if (paymentMethod === "gcash") {
      await handleGCashPayment();
    } else if (paymentMethod === "maya") {
      await handleMayaPayment();
    } else {
      console.log("Cash on Delivery selected");
    }
  };

  const handleGCashPayment = async () => {
    try {
      // Replace with your GCash API endpoint and payload
      const response = await axios.post("GCASH_API_ENDPOINT", {
        // Include necessary payment details
      });
      console.log("GCash Payment Successful:", response.data);
    } catch (error) {
      console.error("GCash Payment Error:", error);
    }
  };

  const handleMayaPayment = async () => {
    try {
      // Replace with your Maya API endpoint and payload
      const response = await axios.post("MAYA_API_ENDPOINT", {
        // Include necessary payment details
      });
      console.log("Maya Payment Successful:", response.data);
    } catch (error) {
      console.error("Maya Payment Error:", error);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonHeader>
          <IonToolbar>
            <IonTitle className="title-toolbar">Payment</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Payment Methods */}
        <IonCard>
          <IonCardContent>
            <IonRadioGroup
              value={paymentMethod}
              onIonChange={(e) => setPaymentMethod(e.detail.value)}
            >
              {/* Cash on Delivery Option */}
              <IonItem className="payment-method-item">
                <IonLabel>
                  <h2>Cash</h2>
                  <p>Pay when you receive your items</p>
                </IonLabel>
                <IonRadio slot="start" value="cod" />
                <IonThumbnail slot="end" className="payment-icon">
                  <IonImg src="assets/icons/cash-icon.svg" alt="Cash" />
                </IonThumbnail>
              </IonItem>

              {/* GCash Option */}
              <IonItem className="payment-method-item">
                <IonLabel>
                  <h2>GCash</h2>
                  <p>Pay using your GCash wallet</p>
                </IonLabel>
                <IonRadio slot="start" value="gcash" />
                <IonThumbnail slot="end" className="payment-icon">
                  <IonImg src="assets/icons/gcash-icon.svg" alt="GCash" />
                </IonThumbnail>
              </IonItem>
            </IonRadioGroup>
          </IonCardContent>
        </IonCard>
      </IonContent>

      {/* Footer with Payment Button */}
      <IonFooter>
        <IonToolbar className="product-footer">
          <div className="footer-content">
            <div className="action-button-container">
              <IonButton
                className="action-button pay-button"
                onClick={handlePayment}
              >
                <IonIcon icon={lockClosed} slot="start" />
                Review
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default Payment;
