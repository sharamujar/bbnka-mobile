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
  IonToggle,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonToast,
} from "@ionic/react";
import { signOut } from "firebase/auth";
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router";
import { auth, db } from "../firebase-config";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  personOutline,
  receiptOutline,
  logOutOutline,
  helpCircleOutline,
  chevronForward,
  notifications,
  notificationsOutline,
  lockClosedOutline,
  informationCircleOutline,
  callOutline,
  refreshOutline,
} from "ionicons/icons";
import { RefresherEventDetail } from "@ionic/core";
import "./Account.css";

interface UserProfile {
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
}

interface UserSettings {
  pushNotifications: boolean;
  orderStatusNotifications: boolean;
  promotionNotifications: boolean;
  paymentNotifications: boolean;
  orderReminders: boolean;
  pickupReminders: boolean;
}

const Account: React.FC = () => {
  const history = useHistory();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings>({
    pushNotifications: true,
    orderStatusNotifications: true,
    promotionNotifications: true,
    paymentNotifications: true,
    orderReminders: true,
    pickupReminders: true,
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    fetchUserProfile();
    fetchUserSettings();
  }, []);

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
          displayName: user.displayName || user.email?.split("@")[0] || "Guest",
          email: user.email || "",
          photoURL: user.photoURL || "",
        });
      }
      setLoading(false);
    }
  };

  const fetchUserSettings = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userSettingsDoc = await getDoc(doc(db, "userSettings", user.uid));
      if (userSettingsDoc.exists()) {
        const data = userSettingsDoc.data() as UserSettings;
        setSettings({
          ...settings,
          ...data,
        });
      } else {
        // If no settings exist yet, create default settings
        await setDoc(doc(db, "userSettings", user.uid), {
          ...settings,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await Promise.all([fetchUserProfile(), fetchUserSettings()]);
    event.detail.complete();
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    const user = auth.currentUser;
    if (!user) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const settingsRef = doc(db, "customers", user.uid);
      await updateDoc(settingsRef, {
        [key]: value,
        updatedAt: serverTimestamp(),
      });

      setToastMessage("Settings updated");
      setShowToast(true);
    } catch (error) {
      console.error("Error updating settings:", error);
      setToastMessage("Failed to update settings");
      setShowToast(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      history.replace("/login");
    } catch (error) {
      console.error("Logout failed", error);
      setToastMessage("Failed to sign out");
      setShowToast(true);
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
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={refreshOutline}
            pullingText="Pull to refresh"
            refreshingSpinner="circles"
            refreshingText="Refreshing..."
          ></IonRefresherContent>
        </IonRefresher>

        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <>
            <div className="account-profile-section">
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

                {/* <IonItem
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
                </IonItem> */}

                <IonItem
                  button
                  detail={false}
                  className="account-item"
                  onClick={() => navigateTo("/change-password")}
                >
                  <IonIcon icon={lockClosedOutline} slot="start" />
                  <IonLabel>Change Password</IonLabel>
                  <IonIcon icon={chevronForward} slot="end" size="small" />
                  <IonRippleEffect />
                </IonItem>
              </IonList>

              <IonList lines="none" className="account-list">
                <IonListHeader>Notification Preferences</IonListHeader>
                <IonItem className="account-item">
                  <IonIcon icon={notificationsOutline} slot="start" />
                  <IonLabel>Push Notifications</IonLabel>
                  <IonToggle
                    slot="end"
                    checked={settings.pushNotifications}
                    onIonChange={(e) =>
                      updateSetting("pushNotifications", e.detail.checked)
                    }
                  />
                </IonItem>
                {settings.pushNotifications && (
                  <>
                    <IonItem className="account-item notification-sub-item">
                      <IonLabel>Order Status Updates</IonLabel>
                      <IonToggle
                        slot="end"
                        checked={settings.orderStatusNotifications}
                        onIonChange={(e) =>
                          updateSetting(
                            "orderStatusNotifications",
                            e.detail.checked
                          )
                        }
                      />
                    </IonItem>
                    <IonItem className="account-item notification-sub-item">
                      <IonLabel>Payment Confirmations</IonLabel>
                      <IonToggle
                        slot="end"
                        checked={settings.paymentNotifications}
                        onIonChange={(e) =>
                          updateSetting(
                            "paymentNotifications",
                            e.detail.checked
                          )
                        }
                      />
                    </IonItem>
                    <IonItem className="account-item notification-sub-item">
                      <IonLabel>Pickup Reminders</IonLabel>
                      <IonToggle
                        slot="end"
                        checked={settings.pickupReminders}
                        onIonChange={(e) =>
                          updateSetting("pickupReminders", e.detail.checked)
                        }
                      />
                    </IonItem>
                    <IonItem className="account-item notification-sub-item">
                      <IonLabel>Promotions & Offers</IonLabel>
                      <IonToggle
                        slot="end"
                        checked={settings.promotionNotifications}
                        onIonChange={(e) =>
                          updateSetting(
                            "promotionNotifications",
                            e.detail.checked
                          )
                        }
                      />
                    </IonItem>
                  </>
                )}
              </IonList>

              <IonList lines="none" className="account-list">
                <IonListHeader>Support</IonListHeader>

                <IonItem
                  button
                  detail={false}
                  className="account-item"
                  onClick={() => navigateTo("/help")}
                >
                  <IonIcon icon={helpCircleOutline} slot="start" />
                  <IonLabel>Help Center</IonLabel>
                  <IonIcon icon={chevronForward} slot="end" size="small" />
                  <IonRippleEffect />
                </IonItem>

                {/* <IonItem className="account-item">
                  <IonIcon icon={callOutline} slot="start" />
                  <IonLabel>Contact Us</IonLabel>
                  <IonNote slot="end">+63 916 123 4567</IonNote>
                </IonItem> */}

                <IonItem
                  button
                  detail={false}
                  className="account-item"
                  onClick={() => navigateTo("/about")}
                >
                  <IonIcon icon={informationCircleOutline} slot="start" />
                  <IonLabel>About BBNKA</IonLabel>
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

            <div className="account-footer">
              <p>BBNKA Mobile v1.0.2</p>
              <p>© 2025 BBNKA. All rights reserved.</p>
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

            <IonToast
              isOpen={showToast}
              onDidDismiss={() => setShowToast(false)}
              message={toastMessage}
              duration={2000}
              position="bottom"
            />
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Account;
