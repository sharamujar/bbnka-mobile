import { IonButton, IonContent, IonPage } from '@ionic/react'
import { signOut } from 'firebase/auth';
import React from 'react'
import { useHistory } from 'react-router';
import { auth } from '../../firebase-config';

const Account: React.FC = () => {
    const history = useHistory();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            history.replace("/login"); //redirect to login page after logout
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
    <IonPage>
        <IonContent fullscreen>
            <h1>Account</h1>
            <IonButton expand="full" color="danger" onClick={handleLogout}>
                Logout
            </IonButton>
        </IonContent>
    </IonPage>
  );
};

export default Account;