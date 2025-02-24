import { IonButton, IonContent, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonList, IonModal, IonPage, IonRouterLink, IonText, IonToast, useIonViewDidEnter, useIonViewWillEnter } from '@ionic/react';
import { checkmarkCircleOutline, eye, eyeOff, lockClosed, mail, person, warningOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { db, auth } from '../firebase-config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';
// import { useKeyboardState } from '@ionic/react-hooks/keyboard';
import './Registration.css';

const Registration: React.FC = () => {

    const [showPassword, setShowPassword] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isValidationError, setIsValidationError] = useState(false);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // const [ isSuccessModalOpen, setIsSuccessModalOpen ] = useState(false);

    useIonViewWillEnter(() => {
        setFirstName(''); //clear input fields
        setLastName(''); //clear input fields
        setEmail(''); //clear input fields 
        setPassword(''); //clear input fields

        //clear registration error message
        setFirstNameError('');
        setLastNameError('');
        setEmailError('');
        setPasswordError('');
        setIsValidationError(false);
      });

    //   display and hide password
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
      };

    // input fields validation
    const validateFirstName = (firstName: string) => {
        if (!firstName) {
            return('First Name is required');
        } else {
            return('');
        }
    };

    const validateLastName = (lastName: string) => {
        if (!lastName) {
            return('Last Name is required');
        } else {
            return('');
        }
    };

    const validateEmail = (email: string) => {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if (!email) {
          return('Email is required');
        } else if (!emailPattern.test(email)) {
          return('Please enter a valid email address');
        } else {
          return('');
        }
      };
    
      const validatePassword = (password: string) => {
        if (!password) {
            return('Password is required');
        } else if (password.length < 8) {
            return('Password must be at least 8 characters');
        } else if (!/[A-Z]/.test(password)) {
            return('Password must contain at least one uppercase letter');
        } else if (!/[0-9]/.test(password)) {
            return('Password must contain at least one number');
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return('Password must contain at least one special character');
        } else {
            return('');
        }
    };

    const handleRegistration = async () => {
        setFirstNameError('');
        setLastNameError('');
        setEmailError('');
        setPasswordError('');
        setIsValidationError(false);

        const firstNameValidationError = validateFirstName(firstName);
        const lastNameValidationError = validateLastName(lastName);
        const emailValidationError = validateEmail(email);
        const passwordValidationError = validatePassword(password);

        if (firstNameValidationError || lastNameValidationError || emailValidationError || passwordValidationError) {
            setFirstNameError(firstNameValidationError);
            setLastNameError(lastNameValidationError);
            setEmailError(emailValidationError);
            setPasswordError(passwordValidationError);
            setIsValidationError(true);
            return;
        }

    // save to database
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Registration Success!:', user);
        setToastMessage('Registration Success!');
        setShowToast(true);

        await addDoc(collection(db, 'customers'), {
            firstName,
            lastName,
            email: user.email,
            uid: user.uid,
            createdAt: new Date(),
        });

        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');

        // setIsSuccessModalOpen(true); //shows success modal

    } catch (error: any) {
        console.error('Registration Error', error.message);

        if (error.code === 'auth/email-already-in-use') {
            setEmailError('Email is already in use');
        } else if (error.code === 'auth/weak-password') {
            setPasswordError('Password should be at least 8 characters');
        } else {
            setPasswordError('Something went wrong. Please try again later');
        }

        setIsValidationError(true);
    }
};

return (
    <IonPage>
      <IonContent className='registration-page' fullscreen>
        <div className='registration-wrapper'>
            <div className='register-img-wrapper'>
                <IonImg 
                    className='register-img'
                    src='/assets/bbnka_bg_11.png'
                    alt="bbnka background image"/>
            </div>
            <div className='register-container'>
                <div className='register-title-wrapper'>
                    <IonText className='login-header'>
                        Welcome to <strong>BBNKA</strong>
                    </IonText>
                    <IonText className='login-title'>
                        Sign Up
                    </IonText>
                    <IonText className='login-subtitle'>
                        Fill in the details to create an account
                    </IonText>
                </div>
                
                <IonList>
                    <div className='register-input-wrapper'>
                        <IonItem className={`login-item ${isValidationError && firstNameError ? 'input-error' : ''}`} lines='none'>
                            <IonLabel className="input-label" position="stacked">First Name</IonLabel>
                            <IonInput 
                                className='login-input'
                                type='text'
                                placeholder='Enter your first name'
                                value={firstName}
                                fill='outline'
                                color={isValidationError && firstNameError ? 'danger' : 'primary'}
                                onIonChange={(e) => setFirstName(e.detail.value ?? '')}>
                                <IonIcon icon={person} slot='start'></IonIcon>
                            </IonInput>
                        </IonItem>
                        {firstNameError && (
                            <IonText color="danger" className="error-text">
                                <IonIcon icon={warningOutline} /> {firstNameError}
                            </IonText>
                        )}

                        <IonItem className={`login-item ${isValidationError && lastNameError ? 'input-error' : ''}`} lines='none'>
                        <IonLabel className="input-label" position="stacked">Last Name</IonLabel>
                            <IonInput 
                                className='login-input'
                                type='text'
                                placeholder='Enter your last name'
                                value={lastName}
                                fill='outline'
                                onIonChange={(e) => setLastName(e.detail.value ?? '')}>
                                <IonIcon icon={person} slot='start'></IonIcon>
                            </IonInput>
                        </IonItem>
                        {lastNameError && (
                            <IonText color="danger" className="error-text">
                                <IonIcon icon={warningOutline} /> {lastNameError}
                            </IonText>
                        )}

                        <IonItem className={`login-item ${isValidationError && emailError ? 'input-error' : ''}`} lines='none'>
                            <IonLabel className="input-label" position="stacked">Email Address</IonLabel>
                            <IonInput 
                                className='login-input'
                                type='email'
                                placeholder='Enter your email address'
                                value={email}
                                fill='outline'
                                onIonChange={(e) => setEmail(e.detail.value ?? '')}>
                                <IonIcon icon={mail} slot='start'></IonIcon>
                            </IonInput>
                        </IonItem>

                        {emailError && (
                            <IonText color="danger" className="error-text">
                                <IonIcon icon={warningOutline} /> {emailError}
                            </IonText>
                        )}

                        <IonItem className={`login-item ${isValidationError && passwordError ? 'input-error' : ''}`} lines='none'>
                            <IonLabel className="input-label" position="stacked">Password</IonLabel>
                            <IonInput 
                                className='login-input'
                                type={showPassword ? 'text' : 'password'}
                                placeholder='Enter your password'
                                value={password}
                                fill='outline'
                                onIonChange={(e) => setPassword(e.detail.value ?? '')}
                            >
                                <IonIcon 
                                    icon={showPassword ? eye : eyeOff}
                                    slot='end' 
                                    onClick={togglePasswordVisibility}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{cursor : 'pointer', fontSize: '0.9rem'}}>
                                </IonIcon>
                                <IonIcon className="lock-icon" icon={lockClosed} slot='start'></IonIcon>
                            </IonInput>
                        </IonItem>

                        {passwordError && (
                            <IonText color="danger" className="error-text">
                                <IonIcon icon={warningOutline} /> {passwordError}
                            </IonText>
                        )}
                    </div>

                    <IonButton 
                        className='register-button' 
                        expand='block'
                        onClick={handleRegistration}>
                            REGISTER
                    </IonButton>
                    <div className='login-text-wrapper'>
                        <IonText className='no-account-label'>Already have an account?</IonText>
                        <IonRouterLink routerLink='/login'>
                            <IonButton 
                                fill='clear' 
                                className='register-text-button'>LOGIN
                            </IonButton>
                        </IonRouterLink>

                        <IonToast
                            isOpen={showToast}
                            onDidDismiss={() => setShowToast(false)}
                            message={toastMessage}
                            duration={2000}  // Toast disappears after 2 seconds
                            color="success"  // Green color for success messages
                        />
                    </div>
                </IonList>
            </div>
        </div>
      </IonContent>
      
      {/* <IonModal isOpen={isSuccessModalOpen} backdropDismiss={false} className="success-modal">
            <div className="modal-content">
                <IonIcon icon={checkmarkCircleOutline} className="success-icon" />
                <IonText className="success-text">
                    Success!
                </IonText>
                <IonText className="success-subtext">
                    Your account has been successfully created
                </IonText>
                <IonRouterLink routerLink="/login">
                    <IonButton onClick={() => setIsSuccessModalOpen(false)}>
                        Go to Login
                    </IonButton>
                </IonRouterLink>
            </div>
        </IonModal> */}

    </IonPage>    
);
};

export default Registration;