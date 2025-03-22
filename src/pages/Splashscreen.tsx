import React, { useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonImg,
  IonSpinner,
  IonTitle,
  IonText,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import "./SplashScreen.css";

const SplashScreen: React.FC = () => {
  const history = useHistory();
  const auth = getAuth();

  useEffect(() => {
    const checkAuth = async () => {
      console.log("Splash screen displayed");

      const timeoutDuration = await new Promise((resolve) => {
        onAuthStateChanged(auth, (user: User | null) => {
          const duration = user ? 1000 : 5000;
          setTimeout(() => resolve(duration), duration);
        });
      });

      console.log("Checking authentication state");

      onAuthStateChanged(auth, (user: User | null) => {
        if (user) {
          console.log("User is authenticated, navigating to home");
          history.replace("/home");
        } else {
          console.log("User is not authenticated, navigating to login");
          history.replace("/login");
        }
      });
    };

    checkAuth();
  }, [history, auth]);

  return (
    <IonPage>
      <IonContent className="splash-screen">
        <div className="splash-container">
          <IonTitle className="splash-title">BBNKA</IonTitle>
          <IonText className="splash-subtitle">
            Aling Kika's Food Products
          </IonText>
          {/* <IonSpinner name="crescent" className="splash-spinner" /> */}
        </div>
        <div className="splash-image-container">
          <IonImg
            src="assets/bbnka-bg-transparent.png"
            alt="BBNKA Logo"
            className="splash-image"
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SplashScreen;
