import { IonContent, IonHeader, IonPage, IonImg, IonText, IonList, IonItem, IonInput, IonButton, IonIcon, IonRouterLink, useIonViewWillEnter, IonToast, IonLabel } from '@ionic/react';
import { eye, eyeOff, eyeOutline, lockClosed, mail, warningOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router';
import { db, auth } from '../firebase-config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
  const [isSuccess, setIsSuccess] = useState(false); //for toast message color

  const history = useHistory(); //for navigation

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
    } else if (password.length < 8) {
        return('Password must be at least 8 characters');
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

      //clear login error message after successful login
      setEmailError('');
      setPasswordError('');
      setIsValidationError(false);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const q = query(collection(db, "customers"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        history.push('/home');
        // setToastMessage("Customer found!");
        // setIsSuccess(true);
        // setShowToast(true);
      } else {
        setToastMessage("Access Denied: Only customers can log in to the mobile app");
        setIsSuccess(false);
        setShowToast(true);
        return;
      }
      
    } catch (error: any) {
        console.error('Login error:', error.code, error.message);
      
        if (error.code === 'auth/user-not-found') {
          setToastMessage('User not found');
          setIsSuccess(false);
          setShowToast(true);
        } else if (error.code === 'auth/wrong-password') {
          setPasswordError('Incorrect password');
        } else if (error.code === 'auth/invalid-email') {
          setEmailError('Invalid email format');
        } else if (error.code === 'auth/too-many-requests') {
        //   setLoginError('Too many failed login attempts. Please try again later.');
          setToastMessage('Too many failed login attempts. Please try again later.');
          setIsSuccess(false);
          setShowToast(true);
        } else {
          setToastMessage('Invalid email or password');
          setIsSuccess(false);
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
                            <IonLabel className="input-label" position="stacked">Email Address</IonLabel>
                              <IonInput 
                                  className='login-input'
                                  type='email'
                                  value={email}
                                  placeholder='Enter your email address'
                                  fill='outline'
                                  onIonChange={(e) => {
                                      const value = e.detail.value ?? '';
                                      setEmail(value);
                                  }}>
                                  <IonIcon icon={mail} slot='start'></IonIcon>
                              </IonInput>
                        </IonItem>

                        {emailError && isValidationError && (
                            <IonText color='danger' className='error-text'>
                                <IonIcon icon={warningOutline} /> {emailError}
                            </IonText>
                        )}

                        <IonItem className={`login-item ${isValidationError && passwordError ? 'input-error' : ''}`} lines='none'>
                          <IonLabel className="input-label" position="stacked">Password</IonLabel>
                            <IonInput 
                                className='login-input'
                                type={showPassword ? 'text' : 'password'}
                                value={password} 
                                placeholder='Enter your password'
                                fill='outline'
                                onIonChange={(e) => 
                                    setPassword(e.detail.value ?? '')}
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
                            color={isSuccess ? "success" : "danger"}  // Green for success, Red for error
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
