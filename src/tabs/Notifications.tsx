import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonToast,
} from "@ionic/react";
import BuildYourOwnModal from "../components/BuildYourOwnModal";

const Notifications: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    success: boolean;
    show: boolean;
  }>({
    message: "",
    success: false,
    show: false,
  });

  const handleShowToastMessage = (message: string, success: boolean) => {
    setToastMessage({
      message,
      success,
      show: true,
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Kakanin Shop</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Welcome to our Kakanin Shop</h1>
        <p>Discover authentic Filipino kakanin desserts</p>

        <IonButton expand="block" onClick={() => setShowModal(true)}>
          Build Your Own Kakanin
        </IonButton>

        {/* Build Your Own Modal */}
        <BuildYourOwnModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          showToastMessage={handleShowToastMessage}
        />

        {/* Toast Message */}
        <IonToast
          isOpen={toastMessage.show}
          onDidDismiss={() => setToastMessage({ ...toastMessage, show: false })}
          message={toastMessage.message}
          duration={2000}
          color={toastMessage.success ? "success" : "danger"}
        />
      </IonContent>
    </IonPage>
  );
};

export default Notifications;
