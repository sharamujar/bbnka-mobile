import { IonAlert, IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import { signOut } from 'firebase/auth';
import React, { useState } from 'react'
import { useHistory } from 'react-router';
import { auth } from '../firebase-config';

const Account: React.FC = () => {
    const history = useHistory();

    // logout confirmation dialog
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            history.replace("/login"); //redirect to login page after logout
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const showLogoutConfirmation = () => {
        setShowLogoutConfirm(true);
    };

    return (
    <IonPage>
        <IonContent fullscreen>
            <IonHeader>
                <IonToolbar>
                    <IonTitle className='title-toolbar'>Account</IonTitle>
                </IonToolbar>
            </IonHeader>
            
            <IonButton 
                expand="full" 
                color="danger" 
                onClick={showLogoutConfirmation}>Logout
            </IonButton>
            <IonAlert
                isOpen={showLogoutConfirm}
                onDidDismiss={() => setShowLogoutConfirm(false)}
                header='Confirm Logout'
                message='Are you sure you want to logout?'
                buttons={[
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        handler: () => {
                            setShowLogoutConfirm(false);
                    },
                },
                    {
                    text: 'Logout',
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