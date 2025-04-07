import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonIcon,
  IonList,
  IonAvatar,
  IonText,
} from "@ionic/react";
import { signOut } from "firebase/auth";
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router";
import { auth, db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import {
  personCircleOutline,
  mailOutline,
  callOutline,
  logOutOutline,
  settingsOutline,
  helpCircleOutline,
} from "ionicons/icons";
import "./Account.css";

interface UserProfile {
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
}

const Account: React.FC = () => {
  const history = useHistory();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserProfile({
              displayName:
                userDoc.data().displayName || user.displayName || "User",
              email: user.email || "",
              phoneNumber: userDoc.data().phoneNumber || "",
              photoURL: user.photoURL || "",
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      history.replace("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const showLogoutConfirmation = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="title-toolbar">Account</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="profile-section">
          <div className="profile-header">
            <IonAvatar className="profile-avatar">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Profile" />
              ) : (
                <IonIcon icon={personCircleOutline} />
              )}
            </IonAvatar>
            <div className="profile-info">
              <h2>{userProfile?.displayName || "User"}</h2>
              <p>{userProfile?.email || "No email provided"}</p>
            </div>
          </div>
        </div>

        <IonList className="account-list">
          <IonItem className="account-item">
            <IonIcon icon={personCircleOutline} slot="start" />
            <IonLabel>Edit Profile</IonLabel>
          </IonItem>

          <IonItem className="account-item">
            <IonIcon icon={mailOutline} slot="start" />
            <IonLabel>Email Preferences</IonLabel>
          </IonItem>

          <IonItem className="account-item">
            <IonIcon icon={callOutline} slot="start" />
            <IonLabel>Contact Information</IonLabel>
          </IonItem>

          <IonItem className="account-item">
            <IonIcon icon={settingsOutline} slot="start" />
            <IonLabel>Settings</IonLabel>
          </IonItem>

          <IonItem className="account-item">
            <IonIcon icon={helpCircleOutline} slot="start" />
            <IonLabel>Help & Support</IonLabel>
          </IonItem>
        </IonList>

        <div className="logout-section">
          <IonButton
            expand="block"
            color="danger"
            onClick={showLogoutConfirmation}
            className="logout-button"
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Logout
          </IonButton>
        </div>

        <IonAlert
          isOpen={showLogoutConfirm}
          onDidDismiss={() => setShowLogoutConfirm(false)}
          header="Confirm Logout"
          message="Are you sure you want to logout?"
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => {
                setShowLogoutConfirm(false);
              },
            },
            {
              text: "Logout",
              handler: () => {
                handleLogout();
              },
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Account;
