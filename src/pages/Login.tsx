import {
  IonContent,
  IonHeader,
  IonPage,
  IonImg,
  IonText,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonRouterLink,
  useIonViewWillEnter,
  IonToast,
  IonLabel,
  IonRoute,
  IonFooter,
  IonToolbar,
} from "@ionic/react";
import {
  arrowForward,
  eye,
  eyeOff,
  eyeOutline,
  lockClosed,
  logInOutline,
  logoGoogle,
  mail,
  warningOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { db, auth } from "../firebase-config";
import {
  browserLocalPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { Storage } from "@capacitor/storage";
import "./Login.css";
import { Link } from "react-router-dom";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

const Login: React.FC = () => {
  const history = useHistory(); //for navigation
  const [loading, setLoading] = useState(false);

  // State variables for email and password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const googleProvider = new GoogleAuthProvider();

  const [showPassword, setShowPassword] = useState(false);

  // State variables for error messages
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isValidationError, setIsValidationError] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useIonViewWillEnter(() => {
    setEmail("");
    setPassword("");
    setEmailError("");
    setPasswordError("");
    setIsValidationError(false);
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateEmail = (email: string) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!email) {
      return "Email is required";
    } else if (!emailPattern.test(email)) {
      return "Please enter a valid email address";
    } else {
      return "";
    }
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return "Password is required";
    } else if (password.length < 8) {
      return "Password must be at least 8 characters";
    } else {
      return "";
    }
  };

  const handleLogin = async () => {
    // Validate email and password before proceeding
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    if (emailValidationError || passwordValidationError) {
      setEmailError(emailValidationError);
      setPasswordError(passwordValidationError);
      setIsValidationError(true);
      return;
    }

    try {
      // Clear previous errors
      setEmailError("");
      setPasswordError("");
      setIsValidationError(false);

      // Keep users logged in even after restarting or closing the app
      await setPersistence(auth, browserLocalPersistence);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const q = query(collection(db, "customers"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        history.replace("/home"); // Navigate to home page
      } else {
        setToastMessage(
          "Access Denied: Only customers can log in to the mobile app"
        );
        setIsSuccess(false);
        setShowToast(true);
        return;
      }
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);

      if (error.code === "auth/user-not-found") {
        setToastMessage("User not found");
        setIsSuccess(false);
        setShowToast(true);
      } else if (error.code === "auth/wrong-password") {
        setPasswordError("Incorrect password");
      } else if (error.code === "auth/invalid-email") {
        setEmailError("Invalid email format");
      } else if (error.code === "auth/too-many-requests") {
        setToastMessage(
          "Too many failed login attempts. Please try again later."
        );
        setIsSuccess(false);
        setShowToast(true);
      } else {
        setToastMessage("Invalid email or password");
        setIsSuccess(false);
        setShowToast(true);
      }
      setIsValidationError(true);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      setEmailError("");
      setPasswordError("");
      setIsValidationError(false);

      // Simple Firebase auth with popup
      const result = await FirebaseAuthentication.signInWithGoogle();
      console.log("User signed in:", result.user);

      if (result.credential) {
        const credential = GoogleAuthProvider.credential(
          result.credential.idToken,
          result.credential.accessToken
        );
        await signInWithCredential(auth, credential);
      }
    } catch (error) {
      console.error("Google login failed:", error);
      setToastMessage("Google login failed. Please try again.");
      setIsSuccess(false);
      setShowToast(true);
      setIsValidationError(true);
      setLoading(false);
    }
  };

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User signed in:", user.email);

        // Check if the user exists in Firestore
        const q = query(
          collection(db, "customers"),
          where("email", "==", user.email)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          console.log("User found in customers collection. Logging in...");
          history.replace("/home");
        } else {
          console.warn("User not found in customers collection:", user.email);
          console.log("New user detected. Creating account...");

          await setDoc(doc(db, "customers", user.uid), {
            email: user.email,
            name: user.displayName || "New User",
            createdAt: serverTimestamp(),
          });

          setToastMessage("Welcome! Your account has been created.");
          setIsSuccess(true);
          setShowToast(true);

          history.replace("/home"); // Redirect after registration
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <IonPage>
      <IonContent className="login-page" fullscreen>
        {/* <LoginContainer /> */}
        <div className="login-wrapper">
          <div className="login-img-wrapper">
            <IonImg
              className="login-img"
              src="./assets/bbnka_bg_11.png"
              alt="bbnka background image"
            />
          </div>
          <div className="login-container">
            <div className="login-form-container">
              <div className="login-title-wrapper">
                <IonText className="login-header">
                  Welcome to <strong>BBNKA</strong>
                </IonText>
                <IonText className="login-title">Sign In</IonText>
                <IonText className="login-subtitle">
                  Enter your email and password to continue
                </IonText>
              </div>

              <IonList>
                <div className="login-input-wrapper">
                  <IonItem
                    className={`login-item ${
                      isValidationError && emailError ? "input-error" : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="input-label" position="stacked">
                      Email Address
                    </IonLabel>
                    <IonInput
                      className="login-input"
                      type="email"
                      value={email}
                      placeholder="Enter your email address"
                      fill="outline"
                      onIonInput={(e) => {
                        const value = e.detail.value ?? "";
                        setEmail(value);
                        setEmailError(validateEmail(value)); // Validate email immediately
                      }}
                    >
                      <IonIcon icon={mail} slot="start"></IonIcon>
                    </IonInput>
                  </IonItem>

                  {emailError && isValidationError && (
                    <IonText color="danger" className="error-text">
                      <IonIcon icon={warningOutline} /> {emailError}
                    </IonText>
                  )}

                  <IonItem
                    className={`login-item ${
                      isValidationError && passwordError ? "input-error" : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="input-label" position="stacked">
                      Password
                    </IonLabel>
                    <IonInput
                      className="login-input"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      placeholder="Enter your password"
                      fill="outline"
                      onIonInput={(e) => {
                        const value = e.detail.value ?? "";
                        setPassword(value);
                        setPasswordError(validatePassword(value)); // Validate password immediately
                      }}
                    >
                      <IonIcon
                        icon={showPassword ? eye : eyeOff}
                        slot="end"
                        onClick={togglePasswordVisibility}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        style={{ cursor: "pointer", fontSize: "0.9rem" }}
                      ></IonIcon>
                      <IonIcon
                        className="lock-icon"
                        icon={lockClosed}
                        slot="start"
                      ></IonIcon>
                    </IonInput>
                  </IonItem>

                  {passwordError && isValidationError && (
                    <IonText color="danger" className="error-text">
                      <IonIcon icon={warningOutline} /> {passwordError}
                    </IonText>
                  )}
                </div>

                <div className="forgot-password-wrapper">
                  <IonButton fill="clear">
                    <IonRouterLink className="forgot-password">
                      Forgot Password?
                    </IonRouterLink>
                  </IonButton>
                </div>
                <div className="login-button-wrapper">
                  <IonButton
                    className="login-button"
                    expand="block"
                    onClick={handleLogin}
                  >
                    Login
                  </IonButton>
                  {/* Google Login Button */}
                  <div className="social-login-divider">
                    <div className="divider-line"></div>
                    <IonText className="divider-text">OR</IonText>
                    <div className="divider-line"></div>
                  </div>

                  <IonButton
                    className="google-login-button"
                    expand="block"
                    onClick={handleGoogleLogin}
                    color="light"
                  >
                    {loading ? (
                      <>
                        <IonIcon icon={logoGoogle} className="google-spinner" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <IonIcon icon={logoGoogle} />
                        Continue with Google
                      </>
                    )}
                  </IonButton>
                </div>
              </IonList>
            </div>

            <IonFooter className="register-text-footer">
              <IonToolbar className="register-text-toolbar">
                <div className="register-text-wrapper">
                  <IonText className="no-account-label">
                    Don't have an account yet?
                  </IonText>
                  <Link to="/register">
                    <IonButton fill="clear" className="register-text-button">
                      REGISTER
                    </IonButton>
                  </Link>
                </div>
              </IonToolbar>
            </IonFooter>
          </div>
        </div>
      </IonContent>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        color={isSuccess ? "success" : "danger"} // Green for success, Red for error
      />
    </IonPage>
  );
};

export default Login;
