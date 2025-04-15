import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonLoading,
} from "@ionic/react";
import {
  lockClosed,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircleOutline,
  arrowForward,
} from "ionicons/icons";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "../firebase-config";
import "./ChangePassword.css";

const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState("success");

  // Validation states
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const validateCurrentPassword = (password: string) => {
    if (!password) {
      setCurrentPasswordError("Current password is required");
      return false;
    }
    setCurrentPasswordError("");
    return true;
  };

  const validateNewPassword = (password: string) => {
    if (!password) {
      setNewPasswordError("New password is required");
      return false;
    }
    if (password.length < 8) {
      setNewPasswordError("Password must be at least 8 characters");
      return false;
    }
    if (password === currentPassword) {
      setNewPasswordError(
        "New password must be different from current password"
      );
      return false;
    }
    setNewPasswordError("");
    return true;
  };

  const validateConfirmPassword = (password: string) => {
    if (!password) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    }
    if (password !== newPassword) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handleChange = () => {
    const isCurrentPasswordValid = validateCurrentPassword(currentPassword);
    const isNewPasswordValid = validateNewPassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (
      !isCurrentPasswordValid ||
      !isNewPasswordValid ||
      !isConfirmPasswordValid
    ) {
      return;
    }

    setIsLoading(true);
    const user = auth.currentUser;

    if (!user || !user.email) {
      setToastMessage("No authenticated user found");
      setToastColor("danger");
      setShowToast(true);
      setIsLoading(false);
      return;
    }

    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    reauthenticateWithCredential(user, credential)
      .then(() => {
        // User re-authenticated, now change password
        return updatePassword(user, newPassword);
      })
      .then(() => {
        // Password updated successfully
        setToastMessage("Password changed successfully");
        setToastColor("success");
        setShowToast(true);

        // Reset form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      })
      .catch((error) => {
        // Handle errors
        console.error("Error changing password:", error);

        if (error.code === "auth/wrong-password") {
          setCurrentPasswordError("Current password is incorrect");
          setToastMessage("Current password is incorrect");
        } else if (error.code === "auth/too-many-requests") {
          setToastMessage("Too many failed attempts. Try again later");
        } else {
          setToastMessage("Failed to change password: " + error.message);
        }

        setToastColor("danger");
        setShowToast(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/settings" />
          </IonButtons>
          <IonTitle>Change Password</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="change-password-container">
          <h2 className="page-title">Update your password</h2>
          <p className="page-description">
            For security, please enter your current password before setting a
            new one.
          </p>

          <IonList className="form-list">
            <IonItem
              className={`form-item ${currentPasswordError ? "has-error" : ""}`}
            >
              <IonIcon icon={lockClosed} slot="start" className="form-icon" />
              <IonLabel position="floating">Current Password</IonLabel>
              <IonInput
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onIonChange={(e) => setCurrentPassword(e.detail.value!)}
                className="form-input"
                required
              />
              <IonButton
                fill="clear"
                slot="end"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="visibility-button"
              >
                <IonIcon
                  icon={showCurrentPassword ? eyeOffOutline : eyeOutline}
                  slot="icon-only"
                />
              </IonButton>
            </IonItem>
            {currentPasswordError && (
              <div className="error-message">{currentPasswordError}</div>
            )}

            <div className="spacer"></div>

            <IonItem
              className={`form-item ${newPasswordError ? "has-error" : ""}`}
            >
              <IonIcon icon={lockClosed} slot="start" className="form-icon" />
              <IonLabel position="floating">New Password</IonLabel>
              <IonInput
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onIonChange={(e) => setNewPassword(e.detail.value!)}
                className="form-input"
                required
              />
              <IonButton
                fill="clear"
                slot="end"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="visibility-button"
              >
                <IonIcon
                  icon={showNewPassword ? eyeOffOutline : eyeOutline}
                  slot="icon-only"
                />
              </IonButton>
            </IonItem>
            {newPasswordError && (
              <div className="error-message">{newPasswordError}</div>
            )}

            <IonItem
              className={`form-item ${confirmPasswordError ? "has-error" : ""}`}
            >
              <IonIcon icon={lockClosed} slot="start" className="form-icon" />
              <IonLabel position="floating">Confirm New Password</IonLabel>
              <IonInput
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onIonChange={(e) => setConfirmPassword(e.detail.value!)}
                className="form-input"
                required
              />
              <IonButton
                fill="clear"
                slot="end"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="visibility-button"
              >
                <IonIcon
                  icon={showConfirmPassword ? eyeOffOutline : eyeOutline}
                  slot="icon-only"
                />
              </IonButton>
            </IonItem>
            {confirmPasswordError && (
              <div className="error-message">{confirmPasswordError}</div>
            )}
          </IonList>

          <div className="button-container">
            <IonButton
              expand="block"
              onClick={handleChange}
              className="change-password-button"
              disabled={
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                isLoading
              }
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  Update Password
                  <IonIcon icon={arrowForward} slot="end" />
                </>
              )}
            </IonButton>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
          color={toastColor}
        />

        <IonLoading isOpen={isLoading} message="Updating password..." />
      </IonContent>
    </IonPage>
  );
};

export default ChangePassword;
