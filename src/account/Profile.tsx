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
      console.log("============= PROFILE DATA DEBUGGING =============");
      console.log("Current user:", user.uid, user.email);

      // Try to get user data from customers collection first
      const customerDoc = await getDoc(doc(db, "customers", user.uid));
      console.log("Customer document exists:", customerDoc.exists());

      if (customerDoc.exists()) {
        const data = customerDoc.data();
        console.log("Raw Firestore customer data:", data);
        console.log("Found firstName:", data.firstName);
        console.log("Found lastName:", data.lastName);
        console.log("Found name:", data.name);
        console.log("Found phoneNumber:", data.phoneNumber);

        // Prioritize constructing name from firstName and lastName if available
        const fullName =
          data.firstName && data.lastName
            ? `${data.firstName} ${data.lastName}`.trim()
            : data.name || user.displayName || "";

        const userData = {
          displayName: fullName,
          email: user.email || data.email || "",
          phoneNumber: data.phoneNumber || "",
          address: data.address || "",
        };

        console.log("Setting user data to:", userData);
        setUserData(userData);
      } else {
        // If not in customers, check users collection
        const userDoc = await getDoc(doc(db, "users", user.uid));
        console.log("User document exists:", userDoc.exists());

        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log("Raw Firestore user data:", data);

          const userData = {
            displayName:
              data.fullName ||
              data.name ||
              data.displayName ||
              user.displayName ||
              "",
            email: user.email || "",
            phoneNumber: data.phoneNumber || "",
            address: data.address || "",
          };

          console.log("Setting user data to:", userData);
          setUserData(userData);
        } else {
          // Use auth data if no documents exist
          console.log("No documents found. Using auth data only.");

          const userData = {
            displayName: user.displayName || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
            address: "",
          };

          console.log("Setting user data to:", userData);
          setUserData(userData);
        }
      }
      console.log("============= END PROFILE DATA DEBUGGING =============");
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

    // Only validate phone number if it has been modified
    if (userData.phoneNumber) {
      const phoneError = validatePhoneNumber(userData.phoneNumber);
      if (phoneError) {
        setPhoneNumberError(phoneError);
        setHasValidationError(true);
        setToastMessage(phoneError);
        setShowToast(true);
        return;
      }
    }

    setUpdating(true); // Use updating state instead of loading for save operations
    try {
      // Prepare update data - only include fields that have values
      const updateData: Record<string, string> = {};

      if (userData.displayName) {
        // Split the display name into firstName and lastName for consistency
        const nameParts = userData.displayName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Store all variations of the name for maximum compatibility
        updateData.name = userData.displayName.trim();
        updateData.firstName = firstName;
        updateData.lastName = lastName;

        console.log("Updating name fields:", {
          name: updateData.name,
          firstName,
          lastName,
        });
      }

      if (userData.phoneNumber) {
        updateData.phoneNumber = userData.phoneNumber;
        console.log("Updating phone number:", userData.phoneNumber);
      }

      if (userData.address) {
        updateData.address = userData.address;
      }

      // Try to update in customers collection first
      const customerRef = doc(db, "customers", user.uid);
      const customerDoc = await getDoc(customerRef);

      if (customerDoc.exists()) {
        console.log("Updating customer document with:", updateData);
        await updateDoc(customerRef, updateData);
        console.log("Customer document updated successfully");
      } else {
        // If not in customers, update in users collection with appropriate field names
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          // Rename 'name' to 'displayName' for users collection if needed
          if (updateData.name) {
            updateData.displayName = updateData.name;
            // Keep firstName and lastName
          }

          console.log("Updating user document with:", updateData);
          await updateDoc(userRef, updateData);
          console.log("User document updated successfully");
        }
      }

      // Refresh the user data after update
      fetchUserData();

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
          <IonTitle>Profile</IonTitle>
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
