import React, { useEffect, useState } from "react";
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
  IonSpinner,
  IonToast,
  IonText,
  IonLoading,
} from "@ionic/react";
import {
  pencil,
  saveOutline,
  warningOutline,
  personOutline,
  mailOutline,
  callOutline,
} from "ionicons/icons";
import { auth, db } from "../firebase-config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import "./Profile.css";

interface UserData {
  displayName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

const Profile: React.FC = () => {
  const [userData, setUserData] = useState<UserData>({
    displayName: "",
    email: "",
    phoneNumber: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false); // Add new state for update operations
  const [editMode, setEditMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Add validation state
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [hasValidationError, setHasValidationError] = useState(false);

  // Phone number validation function
  const validatePhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) {
      return "Phone Number is required";
    }

    // Remove spaces, dashes and parentheses for validation
    const cleanedPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

    // Check if starts with +63
    if (!cleanedPhoneNumber.startsWith("+63")) {
      return "Phone number must start with +63";
    }

    // After +63 prefix, should have 10 digits (Philippine mobile format)
    const digitsPart = cleanedPhoneNumber.substring(3); // Skip the +63 part

    if (!/^[0-9]{10}$/.test(digitsPart)) {
      return "Please enter a valid mobile number";
    }

    return "";
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Try to get user data from customers collection first
      const customerDoc = await getDoc(doc(db, "customers", user.uid));
      if (customerDoc.exists()) {
        const data = customerDoc.data();
        setUserData({
          displayName:
            data.name ||
            `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
            user.displayName ||
            "",
          email: user.email || data.email || "",
          phoneNumber: data.phoneNumber || "",
          address: data.address || "",
        });
      } else {
        // If not in customers, check users collection
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            displayName:
              data.fullName ||
              data.name ||
              data.displayName ||
              user.displayName ||
              "",
            email: user.email || "",
            phoneNumber: data.phoneNumber || "",
            address: data.address || "",
          });
        } else {
          // Use auth data if no documents exist
          setUserData({
            displayName: user.displayName || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
            address: "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Blur any active input elements first to ensure all changes are captured
    document.activeElement instanceof HTMLElement &&
      document.activeElement.blur();

    const user = auth.currentUser;
    if (!user) return;

    // Validate phone number before saving
    const phoneError = validatePhoneNumber(userData.phoneNumber);
    if (phoneError) {
      setPhoneNumberError(phoneError);
      setHasValidationError(true);
      setToastMessage(phoneError);
      setShowToast(true);
      return;
    }

    setUpdating(true); // Use updating state instead of loading for save operations
    try {
      // Try to update in customers collection first
      const customerRef = doc(db, "customers", user.uid);
      const customerDoc = await getDoc(customerRef);

      if (customerDoc.exists()) {
        await updateDoc(customerRef, {
          name: userData.displayName,
          phoneNumber: userData.phoneNumber,
          address: userData.address,
        });
      } else {
        // If not in customers, update in users collection
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          await updateDoc(userRef, {
            displayName: userData.displayName,
            phoneNumber: userData.phoneNumber,
            address: userData.address,
          });
        }
      }

      setToastMessage("Profile updated successfully");
      setShowToast(true);
      setEditMode(false);
      setHasValidationError(false);
      setPhoneNumberError("");
    } catch (error) {
      console.error("Error updating profile:", error);
      setToastMessage("Failed to update profile");
      setShowToast(true);
    } finally {
      setUpdating(false); // Clear updating state
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/account" />
          </IonButtons>
          <IonTitle>Personal Information</IonTitle>
          <IonButtons slot="end">
            {!editMode ? (
              <IonButton onClick={toggleEditMode}>
                <IonIcon icon={pencil} />
              </IonButton>
            ) : (
              <IonButton onClick={handleSave} disabled={loading || updating}>
                <IonIcon icon={saveOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="profile-page">
        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading your information...</p>
          </div>
        ) : (
          <div className="profile-wrapper ion-padding">
            <div className="profile-container ion-margin-auto">
              <div className="profile-form-container">
                <IonList className="ion-no-padding">
                  <div className="profile-input-wrapper">
                    <IonItem className="profile-item" lines="none">
                      <IonLabel className="input-label" position="stacked">
                        Full Name
                      </IonLabel>
                      <IonInput
                        className="profile-input"
                        value={userData.displayName}
                        disabled={!editMode}
                        onIonChange={(e) =>
                          setUserData({
                            ...userData,
                            displayName: e.detail.value || "",
                          })
                        }
                        fill="outline"
                        placeholder="Enter your full name"
                      >
                        <IonIcon icon={personOutline} slot="start"></IonIcon>
                      </IonInput>
                    </IonItem>

                    <IonItem className="profile-item" lines="none">
                      <IonLabel className="input-label" position="stacked">
                        Email
                      </IonLabel>
                      <IonInput
                        className="profile-input"
                        value={userData.email}
                        disabled={true}
                        fill="outline"
                        placeholder="Your email address"
                      >
                        <IonIcon icon={mailOutline} slot="start"></IonIcon>
                      </IonInput>
                    </IonItem>

                    <IonItem
                      className={`profile-item ${
                        phoneNumberError && editMode ? "input-error" : ""
                      }`}
                      lines="none"
                    >
                      <IonLabel className="input-label" position="stacked">
                        Phone Number
                      </IonLabel>
                      <IonInput
                        className="profile-input"
                        value={userData.phoneNumber}
                        disabled={!editMode}
                        maxlength={13} // +63 plus 10 digits = 13 characters
                        onIonChange={(e) => {
                          let value = e.detail.value || "";

                          // If the user hasn't entered the +63 prefix, add it
                          if (
                            value &&
                            !value.startsWith("+") &&
                            !value.startsWith("0")
                          ) {
                            value = "+63" + value;
                          } else if (value && value.startsWith("0")) {
                            // Convert 09XX format to +639XX format
                            value = "+63" + value.substring(1);
                          }

                          // Ensure we don't exceed maximum length (13 chars)
                          if (value.length > 13) {
                            value = value.substring(0, 13);
                          }

                          setUserData({
                            ...userData,
                            phoneNumber: value,
                          });

                          // Validate phone number as user types
                          if (editMode) {
                            const error = validatePhoneNumber(value);
                            setPhoneNumberError(error);
                            setHasValidationError(!!error);
                          }
                        }}
                        fill="outline"
                        placeholder={
                          editMode ? "+63 9XX XXX XXXX" : "Phone number"
                        }
                      >
                        <IonIcon icon={callOutline} slot="start"></IonIcon>
                      </IonInput>
                    </IonItem>
                    {phoneNumberError && editMode && (
                      <IonText color="danger" className="error-text">
                        <IonIcon icon={warningOutline} /> {phoneNumberError}
                      </IonText>
                    )}
                  </div>

                  {editMode && (
                    <div className="profile-button-wrapper">
                      <IonButton
                        className="profile-button"
                        expand="block"
                        onClick={handleSave}
                        disabled={loading || updating || hasValidationError}
                      >
                        {updating ? "Saving..." : "Save Changes"}
                      </IonButton>
                    </div>
                  )}
                </IonList>
              </div>
            </div>
          </div>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
          color={phoneNumberError ? "danger" : "success"}
          cssClass={phoneNumberError ? "validation-error" : ""}
        />

        <IonLoading isOpen={updating} message="Updating profile..." />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
