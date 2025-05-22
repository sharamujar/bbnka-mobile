import React from "react";
import { IonPage, IonContent, IonSpinner, IonText, IonImg } from "@ionic/react";
import "./SplashScreen.css";

const SplashScreen: React.FC = () => {
  return (
    <IonPage>
      <IonContent className="splash-screen">
        <div className="splash-container">
          {" "}
          <IonImg
            src="/assets/logo.png"
            alt="BBNKA Logo"
            className="splash-logo"
          />
          <IonText className="app-title">
            <span className="bbn-text">BBN</span>
            <span className="ka-text">KA</span>
          </IonText>
          <IonSpinner name="crescent" className="splash-spinner" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SplashScreen;
