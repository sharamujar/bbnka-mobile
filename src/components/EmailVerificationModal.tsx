import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonButton,
  IonIcon,
  IonText,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import { mail } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { auth, db } from "../firebase-config";
import { sendEmailVerification } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import "./EmailVerificationModal.css";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Make email and uid optional
  email?: string | null;
  uid?: string | null;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  uid,
}) => {
  const history = useHistory();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Get user email and uid from either props or current auth state
  const currentEmail = email || auth.currentUser?.email;
  const currentUid = uid || auth.currentUser?.uid;

  // Check if the user authenticated with Google
  useEffect(() => {
    if (isOpen && auth.currentUser) {
      const isGoogleUser = auth.currentUser.providerData.some(
        (provider) => provider.providerId === "google.com"
      );

      // If Google user, mark as verified and close modal
      if (isGoogleUser) {
        handleGoogleUserVerification();
      }
    }
  }, [isOpen]);

  // Handle Google user verification by marking them as verified in Firestore
  const handleGoogleUserVerification = async () => {
    if (auth.currentUser && auth.currentUser.uid) {
      try {
        await updateDoc(doc(db, "customers", auth.currentUser.uid), {
          emailVerified: true,
        });

        // Close the modal without showing it
        onClose();
      } catch (error) {
        console.error("Error updating Google user verification status:", error);
      }
    }
  };

  const checkVerification = async () => {
    if (isVerifying || !auth.currentUser) return;

    setIsVerifying(true);
    try {
      // Reload user to get the latest emailVerified status
      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
        // Email is verified, update the Firestore document
        if (currentUid) {
          await updateDoc(doc(db, "customers", currentUid), {
            emailVerified: true,
          });

          setToastMessage("Email verified! Welcome to BBNKA.");
          setIsSuccess(true);
          setShowToast(true);

          // Close modal and navigate to home
          setTimeout(() => {
            onClose();
            history.replace("/home");
          }, 1000);
        }
      } else {
        // Not verified yet
        setToastMessage(
          "Email not verified yet. Please check your inbox and click the verification link."
        );
        setIsSuccess(false);
        setShowToast(true);
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setToastMessage("Failed to check verification status. Please try again.");
      setIsSuccess(false);
      setShowToast(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const resendEmail = async () => {
    if (isResendingEmail || !auth.currentUser) return;

    setIsResendingEmail(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setToastMessage("Verification email resent!");
      setIsSuccess(true);
      setShowToast(true);
    } catch (error) {
      console.error("Error resending verification email:", error);
      setToastMessage("Failed to resend verification email");
      setIsSuccess(false);
      setShowToast(true);
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <>
      <IonModal
        isOpen={isOpen}
        backdropDismiss={false}
        onDidDismiss={onClose}
        className="verification-modal"
      >
        <div className="verification-modal-content">
          <div className="verification-icon">
            <IonIcon icon={mail} />
          </div>

          <h2>Verify Your Email</h2>

          <p>
            We need you to verify your email address: <br />
            <strong>
              {currentEmail || auth.currentUser?.email || "your email"}
            </strong>
          </p>

          <IonText className="verification-instructions">
            We sent you a verification email when you registered. Please check
            your inbox and click the verification link to activate your account.
            If you don't see the email, check your spam folder or request a new
            one.
          </IonText>

          <div className="verification-buttons">
            <IonButton
              expand="block"
              className="check-verification-button"
              onClick={checkVerification}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <IonSpinner name="dots" /> Checking...
                </>
              ) : (
                "I've Verified My Email"
              )}
            </IonButton>

            <IonButton
              expand="block"
              className="resend-email-button"
              onClick={resendEmail}
              disabled={isResendingEmail}
            >
              {isResendingEmail ? (
                <>
                  <IonSpinner name="dots" /> Sending...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              className="sign-out-button"
              onClick={() => {
                auth.signOut();
                onClose();
                history.push("/login");
              }}
            >
              Sign Out
            </IonButton>
          </div>
        </div>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={isSuccess ? "success" : "danger"}
        buttons={[
          {
            text: "OK",
            role: "cancel",
          },
        ]}
      />
    </>
  );
};

export default EmailVerificationModal;
