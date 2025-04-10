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
  IonSpinner,
  IonListHeader,
  IonRippleEffect,
} from "@ionic/react";
import { signOut } from "firebase/auth";
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router";
import { auth, db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import {
  personOutline,
  receiptOutline,
  logOutOutline,
  settingsOutline,
  helpCircleOutline,
  chevronForward,
  notifications,
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
          // First try to get the user from the customers collection
          const customerDoc = await getDoc(doc(db, "customers", user.uid));

          if (customerDoc.exists()) {
            const customerData = customerDoc.data();
            setUserProfile({
              displayName:
                customerData.name ||
                `${customerData.firstName || ""} ${
                  customerData.lastName || ""
                }`.trim() ||
                user.displayName ||
                user.email?.split("@")[0] ||
                "Guest",
              email: user.email || customerData.email || "",
              phoneNumber: customerData.phoneNumber || "",
              photoURL: user.photoURL || "",
            });
          } else {
            // If not in customers, check the users collection
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserProfile({
                displayName:
                  userData.fullName ||
                  userData.name ||
                  userData.displayName ||
                  user.displayName ||
                  user.email?.split("@")[0] ||
                  "Guest",
                email: user.email || "",
                phoneNumber: userData.phoneNumber || "",
                photoURL: user.photoURL || "",
              });
            } else {
              // If user doc doesn't exist in Firestore, create basic profile from auth
              setUserProfile({
                displayName:
                  user.displayName || user.email?.split("@")[0] || "Guest",
                email: user.email || "",
                photoURL: user.photoURL || "",
              });
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Even if there's an error, show what we can
          setUserProfile({
            displayName:
              user.displayName || user.email?.split("@")[0] || "Guest",
            email: user.email || "",
            photoURL: user.photoURL || "",
          });
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

  const navigateTo = (path: string) => {
    history.push(path);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>Account</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <>
            <div className="profile-section">
              <div className="profile-header">
                <IonAvatar className="profile-avatar">
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="Profile" />
                  ) : (
                    <div className="initials-avatar">
                      {userProfile?.displayName
                        ?.split(" ")
                        .map((name) => name[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2) ||
                        userProfile?.email?.[0]?.toUpperCase() ||
                        "G"}
                    </div>
                  )}
                </IonAvatar>
                <div className="profile-info">
                  <h2>
                    {userProfile?.displayName || userProfile?.email || "Guest"}
                  </h2>
                  <p>{userProfile?.email || "No email provided"}</p>
                </div>
              </div>
            </div>

            <div className="account-sections">
              <IonList lines="none" className="account-list">
                <IonListHeader>Account</IonListHeader>

                <IonItem
                  button
                  detail={false}
                  className="account-item"
                  onClick={() => navigateTo("/profile")}
                >
                  <IonIcon icon={personOutline} slot="start" />
                  <IonLabel>Personal Information</IonLabel>
                  <IonIcon icon={chevronForward} slot="end" size="small" />
                  <IonRippleEffect />
                </IonItem>

                <IonItem
                  button
                  detail={false}
                  className="account-item"
                  onClick={() => navigateTo("/orders")}
                >
                  <IonIcon icon={receiptOutline} slot="start" />
                  <IonLabel>Order History</IonLabel>
                  <IonIcon icon={chevronForward} slot="end" size="small" />
                  <IonRippleEffect />
                </IonItem>

                <IonItem
                  button
                  detail={false}
                  className="account-item"
                  onClick={() => navigateTo("/notifications")}
                >
                  <IonIcon icon={notifications} slot="start" />
                  <IonLabel>Notifications</IonLabel>
                  <IonIcon icon={chevronForward} slot="end" size="small" />
                  <IonRippleEffect />
                </IonItem>
              </IonList>

              <IonList lines="none" className="account-list">
                <IonListHeader>Settings & Support</IonListHeader>

                <IonItem
                  button
                  detail={false}
                  className="account-item"
                  onClick={() => navigateTo("/settings")}
                >
                  <IonIcon icon={settingsOutline} slot="start" />
                  <IonLabel>Settings</IonLabel>
                  <IonIcon icon={chevronForward} slot="end" size="small" />
                  <IonRippleEffect />
                </IonItem>

                <IonItem
                  button
                  detail={false}
                  className="account-item"
                  onClick={() => navigateTo("/help")}
                >
                  <IonIcon icon={helpCircleOutline} slot="start" />
                  <IonLabel>Help & Support</IonLabel>
                  <IonIcon icon={chevronForward} slot="end" size="small" />
                  <IonRippleEffect />
                </IonItem>
              </IonList>
            </div>

            <div className="logout-section">
              <IonButton
                expand="block"
                color="medium"
                onClick={() => setShowLogoutConfirm(true)}
                className="logout-button"
              >
                <IonIcon icon={logOutOutline} slot="start" />
                Sign Out
              </IonButton>
            </div>

            <IonAlert
              isOpen={showLogoutConfirm}
              onDidDismiss={() => setShowLogoutConfirm(false)}
              header="Sign Out"
              message="Are you sure you want to sign out of your account?"
              buttons={[
                {
                  text: "Cancel",
                  role: "cancel",
                },
                {
                  text: "Sign Out",
                  role: "destructive",
                  handler: handleLogout,
                },
              ]}
            />
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Account;
