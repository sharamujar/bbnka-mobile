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
  arrowBackCircle,
  arrowBackCircleSharp,
  cardOutline,
  checkmarkCircle,
  checkmarkCircleSharp,
  checkmarkDoneCircleSharp,
  chevronBackCircle,
  chevronBackCircleOutline,
  chevronForwardCircle,
  createOutline,
  documentTextSharp,
  helpCircleOutline,
  lockClosed,
} from "ionicons/icons";
import React, { useState } from "react";
import axios from "axios";
import "./Payment.css";
import CheckoutStepProgress from "../components/CheckoutStepProgress";
import { useHistory } from "react-router";

const Payment: React.FC = () => {
  const history = useHistory();

  const [paymentMethod, setPaymentMethod] = useState("cash");

  // const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    "/home/cart/schedule",
    "/home/cart/schedule/payment",
    "/home/cart/schedule/payment/review",
  ];

  const [currentStep, setCurrentStep] = useState(
    steps.indexOf(history.location.pathname)
  );

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextRoute = steps[currentStep + 1];
      setCurrentStep(currentStep + 1);
      history.replace(nextRoute);
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === "gcash") {
      console.log("Gcash selected");
    } else {
      console.log("Cash selected");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="title-toolbar">Payment</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <CheckoutStepProgress currentStep={currentStep} />
        {/* Payment Methods */}
        <IonCard>
          <IonCardContent>
            <IonRadioGroup
              value={paymentMethod}
              onIonChange={(e) => setPaymentMethod(e.detail.value)}
            >
              {/* Cash Option */}
              <IonItem className="payment-method-item">
                <IonLabel>
                  <h2>Cash</h2>
                  <p>Pay when you receive your items</p>
                </IonLabel>
                <IonRadio slot="start" value="cash" />
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

      <IonFooter>
        <IonToolbar className="product-footer">
          <div className="footer-content">
            <div className="footer-back-action-button-container">
              {/* Back to Cart Button */}
              <IonButton
                className="footer-back-action-button"
                routerLink="/home/cart/schedule"
                fill="outline"
              >
                <IonIcon icon={chevronBackCircleOutline} slot="start" />
                Back to Schedule
              </IonButton>
            </div>
            <div className="footer-action-button-container">
              {/* Payment Button */}
              <IonButton
                className="footer-action-button"
                onClick={nextStep}
                routerLink="/home/cart/schedule/payment/review"
              >
                <IonIcon icon={documentTextSharp} slot="start" />
                <IonIcon icon={chevronForwardCircle} slot="end" />
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
