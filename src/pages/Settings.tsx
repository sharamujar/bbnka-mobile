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
  IonSelect,
  IonSelectOption,
  IonToast,
} from "@ionic/react";
import {
  notificationsOutline,
  moonOutline,
  languageOutline,
  lockClosedOutline,
  phonePortraitOutline,
} from "ionicons/icons";
import { auth, db } from "../firebase-config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import "./Settings.css";

interface UserSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
  language: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    pushNotifications: true,
    emailNotifications: true,
    darkMode: false,
    language: "english",
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const fetchUserSettings = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userSettingsDoc = await getDoc(doc(db, "userSettings", user.uid));
        if (userSettingsDoc.exists()) {
          const data = userSettingsDoc.data() as UserSettings;
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchUserSettings();
  }, []);

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    const user = auth.currentUser;
    if (!user) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const settingsRef = doc(db, "userSettings", user.uid);
      await updateDoc(settingsRef, { [key]: value });

      // Apply settings immediately where needed
      if (key === "darkMode") {
        document.body.classList.toggle("dark", value);
      }

      setToastMessage("Settings updated");
      setShowToast(true);
    } catch (error) {
      console.error("Error updating settings:", error);
      setToastMessage("Failed to update settings");
      setShowToast(true);
    }
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
        <div className="settings-container">
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
              <IonItem lines="none" className="settings-item">
                <IonIcon
                  icon={notificationsOutline}
                  slot="start"
                  className="settings-icon"
                />
                <IonLabel>Email Notifications</IonLabel>
                <IonToggle
                  slot="end"
                  checked={settings.emailNotifications}
                  onIonChange={(e) =>
                    updateSetting("emailNotifications", e.detail.checked)
                  }
                />
              </IonItem>
            </IonList>
          </div>

          <div className="settings-section">
            <h2 className="settings-section-title">Appearance</h2>
            <IonList className="settings-list">
              <IonItem lines="none" className="settings-item">
                <IonIcon
                  icon={moonOutline}
                  slot="start"
                  className="settings-icon"
                />
                <IonLabel>Dark Mode</IonLabel>
                <IonToggle
                  slot="end"
                  checked={settings.darkMode}
                  onIonChange={(e) =>
                    updateSetting("darkMode", e.detail.checked)
                  }
                />
              </IonItem>
            </IonList>
          </div>

          <div className="settings-section">
            <h2 className="settings-section-title">Language</h2>
            <IonList className="settings-list">
              <IonItem lines="none" className="settings-item">
                <IonIcon
                  icon={languageOutline}
                  slot="start"
                  className="settings-icon"
                />
                <IonLabel>Language</IonLabel>
                <IonSelect
                  value={settings.language}
                  onIonChange={(e) => updateSetting("language", e.detail.value)}
                  interface="popover"
                  className="settings-select"
                >
                  <IonSelectOption value="english">English</IonSelectOption>
                  <IonSelectOption value="filipino">Filipino</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonList>
          </div>

          <div className="settings-section">
            <h2 className="settings-section-title">Security</h2>
            <IonList className="settings-list">
              <IonItem
                button
                detail
                lines="full"
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
              <IonItem
                button
                detail
                lines="none"
                className="settings-item"
                routerLink="/update-phone"
              >
                <IonIcon
                  icon={phonePortraitOutline}
                  slot="start"
                  className="settings-icon"
                />
                <IonLabel>Update Phone Number</IonLabel>
              </IonItem>
            </IonList>
          </div>

          <div className="settings-footer">
            <p>App Version 1.0.0</p>
          </div>
        </div>

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
