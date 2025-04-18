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
  IonText,
} from "@ionic/react";
import {
  lockClosed,
  eyeOutline,
  eyeOffOutline,
  arrowForward,
  warningOutline,
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
    if (!/[A-Z]/.test(password)) {
      setNewPasswordError(
        "Password must contain at least one uppercase letter"
      );
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setNewPasswordError(
        "Password must contain at least one lowercase letter"
      );
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setNewPasswordError("Password must contain at least one number");
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setNewPasswordError(
        "Password must contain at least one special character"
      );
      return false;
    }
    if (password.length > 128) {
      setNewPasswordError("Password is too long (maximum 128 characters)");
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
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/account" />
          </IonButtons>
          <IonTitle>Change Password</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="change-password-page">
        <div className="change-password-wrapper ion-padding">
          <div className="change-password-container">
            <div className="change-password-form-container">
              <IonList>
                <div className="change-password-input-wrapper">
                  <IonItem
                    className={`change-password-item ${
                      currentPasswordError ? "input-error" : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="input-label" position="stacked">
                      Current Password
                    </IonLabel>
                    <IonInput
                      className="change-password-input"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={currentPassword}
                      fill="outline"
                      onIonChange={(e) => setCurrentPassword(e.detail.value!)}
                    >
                      <IonIcon icon={lockClosed} slot="start"></IonIcon>
                      <IonIcon
                        icon={showCurrentPassword ? eyeOffOutline : eyeOutline}
                        slot="end"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        style={{ cursor: "pointer", fontSize: "0.9rem" }}
                      ></IonIcon>
                    </IonInput>
                  </IonItem>
                  {currentPasswordError && (
                    <IonText color="danger" className="error-text">
                      <IonIcon icon={warningOutline} /> {currentPasswordError}
                    </IonText>
                  )}

                  <IonItem
                    className={`change-password-item ${
                      newPasswordError ? "input-error" : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="input-label" position="stacked">
                      New Password
                    </IonLabel>
                    <IonInput
                      className="change-password-input"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      fill="outline"
                      style={{ marginTop: "8px" }}
                      onIonChange={(e) => setNewPassword(e.detail.value!)}
                    >
                      <IonIcon icon={lockClosed} slot="start"></IonIcon>
                      <IonIcon
                        icon={showNewPassword ? eyeOffOutline : eyeOutline}
                        slot="end"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ cursor: "pointer", fontSize: "0.9rem" }}
                      ></IonIcon>
                    </IonInput>
                  </IonItem>
                  {newPasswordError && (
                    <IonText color="danger" className="error-text">
                      <IonIcon icon={warningOutline} /> {newPasswordError}
                    </IonText>
                  )}

                  <IonItem
                    className={`change-password-item ${
                      confirmPasswordError ? "input-error" : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="input-label" position="stacked">
                      Confirm New Password
                    </IonLabel>
                    <IonInput
                      className="change-password-input"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      fill="outline"
                      onIonChange={(e) => setConfirmPassword(e.detail.value!)}
                    >
                      <IonIcon icon={lockClosed} slot="start"></IonIcon>
                      <IonIcon
                        icon={showConfirmPassword ? eyeOffOutline : eyeOutline}
                        slot="end"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        style={{ cursor: "pointer", fontSize: "0.9rem" }}
                      ></IonIcon>
                    </IonInput>
                  </IonItem>
                  {confirmPasswordError && (
                    <IonText color="danger" className="error-text">
                      <IonIcon icon={warningOutline} /> {confirmPasswordError}
                    </IonText>
                  )}
                </div>

                <div className="change-password-button-wrapper">
                  <IonButton
                    className="change-password-button"
                    expand="block"
                    onClick={handleChange}
                    disabled={
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword ||
                      isLoading
                    }
                  >
                    {isLoading ? "Processing..." : <>Update Password</>}
                  </IonButton>
                </div>
              </IonList>
            </div>
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
