import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonRadioGroup,
  IonItem,
  IonLabel,
  IonRadio,
  IonThumbnail,
  IonImg,
  IonFooter,
  IonButton,
  IonIcon,
  IonModal,
  IonButtons,
  IonBackButton,
  IonText,
  IonInput,
  IonToast,
  IonLoading,
  IonCardTitle,
  IonCardSubtitle,
  IonList,
  IonListHeader,
  IonCardHeader,
} from "@ionic/react";
import { useHistory } from "react-router";
import {
  chevronBackCircleOutline,
  documentTextSharp,
  chevronForwardCircle,
  closeCircle,
  checkmarkCircle,
  copyOutline,
} from "ionicons/icons";
import CheckoutStepProgress from "../components/CheckoutStepProgress";
import "./Payment.css";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase-config";

const Payment: React.FC = () => {
  const history = useHistory();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showGcashModal, setShowGcashModal] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isValidReference, setIsValidReference] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validate GCash reference number (basic validation)
  useEffect(() => {
    // GCash reference numbers are typically 13 digits
    const isValid = /^\d{13}$/.test(referenceNumber.trim());
    setIsValidReference(isValid);
  }, [referenceNumber]);

  // Function to handle card click
  const handleCardClick = (value: any) => {
    setPaymentMethod(value);
    localStorage.setItem("paymentMethod", value);
  };

  const nextStep = () => {
    if (paymentMethod === "gcash" && !isValidReference) {
      setToastMessage("Please complete GCash payment first");
      setShowToast(true);
      return;
    }

    if (currentStep < 2) {
      setCurrentStep((prevStep) => prevStep + 1);
      history.replace("/home/cart/schedule/payment/review");
    }
  };
  const handlePayment = () => {
    if (paymentMethod === "gcash") {
      setShowGcashModal(true);
    } else {
      // For cash, proceed directly to review
      nextStep();
    }
  };

  const handleGcashSubmit = async () => {
    if (!isValidReference) {
      setToastMessage("Please enter a valid reference number");
      setShowToast(true);
      return;
    }

    setIsLoading(true);

    try {
      const paymentsRef = collection(db, "payments");

      // Save the reference number in Firestore for admin review
      await addDoc(paymentsRef, {
        referenceNumber: referenceNumber,
        status: "pending", // Admin will verify this later
        timestamp: serverTimestamp(),
      });

      setIsLoading(false);
      setShowGcashModal(false);
      setToastMessage("Payment submitted! Awaiting admin verification.");
      setShowToast(true);

      // Store in local storage
      localStorage.setItem("gcashReference", referenceNumber);
      localStorage.setItem("paymentMethod", "gcash");

      // Navigate to review step after a short delay
      setTimeout(() => {
        history.replace("/home/cart/schedule/payment/review");
      }, 1500); // 1.5 second delay to show the success message
    } catch (error) {
      setIsLoading(false);
      setToastMessage("Failed to submit payment. Try again.");
      setShowToast(true);
    }
  };

  const copyReferenceNumber = (dummyNumber: string) => {
    navigator.clipboard.writeText(dummyNumber);
    setToastMessage("Reference number copied to clipboard");
    setShowToast(true);
  };

  const closeGcashModal = () => {
    setReferenceNumber(""); // Reset input when closing
    setShowGcashModal(false);
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

        {/* Payment Methods Section */}
        <div className="payment-container">
          <IonListHeader className="section-title">
            <IonLabel>Select Payment Method</IonLabel>
          </IonListHeader>

          <IonRadioGroup
            value={paymentMethod}
            onIonChange={(e) => setPaymentMethod(e.detail.value)}
          >
            <IonCard
              className={`payment-methods-card clickable-card ${
                paymentMethod === "cash" ? "selected" : ""
              }`}
              onClick={() => handleCardClick("cash")}
            >
              <IonCardContent>
                <IonItem className="payment-method-item" lines="none" button>
                  <IonLabel>
                    <IonText>
                      <strong>Cash</strong>
                    </IonText>
                    <IonText color="medium">
                      <small>Pay when you pick up your items</small>
                    </IonText>
                  </IonLabel>
                  <IonRadio slot="start" value="cash" />
                  <IonThumbnail slot="end" className="payment-icon">
                    <IonImg src="assets/icons/cash-icon.svg" alt="Cash" />
                  </IonThumbnail>
                </IonItem>
              </IonCardContent>
            </IonCard>

            <IonCard
              className={`payment-methods-card clickable-card ${
                paymentMethod === "gcash" ? "selected" : ""
              }`}
              onClick={() => handleCardClick("gcash")}
            >
              <IonCardContent>
                <IonItem className="payment-method-item" lines="none" button>
                  <IonLabel>
                    <IonText>
                      <strong>GCash</strong>
                    </IonText>
                    <IonText color="medium">
                      <small>Pay using your GCash wallet</small>
                    </IonText>
                  </IonLabel>
                  <IonRadio slot="start" value="gcash" />
                  <IonThumbnail slot="end" className="payment-icon">
                    <IonImg src="assets/icons/gcash-icon.svg" alt="GCash" />
                  </IonThumbnail>
                </IonItem>
              </IonCardContent>
            </IonCard>
          </IonRadioGroup>

          {/* Payment Instructions */}
          <div className="payment-instructions">
            {paymentMethod === "cash" ? (
              <IonCard className="instruction-card">
                <IonCardHeader>
                  <IonCardTitle>Cash Payment Instructions</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText color="medium">
                    Please prepare the exact amount when you pick up your order.
                    Our staff will verify your payment.
                  </IonText>
                </IonCardContent>
              </IonCard>
            ) : (
              <IonCard className="instruction-card">
                <IonCardHeader>
                  <IonCardTitle>GCash Payment Instructions</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList lines="none">
                    <IonItem>
                      <IonText color="medium">
                        1. Click "Pay with GCash" to see our QR code
                      </IonText>
                    </IonItem>
                    <IonItem>
                      <IonText color="medium">
                        2. Scan the QR code with your GCash app
                      </IonText>
                    </IonItem>
                    <IonItem>
                      <IonText color="medium">
                        3. Enter the reference number after payment
                      </IonText>
                    </IonItem>
                  </IonList>
                  <IonButton
                    expand="block"
                    className="gcash-button"
                    onClick={() => setShowGcashModal(true)}
                  >
                    Pay with GCash
                  </IonButton>
                </IonCardContent>
              </IonCard>
            )}
          </div>
        </div>

        {/* GCash Payment Modal */}
        <IonModal
          isOpen={showGcashModal}
          onDidDismiss={() => setShowGcashModal(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={closeGcashModal}>
                  <IonIcon icon={closeCircle} />
                </IonButton>
              </IonButtons>
              <IonTitle>GCash Payment</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="gcash-modal-content">
              <IonText className="ion-text-center">
                <IonCardTitle>Scan QR Code to Pay</IonCardTitle>
              </IonText>

              {/* QR Code Placeholder - Replace with actual client QR code */}
              <div className="qr-container">
                <img
                  src="assets/images/gcash-qr-placeholder.png"
                  alt="GCash QR Code"
                  className="gcash-qr"
                />
              </div>

              <IonCard className="account-details">
                <IonCardHeader>
                  <IonCardSubtitle>Account Details</IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList lines="none">
                    <IonItem>
                      <IonLabel>
                        <IonText>
                          <strong>Name:</strong> Business Name
                        </IonText>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <IonText>
                          <strong>Account Number:</strong> 09123456789
                        </IonText>
                      </IonLabel>
                      <IonIcon
                        slot="end"
                        icon={copyOutline}
                        className="copy-icon"
                        onClick={() => copyReferenceNumber("09123456789")}
                      />
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>

              <div className="reference-input">
                <IonLabel
                  position="stacked"
                  color={isValidReference ? "success" : "danger"}
                >
                  Enter GCash Reference Number
                  {isValidReference && (
                    <IonIcon icon={checkmarkCircle} color="success" />
                  )}
                </IonLabel>
                <IonInput
                  value={referenceNumber}
                  onIonChange={(e) => setReferenceNumber(e.detail.value || "")}
                  placeholder="e.g., 1234567890123"
                  className={isValidReference ? "valid-reference" : ""}
                />
                <IonText color="medium" className="hint-text">
                  Enter the 13-digit reference number from your GCash receipt
                </IonText>
              </div>

              <IonButton
                expand="block"
                onClick={handleGcashSubmit}
                disabled={!isValidReference}
                className="verify-button"
              >
                Verify Payment
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>

      {/* Loading indicator */}
      <IonLoading
        isOpen={isLoading}
        message="Verifying payment..."
        duration={3000}
      />

      {/* Toast notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
        color={toastMessage.includes("successful") ? "success" : "primary"}
      />

      <IonFooter>
        <IonToolbar className="product-footer">
          <div className="footer-content">
            <div className="footer-back-action-button-container">
              {/* Back to Schedule Button */}
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
                onClick={handlePayment}
                disabled={paymentMethod === "gcash" && !isValidReference} // Disable if GCash & ref is invalid
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
