import React, { useState, useEffect } from "react";
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
  IonToggle,
  IonIcon,
  IonToast,
  IonButton,
  IonNote,
  IonSpinner,
  IonRefresherContent,
  IonRefresher,
  useIonAlert,
} from "@ionic/react";
import {
  notificationsOutline,
  lockClosedOutline,
  informationCircleOutline,
  helpCircleOutline,
  powerOutline,
  refreshOutline,
  callOutline,
} from "ionicons/icons";
import { auth, db } from "../firebase-config";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import "./Settings.css";
import { RefresherEventDetail } from "@ionic/core";
import { useHistory } from "react-router-dom";

interface UserSettings {
  pushNotifications: boolean;
  orderStatusNotifications: boolean;
  promotionNotifications: boolean;
  paymentNotifications: boolean;
  orderReminders: boolean;
  pickupReminders: boolean;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    pushNotifications: true,
    orderStatusNotifications: true,
    promotionNotifications: true,
    paymentNotifications: true,
    orderReminders: true,
    pickupReminders: true,
  });

  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [presentAlert] = useIonAlert();
  const history = useHistory();

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

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
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchUserSettings();
    event.detail.complete();
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    const user = auth.currentUser;
    if (!user) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const settingsRef = doc(db, "userSettings", user.uid);
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

  const handleSignOut = () => {
    presentAlert({
      header: "Sign Out",
      message: "Are you sure you want to sign out?",
      buttons: [
        {
          text: "Cancel",
          role: "cancel",
        },
        {
          text: "Sign Out",
          role: "confirm",
          handler: async () => {
            try {
              await auth.signOut();
              history.replace("/login");
            } catch (error) {
              console.error("Error signing out:", error);
              setToastMessage("Failed to sign out");
              setShowToast(true);
            }
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader className="settings-header ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/account" />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="settings-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={refreshOutline}
            pullingText="Pull to refresh"
            refreshingSpinner="circles"
            refreshingText="Refreshing..."
          ></IonRefresherContent>
        </IonRefresher>

        {loading ? (
          <div className="settings-loading">
            <IonSpinner name="crescent" />
            <p>Loading settings...</p>
          </div>
        ) : (
          <div className="settings-container">
            <div className="settings-section">
              <h2 className="settings-section-title">Account</h2>
              <IonList className="settings-list">
                <IonItem
                  button
                  detail
                  lines="none"
                  className="settings-item"
                  routerLink="/change-password"
                >
                  <IonIcon
                    icon={lockClosedOutline}
                    slot="start"
                    className="settings-icon"
                  />
                  <IonLabel>Change Password</IonLabel>
                </IonItem>
              </IonList>
            </div>

            <div className="settings-section">
              <h2 className="settings-section-title">Notifications</h2>
              <IonList className="settings-list">
                <IonItem lines="full" className="settings-item">
                  <IonIcon
                    icon={notificationsOutline}
                    slot="start"
                    className="settings-icon"
                  />
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
                    <IonItem
                      lines="full"
                      className="settings-item notification-sub-item"
                    >
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
                    <IonItem
                      lines="full"
                      className="settings-item notification-sub-item"
                    >
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
                    <IonItem
                      lines="full"
                      className="settings-item notification-sub-item"
                    >
                      <IonLabel>Pickup Reminders</IonLabel>
                      <IonToggle
                        slot="end"
                        checked={settings.pickupReminders}
                        onIonChange={(e) =>
                          updateSetting("pickupReminders", e.detail.checked)
                        }
                      />
                    </IonItem>
                    <IonItem
                      lines="none"
                      className="settings-item notification-sub-item"
                    >
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
            </div>

            <div className="settings-section">
              <h2 className="settings-section-title">Support</h2>
              <IonList className="settings-list">
                <IonItem
                  button
                  detail
                  lines="full"
                  className="settings-item"
                  routerLink="/help"
                >
                  <IonIcon
                    icon={helpCircleOutline}
                    slot="start"
                    className="settings-icon"
                  />
                  <IonLabel>Help Center</IonLabel>
                </IonItem>
                <IonItem lines="full" className="settings-item" button>
                  <IonIcon
                    icon={callOutline}
                    slot="start"
                    className="settings-icon"
                  />
                  <IonLabel>Contact Us</IonLabel>
                  <IonNote slot="end">+63 916 123 4567</IonNote>
                </IonItem>
                <IonItem
                  lines="none"
                  className="settings-item"
                  button
                  detail
                  routerLink="/about"
                >
                  <IonIcon
                    icon={informationCircleOutline}
                    slot="start"
                    className="settings-icon"
                  />
                  <IonLabel>About BBNKA</IonLabel>
                </IonItem>
              </IonList>
            </div>

            <div className="settings-section">
              <div className="settings-sign-out-button">
                <IonButton
                  expand="block"
                  color="medium"
                  onClick={handleSignOut}
                >
                  <IonIcon slot="start" icon={powerOutline} />
                  Sign Out
                </IonButton>
              </div>
            </div>

            <div className="settings-footer">
              <p>BBNKA Mobile v1.0.2</p>
              <p>© 2025 BBNKA. All rights reserved.</p>
            </div>
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

export default Settings;
