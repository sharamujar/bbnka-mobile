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
  IonSpinner,
} from "@ionic/react";
import { useHistory } from "react-router";
import {
  chevronBackCircleOutline,
  documentTextSharp,
  chevronForwardCircle,
  closeCircle,
  checkmarkCircle,
  copyOutline,
  cardOutline,
  close,
  copy,
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

// Custom GCash Icon component
const GCashIcon: React.FC = () => (
  <svg
    viewBox="0 0 192 192"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    width="24"
    height="24"
    style={{ color: "#bf5906" }}
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="12"
      d="M84 96h36c0 19.882-16.118 36-36 36s-36-16.118-36-36 16.118-36 36-36c9.941 0 18.941 4.03 25.456 10.544"
    />
    <path
      fill="currentColor"
      d="M145.315 66.564a6 6 0 0 0-10.815 5.2l10.815-5.2ZM134.5 120.235a6 6 0 0 0 10.815 5.201l-10.815-5.201Zm-16.26-68.552a6 6 0 1 0 7.344-9.49l-7.344 9.49Zm7.344 98.124a6 6 0 0 0-7.344-9.49l7.344 9.49ZM84 152c-30.928 0-56-25.072-56-56H16c0 37.555 30.445 68 68 68v-12ZM28 96c0-30.928 25.072-56 56-56V28c-37.555 0-68 30.445-68 68h12Zm106.5-24.235C138.023 79.09 140 87.306 140 96h12c0-10.532-2.399-20.522-6.685-29.436l-10.815 5.2ZM140 96c0 8.694-1.977 16.909-5.5 24.235l10.815 5.201C149.601 116.522 152 106.532 152 96h-12ZM84 40c12.903 0 24.772 4.357 34.24 11.683l7.344-9.49A67.733 67.733 0 0 0 84 28v12Zm34.24 100.317C108.772 147.643 96.903 152 84 152v12a67.733 67.733 0 0 0 41.584-14.193l-7.344-9.49Z"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="12"
      d="M161.549 58.776C166.965 70.04 170 82.666 170 96c0 13.334-3.035 25.96-8.451 37.223"
    />
  </svg>
);

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
  const [pickupOption, setPickupOption] = useState<"now" | "later">("later");
  const [referenceError, setReferenceError] = useState("");
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationResult, setVerificationResult] = useState<
    "success" | "error" | null
  >(null);

  // Validate GCash reference number (basic validation)
  useEffect(() => {
    if (referenceNumber.trim() === "") {
      setIsValidReference(false);
      setReferenceError("");
      return;
    }

    // Check if input contains only digits
    if (!/^\d+$/.test(referenceNumber.trim())) {
      setIsValidReference(false);
      setReferenceError("Reference number should contain only digits");
      return;
    }

    // Check length
    const refLength = referenceNumber.trim().length;
    if (refLength < 9) {
      setIsValidReference(false);
      setReferenceError(
        `Reference number is too short (${refLength}/9 digits)`
      );
      return;
    }

    if (refLength > 9) {
      setIsValidReference(false);
      setReferenceError(`Reference number is too long (${refLength}/9 digits)`);
      return;
    }

    // If all checks pass
    setIsValidReference(true);
    setReferenceError("");

    // Force button state update
    const verifyButton = document.querySelector(
      ".verify-button"
    ) as HTMLIonButtonElement;
    if (verifyButton) {
      verifyButton.disabled = false;
    }
  }, [referenceNumber]);

  // Get pickup option from localStorage
  useEffect(() => {
    const savedPickupOption = localStorage.getItem("pickupOption");
    if (savedPickupOption) {
      setPickupOption(savedPickupOption as "now" | "later");
    }
  }, []);

  const handleCardClick = (value: any) => {
    setPaymentMethod(value);
    localStorage.setItem("paymentMethod", value);

    // If GCash is selected, clear any previous reference
    if (value === "gcash") {
      setReferenceNumber("");
      setIsValidReference(false);
      localStorage.removeItem("gcashReference");
    }

    // Update order status based on payment method and pickup option
    updateOrderStatus(value, pickupOption);
  };

  const updateOrderStatus = (
    paymentMethod: string,
    pickupOption: "now" | "later"
  ) => {
    let orderStatus = "scheduled"; // Default status is "Order Placed"

    if (paymentMethod === "gcash") {
      // For GCash payments, status is always "awaiting_payment_verification"
      orderStatus = "awaiting_payment_verification";
    } else {
      // For cash payments, always use "scheduled" (Order Placed) initially
      orderStatus = "scheduled";
    }

    localStorage.setItem("status", orderStatus);
  };

  const handlePayment = () => {
    // Save the current payment method before proceeding
    localStorage.setItem("paymentMethod", paymentMethod);

    // Update order status
    updateOrderStatus(paymentMethod, pickupOption);

    // For GCash, we need a valid reference number
    if (paymentMethod === "gcash") {
      const savedReference = localStorage.getItem("gcashReference");

      // If no valid reference exists, show modal
      if (!savedReference) {
        setShowGcashModal(true);
        return;
      }
    }

    // If we have a valid payment method, proceed to review
    nextStep();
  };

  const nextStep = () => {
    // Force update payment method in localStorage again before navigation
    localStorage.setItem("paymentMethod", paymentMethod);

    if (currentStep < 2) {
      setCurrentStep((prevStep) => prevStep + 1);
      history.replace("/home/cart/schedule/payment/review");
    }
  };

  const handleGcashSubmit = async () => {
    if (!isValidReference) {
      setToastMessage("Please enter a valid reference number");
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    setVerificationComplete(false);
    setVerificationResult(null);

    try {
      // Simulate verification process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Store in local storage
      localStorage.setItem("gcashReference", referenceNumber);
      localStorage.setItem("paymentMethod", "gcash");

      // Update order status for GCash payment
      updateOrderStatus("gcash", pickupOption);

      setIsLoading(false);
      setVerificationResult("success");
      setVerificationComplete(true);

      // Enable the Review button immediately
      document
        .querySelector(".footer-action-button")
        ?.removeAttribute("disabled");

      // Update the state to reflect the change
      setPaymentMethod("gcash");

      // No longer automatically closing the modal
      // User will close it themselves with a button
    } catch (error) {
      setIsLoading(false);
      setVerificationResult("error");
      setVerificationComplete(true);
      setToastMessage("Payment verification failed. Please try again.");
      setShowToast(true);
    }
  };

  // Add useEffect to initialize payment method from localStorage
  useEffect(() => {
    const savedPaymentMethod = localStorage.getItem("paymentMethod");
    if (savedPaymentMethod) {
      setPaymentMethod(savedPaymentMethod);
    }
  }, []);

  // Add useEffect to handle back navigation
  useEffect(() => {
    const handleBackButton = () => {
      const currentPaymentMethod = localStorage.getItem("paymentMethod");
      if (currentPaymentMethod !== paymentMethod) {
        setPaymentMethod(currentPaymentMethod || "cash");
      }
    };

    window.addEventListener("popstate", handleBackButton);
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [paymentMethod]);

  // Add useEffect to sync payment method with localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "paymentMethod" && e.newValue !== paymentMethod) {
        setPaymentMethod(e.newValue || "cash");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [paymentMethod]);

  const copyReferenceNumber = (dummyNumber: string) => {
    navigator.clipboard.writeText(dummyNumber);
    setToastMessage("Reference number copied to clipboard");
    setShowToast(true);
  };

  const closeGcashModal = () => {
    setReferenceNumber(""); // Reset input when closing
    setIsValidReference(false);
    setReferenceError("");
    setVerificationComplete(false);
    setVerificationResult(null);
    setShowGcashModal(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Payment</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="checkout-progress-container">
          <CheckoutStepProgress currentStep={currentStep} />
        </div>

        {/* Payment Methods Section */}
        <div className="payment-container">
          <IonCard className="review-card">
            <IonCardHeader>
              <IonCardTitle>Payment Methods</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonRadioGroup
                value={paymentMethod}
                onIonChange={(e) => handleCardClick(e.detail.value)}
              >
                <IonCard
                  className={`payment-methods-card clickable-card ${
                    paymentMethod === "cash" ? "selected" : ""
                  }`}
                  onClick={() => handleCardClick("cash")}
                >
                  <IonCardContent>
                    <IonItem
                      className="payment-method-item"
                      lines="none"
                      button
                    >
                      <IonLabel>
                        <IonText>
                          <strong>Cash</strong>
                        </IonText>
                        <IonText color="medium">
                          <small>Pay when you pick up your items</small>
                        </IonText>
                      </IonLabel>
                      <IonRadio slot="end" value="cash" />
                      <IonIcon
                        icon={cardOutline}
                        slot="start"
                        className="payment-icon"
                      />
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
                    <IonItem
                      className="payment-method-item"
                      lines="none"
                      button
                    >
                      <IonLabel>
                        <IonText>
                          <strong>GCash</strong>
                        </IonText>
                        <IonText color="medium">
                          <small>Pay using your GCash wallet</small>
                        </IonText>
                      </IonLabel>
                      <IonRadio slot="end" value="gcash" />
                      <div slot="start" className="payment-icon">
                        <GCashIcon />
                      </div>
                    </IonItem>
                  </IonCardContent>
                </IonCard>
              </IonRadioGroup>
            </IonCardContent>
          </IonCard>

          {/* Payment Instructions */}
          <div className="payment-instructions">
            {paymentMethod === "cash" ? (
              <IonCard className="instruction-card">
                <IonCardHeader>
                  <IonCardTitle>Cash Payment Instructions</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText color="medium">
                    {pickupOption === "now"
                      ? "Please prepare the exact amount. You will pay at the store after your order is prepared."
                      : "Please prepare the exact amount when you pick up your order. Our staff will verify your payment."}
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
                      <IonText>
                        1. Click "Pay with GCash" to see our QR code
                      </IonText>
                    </IonItem>
                    <IonItem>
                      <IonText>2. Scan the QR code with your GCash app</IonText>
                    </IonItem>
                    <IonItem>
                      <IonText>3. Enter your payment reference number</IonText>
                    </IonItem>
                    <IonItem>
                      <IonText color="medium">
                        Note: Your order will be processed after our staff
                        verifies your payment
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
          className="gcash-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={closeGcashModal}>
                  <IonIcon className="close-btn" icon={close}></IonIcon>
                </IonButton>
              </IonButtons>
              <IonTitle>GCash Payment</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent fullscreen>
            <div className="gcash-modal-content">
              {verificationComplete ? (
                <div
                  className={`gcash-verification-result ${verificationResult}`}
                >
                  <div className="gcash-result-icon">
                    {verificationResult === "success" ? (
                      <IonIcon icon={checkmarkCircle} />
                    ) : (
                      <IonIcon icon={closeCircle} />
                    )}
                  </div>
                  <IonText className="gcash-reference-number-message">
                    {verificationResult === "success"
                      ? "Reference Number Submitted!"
                      : "Submission Failed"}
                  </IonText>
                  <p>
                    {verificationResult === "success"
                      ? "Your reference number has been submitted and is awaiting verification by our staff. Your order will be processed once payment is confirmed."
                      : "We couldn't process your reference number. Please check the number and try again."}
                  </p>
                  {verificationResult === "error" ? (
                    <IonButton
                      expand="block"
                      onClick={() => setVerificationComplete(false)}
                      className="try-again-button"
                    >
                      Try Again
                    </IonButton>
                  ) : (
                    <IonButton
                      expand="block"
                      onClick={() => {
                        // Close the modal
                        setShowGcashModal(false);

                        // Reset verification states for next time
                        setTimeout(() => {
                          setVerificationComplete(false);
                          setVerificationResult(null);
                        }, 300);

                        // Navigate to the order summary page
                        nextStep();
                      }}
                      className="continue-button"
                    >
                      View Order Summary
                    </IonButton>
                  )}
                </div>
              ) : (
                <>
                  <div className="qr-container">
                    <img
                      src="https://via.placeholder.com/200x200?text=GCash+QR+Code"
                      alt="GCash QR Code"
                      className="gcash-qr"
                    />
                    <IonText className="qr-instruction">
                      <p>Scan this QR code with your GCash app to pay</p>
                    </IonText>
                  </div>

                  <IonCard className="payment-account-details">
                    <IonCardHeader>
                      <IonCardTitle>Account Information</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonList lines="none">
                        <IonItem>
                          <IonLabel>
                            <IonText>
                              <strong>Account Name:</strong> Aling Kika's
                            </IonText>
                          </IonLabel>
                        </IonItem>
                        <IonItem>
                          <IonLabel>
                            <IonText>
                              <strong>Account Number:</strong> 09123456789
                            </IonText>
                          </IonLabel>
                          <IonButton
                            slot="end"
                            fill="clear"
                            size="small"
                            onClick={() => {
                              navigator.clipboard.writeText("09123456789");
                              setToastMessage(
                                "Account number copied to clipboard"
                              );
                              setShowToast(true);
                            }}
                          >
                            <IonIcon slot="icon-only" icon={copyOutline} />
                          </IonButton>
                        </IonItem>
                      </IonList>
                    </IonCardContent>
                  </IonCard>

                  <IonCard
                    className={`reference-card ${
                      isValidReference
                        ? "valid"
                        : referenceNumber
                        ? "invalid"
                        : ""
                    }`}
                  >
                    <IonCardContent>
                      <IonItem lines="none" className="reference-item">
                        <IonLabel
                          position="stacked"
                          color={
                            referenceError
                              ? "danger"
                              : isValidReference
                              ? "success"
                              : "medium"
                          }
                        >
                          Enter Reference Number
                          {isValidReference && (
                            <IonIcon
                              icon={checkmarkCircle}
                              color="success"
                              className="validation-icon"
                            />
                          )}
                        </IonLabel>
                        <IonInput
                          value={referenceNumber}
                          onIonInput={(e) =>
                            setReferenceNumber(e.detail.value || "")
                          }
                          placeholder="e.g., 1234567890123"
                          maxlength={9}
                          inputmode="numeric"
                          class={`reference-input ${
                            isValidReference ? "valid-reference" : ""
                          }`}
                          debounce={50}
                        />
                        {referenceError ? (
                          <IonText color="danger" className="error-message">
                            {referenceError}
                          </IonText>
                        ) : referenceNumber && !isValidReference ? (
                          <IonText
                            color="medium"
                            className="validation-message"
                          >
                            {`${referenceNumber.length}/9 digits required`}
                          </IonText>
                        ) : isValidReference ? (
                          <IonText
                            color="success"
                            className="validation-message"
                          >
                            Reference number format is valid
                          </IonText>
                        ) : null}
                        <IonText color="medium" className="hint-text">
                          You'll find your 9-digit reference number in your
                          GCash receipt
                        </IonText>
                      </IonItem>
                    </IonCardContent>
                  </IonCard>

                  {/* Custom verify button that ignores disabled state for styling */}
                  <div className="verify-button-wrapper">
                    <IonButton
                      expand="block"
                      disabled={!isValidReference || isLoading}
                      onClick={handleGcashSubmit}
                      className={`verify-button ${
                        isValidReference ? "valid-button" : ""
                      }`}
                      style={
                        {
                          // Force styles for valid button state
                          "--background": isValidReference
                            ? "var(--button-color)"
                            : "#ddd",
                          "--color": isValidReference ? "white" : "#999",
                          opacity: isValidReference ? 1 : 0.7,
                        } as any
                      }
                    >
                      {isLoading ? (
                        <>
                          <IonSpinner name="dots" />
                          <span className="verify-text">Submitting...</span>
                        </>
                      ) : (
                        "Submit Reference Number"
                      )}
                    </IonButton>
                  </div>
                </>
              )}
            </div>

            <IonToast
              isOpen={showToast}
              onDidDismiss={() => setShowToast(false)}
              message={toastMessage}
              duration={2000}
              position="bottom"
            />
          </IonContent>
        </IonModal>
      </IonContent>

      {/* Loading indicator */}
      <IonLoading
        isOpen={isLoading}
        message="Verifying payment..."
        duration={3000}
      />

      <IonFooter>
        <IonToolbar className="product-footer">
          <div className="footer-content">
            <div className="footer-back-action-button-container">
              <IonButton
                className="footer-back-action-button"
                routerLink="/home/cart/schedule"
                fill="outline"
                onClick={() => {
                  // Reset payment-related data when going back
                  localStorage.removeItem("paymentMethod");
                  localStorage.removeItem("gcashReference");
                }}
              >
                <IonIcon icon={chevronBackCircleOutline} slot="start" />
                Back
              </IonButton>
            </div>
            <div className="footer-action-button-container">
              <IonButton
                className="footer-action-button"
                onClick={handlePayment}
                disabled={
                  paymentMethod === "gcash" &&
                  !localStorage.getItem("gcashReference")
                }
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
