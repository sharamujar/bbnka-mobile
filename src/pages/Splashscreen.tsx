import React from "react";
import { IonPage, IonContent, IonSpinner, IonText } from "@ionic/react";
import "./SplashScreen.css";

const SplashScreen: React.FC = () => {
  return (
    <IonPage>
      <IonContent className="splash-screen">
        <div className="splash-container">
          <IonText className="app-title">BBNKA</IonText>
          <IonSpinner name="crescent" className="splash-spinner" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SplashScreen;
