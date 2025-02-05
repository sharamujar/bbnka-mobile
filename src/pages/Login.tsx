import { IonContent, IonHeader, IonPage, IonImg, IonText, IonList, IonItem, IonInput, IonButton, IonIcon, IonRouterLink, useIonViewWillEnter, IonToast } from '@ionic/react';
import { eye, eyeOff, eyeOutline, lockClosed, warningOutline } from 'ionicons/icons';
import { useState } from 'react';
import { db, auth } from '../firebase-config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import './Login.css';

const Login: React.FC = () => {

  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');  
//   const [loginError, setLoginError] = useState('');
  const [isValidationError, setIsValidationError] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useIonViewWillEnter(() => {
    setEmail(''); //clear email input field
    setPassword(''); //clear password input field
    //clear login error message
    setEmailError('');
    setPasswordError('');
    setIsValidationError(false);
  });

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
    } else if (password.length < 6) {
        return('Password must be at least 6 characters');
    } else {
        return('');
    }
};

  const handleLogin = async () => {
    //clear login error message
    setEmailError('');
    setPasswordError('');
    setIsValidationError(false);

    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    if (emailValidationError || passwordValidationError) {
      setEmailError(emailValidationError);
      setPasswordError(passwordValidationError);
      setIsValidationError(true);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      //clear login error message after successful login
      setEmailError('');
      setPasswordError('');
    //   setLoginError('');
      setIsValidationError(false);
      
    } catch (error: any) {
        console.error('Login error:', error.code, error.message);
      
        if (error.code === 'auth/user-not-found') {
          setEmailError('User not found');
        } else if (error.code === 'auth/wrong-password') {
          setPasswordError('Incorrect password');
        } else if (error.code === 'auth/invalid-email') {
          setEmailError('Invalid email format');
        } else if (error.code === 'auth/too-many-requests') {
        //   setLoginError('Too many failed login attempts. Please try again later.');
          setToastMessage('Too many failed login attempts. Please try again later.');
          setShowToast(true);
        } else {
          setToastMessage('Invalid email or password');
          setShowToast(true);
        }
      
        setIsValidationError(true);
    }
};

  return (
    <IonPage>
      <IonContent className='login-page' fullscreen>
        {/* <LoginContainer /> */}
        <div className='login-wrapper'>
            <div className='login-img-wrapper'>
                <IonImg 
                    className='login-img'
                    src='./assets/bbnka_bg_11.png'
                    alt="bbnka background image"/>
            </div>
            <div className='login-container'>
                <div className='login-title-wrapper'>
                    <IonText className='login-header'>
                        Welcome to <strong>BBNKA</strong>
                    </IonText>
                    <IonText className='login-title'>
                        Sign In
                    </IonText>
                    <IonText className='login-subtitle'>
                        Enter your email and password to continue
                    </IonText>
                </div>
                
                <IonList>
                    <div className='login-input-wrapper'>
                        <IonItem className={`login-item ${isValidationError && emailError ? 'input-error' : ''}`} lines='none'>
                            <IonInput 
                                className='login-input'
                                type='email'
                                value={email}
                                placeholder='Email Address'
                                fill='outline'
                                onIonChange={(e) => {
                                    const value = e.detail.value ?? '';
                                    setEmail(value);
                                }}
                            />
                        </IonItem>

                        {emailError && isValidationError && (
                            <IonText color='danger' className='error-text'>
                                <IonIcon icon={warningOutline} /> {emailError}
                            </IonText>
                        )}

                        <IonItem className={`login-item ${isValidationError && passwordError ? 'input-error' : ''}`} lines='none'>
                            <IonInput 
                                className='login-input'
                                type={showPassword ? 'text' : 'password'}
                                value={password} 
                                placeholder='Password'
                                fill='outline'
                                onIonChange={(e) => 
                                    setPassword(e.detail.value ?? '')}
                                >
                                <IonIcon 
                                    icon={showPassword ? eye : eyeOff}
                                    slot='end' 
                                    onClick={togglePasswordVisibility}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{cursor : 'pointer', fontSize: '1.2rem'}}>
                                </IonIcon>
                            </IonInput>
                            
                        </IonItem>

                        {passwordError && isValidationError && (
                            <IonText color='danger' className='error-text'>
                                    <IonIcon icon={warningOutline} /> {passwordError}
                            </IonText>
                        )}

                        {/* {loginError && isValidationError && (
                        <IonText color='danger' className='error-text'>
                            <IonIcon icon={warningOutline} /> {loginError}
                        </IonText>
                        )} */}
                    </div>

                    <div className='forgot-password-wrapper'>
                        <IonButton 
                            fill='clear' 
                            className='forgot-password'
                            >Forgot Password?
                        </IonButton>
                    </div>
                    <div className='login-button-wrapper'>
                        <IonButton 
                            className='login-button' 
                            expand='block'
                            onClick={handleLogin}>LOGIN</IonButton>
                    </div>
                    <div className='register-text-wrapper'>
                        <IonText className='no-account-label'>Don't have an account yet?</IonText>
                        <IonRouterLink routerLink='/register'>
                            <IonButton 
                                fill='clear' 
                                className='register-text-button'>REGISTER
                            </IonButton>
                        </IonRouterLink>

                        <IonToast
                            isOpen={showToast}
                            onDidDismiss={() => setShowToast(false)}
                            message={toastMessage}
                            duration={2000}  // Toast disappears after 2 seconds
                            color="danger"  // red color for success messages
                        />
                    </div>
                </IonList>
            </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
