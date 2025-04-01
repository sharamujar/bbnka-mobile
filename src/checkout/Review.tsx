import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import React, { useState } from "react";
import CheckoutStepProgress from "../components/CheckoutStepProgress";
import { useHistory } from "react-router";
import {
  arrowBackCircleSharp,
  checkmarkCircleSharp,
  chevronBackCircleOutline,
  chevronForwardCircle,
} from "ionicons/icons";

const Review: React.FC = () => {
  const history = useHistory();

  const [currentStep, setCurrentStep] = useState(2);

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep((prevStep) => prevStep + 1);
      const routes = [
        "/home/cart/schedule/payment",
        "/home/cart/schedule/payment/review",
      ];
      history.replace(routes[currentStep + 1]);
    }
  };
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="title-toolbar">Review</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <CheckoutStepProgress currentStep={currentStep} />
      </IonContent>

      <IonFooter>
        <IonToolbar className="product-footer">
          <div className="footer-content">
            <div className="footer-back-action-button-container">
              {/* Back to Cart Button */}
              <IonButton
                className="footer-back-action-button"
                routerLink="/home/cart/schedule/payment"
                fill="outline"
              >
                <IonIcon icon={chevronBackCircleOutline} slot="start" />
                Back to Payment
              </IonButton>
            </div>
            <div className="footer-action-button-container">
              {/* Payment Button */}
              <IonButton
                className="footer-action-button"
                onClick={nextStep}
                routerLink="/home/cart/schedule/payment/review"
              >
                <IonIcon icon={checkmarkCircleSharp} slot="start" />
                <IonIcon icon={chevronForwardCircle} slot="end" />
                Confirm
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default Review;
