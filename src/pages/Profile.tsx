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
} from "@ionic/react";
import { checkmark, pencil, saveOutline } from "ionicons/icons";
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
  const [editMode, setEditMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
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

    fetchUserData();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
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
    } catch (error) {
      console.error("Error updating profile:", error);
      setToastMessage("Failed to update profile");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  return (
    <IonPage>
      <IonHeader className="profile-header ion-no-border">
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
              <IonButton onClick={handleSave} disabled={loading}>
                <IonIcon icon={saveOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="profile-content">
        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <div className="profile-container">
            <div className="profile-section">
              <IonList className="profile-list">
                <IonItem lines="full" className="profile-item">
                  <IonLabel position="stacked">Full Name</IonLabel>
                  <IonInput
                    value={userData.displayName}
                    disabled={!editMode}
                    onIonChange={(e) =>
                      setUserData({
                        ...userData,
                        displayName: e.detail.value || "",
                      })
                    }
                    className={
                      editMode ? "profile-input-active" : "profile-input"
                    }
                  />
                </IonItem>

                <IonItem lines="full" className="profile-item">
                  <IonLabel position="stacked">Email</IonLabel>
                  <IonInput
                    value={userData.email}
                    disabled={true}
                    className="profile-input"
                  />
                </IonItem>

                <IonItem lines="full" className="profile-item">
                  <IonLabel position="stacked">Phone Number</IonLabel>
                  <IonInput
                    value={userData.phoneNumber}
                    disabled={!editMode}
                    onIonChange={(e) =>
                      setUserData({
                        ...userData,
                        phoneNumber: e.detail.value || "",
                      })
                    }
                    className={
                      editMode ? "profile-input-active" : "profile-input"
                    }
                  />
                </IonItem>

                <IonItem lines="none" className="profile-item">
                  <IonLabel position="stacked">Address</IonLabel>
                  <IonInput
                    value={userData.address}
                    disabled={!editMode}
                    onIonChange={(e) =>
                      setUserData({
                        ...userData,
                        address: e.detail.value || "",
                      })
                    }
                    className={
                      editMode ? "profile-input-active" : "profile-input"
                    }
                  />
                </IonItem>
              </IonList>
            </div>

            {editMode && (
              <div className="button-container">
                <IonButton
                  expand="block"
                  onClick={handleSave}
                  disabled={loading}
                >
                  Save Changes
                  {loading ? (
                    <IonSpinner name="crescent" slot="end" />
                  ) : (
                    <IonIcon icon={checkmark} slot="end" />
                  )}
                </IonButton>
              </div>
            )}
          </div>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
