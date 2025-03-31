import {
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonRouterLink,
  IonText,
  IonToast,
  IonToolbar,
  useIonViewDidEnter,
  useIonViewWillEnter,
} from "@ionic/react";
import {
  checkmarkCircleOutline,
  eye,
  eyeOff,
  lockClosed,
  logoGoogle,
  mail,
  person,
  personAddOutline,
  warningOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { db, auth } from "../firebase-config";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  setDoc,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
// import { useKeyboardState } from '@ionic/react-hooks/keyboard';
import "./Registration.css";
import { Link, useHistory } from "react-router-dom";

const Registration: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  // input fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const googleProvider = new GoogleAuthProvider();

  // error messages
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isValidationError, setIsValidationError] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false); //for toast message color

  const history = useHistory(); //for navigation
  const [loading, setLoading] = useState(false);

  useIonViewWillEnter(() => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");

    //clear registration error message
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setPasswordError("");
    setIsValidationError(false);
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateFirstName = (firstName: string) => {
    if (!firstName) {
      return "First Name is required";
    } else {
      return "";
    }
  };

  const validateLastName = (lastName: string) => {
    if (!lastName) {
      return "Last Name is required";
    } else {
      return "";
    }
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
    } else if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    } else if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character";
    } else {
      return "";
    }
  };

  const handleRegistration = async () => {
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setPasswordError("");
    setIsValidationError(false);

    const firstNameValidationError = validateFirstName(firstName);
    const lastNameValidationError = validateLastName(lastName);
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    if (
      firstNameValidationError ||
      lastNameValidationError ||
      emailValidationError ||
      passwordValidationError
    ) {
      setFirstNameError(firstNameValidationError);
      setLastNameError(lastNameValidationError);
      setEmailError(emailValidationError);
      setPasswordError(passwordValidationError);
      setIsValidationError(true);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userRef = doc(db, "customers", user.uid);
      await setDoc(userRef, {
        firstName,
        lastName,
        email: user.email,
        uid: user.uid,
        createdAt: new Date(),
      });

      console.log("Registration Success!:", user);
      setToastMessage("Registration Success!");
      setIsSuccess(true);
      setShowToast(true);

      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");

      history.replace("/home");
    } catch (error: any) {
      console.error("Registration Error", error.message);

      if (error.code === "auth/email-already-in-use") {
        setEmailError("Email is already in use");
      } else if (error.code === "auth/weak-password") {
        setPasswordError("Password should be at least 8 characters");
      } else {
        setPasswordError("Something went wrong. Please try again later");
      }
      setIsValidationError(true);
    }
  };

  const handleGoogleRegistration = async () => {
    setLoading(true);

    try {
      setEmailError("");
      setPasswordError("");
      setIsValidationError(false);

      await setPersistence(auth, browserLocalPersistence);

      // Redirect the user to Google sign-in
      await signInWithRedirect(auth, googleProvider);

      // No need to process user here; it will be handled after redirect
    } catch (error: any) {
      console.error("Google login failed:", error.code, error.message);

      if (error.code === "auth/popup-closed-by-user") {
        setToastMessage("Google Login canceled.");
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        setToastMessage("An account already exists with this email.");
      } else {
        setToastMessage("Google login failed. Please try again.");
      }

      setIsSuccess(false);
      setShowToast(true);
      setIsValidationError(true);
      setLoading(false);
    }
  };

  // Handle redirect result after returning to the app
  useEffect(() => {
    const checkGoogleSignIn = async () => {
      try {
        const result = await getRedirectResult(auth);

        if (result && result.user) {
          const user = result.user;
          console.log("User signed in:", user.email);

          // Query Firestore to check if the user exists in "customers"
          const q = query(
            collection(db, "customers"),
            where("email", "==", user.email)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            console.log("Existing customer found. Logging in...");
          } else {
            console.log("New user detected. Creating a customer record...");

            // Create a new customer document
            const customerRef = doc(db, "customers", user.uid);
            await setDoc(customerRef, {
              email: user.email,
              name: user.displayName || "New Customer",
              createdAt: new Date(),
            });

            console.log("New customer registered.");
          }

          setLoading(false);
          history.replace("/home");
        }
      } catch (error: any) {
        console.error("Error handling Google Redirect:", error);
      }
    };

    checkGoogleSignIn();
  }, []);

  return (
    <IonPage>
      <IonContent className="registration-page" fullscreen>
        <div className="registration-wrapper">
          <div className="register-img-wrapper">
            <IonImg
              className="register-img"
              src="/assets/bbnka_bg_11.png"
              alt="bbnka background image"
            />
          </div>
          <div className="register-container">
            <div className="register-form-container">
              <div className="register-title-wrapper">
                <IonText className="login-header">
                  Welcome to <strong>BBNKA</strong>
                </IonText>
                <IonText className="login-title">Register</IonText>
                <IonText className="login-subtitle">
                  Fill in the details to create an account
                </IonText>
              </div>

              <IonList>
                <div className="register-input-wrapper">
                  <IonItem
                    className={`login-item ${
                      isValidationError && firstNameError ? "input-error" : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="input-label" position="stacked">
                      First Name
                    </IonLabel>
                    <IonInput
                      className="login-input"
                      type="text"
                      placeholder="Enter your first name"
                      value={firstName}
                      fill="outline"
                      color={
                        isValidationError && firstNameError
                          ? "danger"
                          : "primary"
                      }
                      onIonInput={(e) => setFirstName(e.detail.value ?? "")}
                    >
                      <IonIcon icon={person} slot="start"></IonIcon>
                    </IonInput>
                  </IonItem>
                  {firstNameError && (
                    <IonText color="danger" className="error-text">
                      <IonIcon icon={warningOutline} /> {firstNameError}
                    </IonText>
                  )}

                  <IonItem
                    className={`login-item ${
                      isValidationError && lastNameError ? "input-error" : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="input-label" position="stacked">
                      Last Name
                    </IonLabel>
                    <IonInput
                      className="login-input"
                      type="text"
                      placeholder="Enter your last name"
                      value={lastName}
                      fill="outline"
                      onIonInput={(e) => setLastName(e.detail.value ?? "")}
                    >
                      <IonIcon icon={person} slot="start"></IonIcon>
                    </IonInput>
                  </IonItem>
                  {lastNameError && (
                    <IonText color="danger" className="error-text">
                      <IonIcon icon={warningOutline} /> {lastNameError}
                    </IonText>
                  )}

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
                      placeholder="Enter your email address"
                      value={email}
                      fill="outline"
                      onIonInput={(e) => setEmail(e.detail.value ?? "")}
                    >
                      <IonIcon icon={mail} slot="start"></IonIcon>
                    </IonInput>
                  </IonItem>

                  {emailError && (
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
                      placeholder="Enter your password"
                      value={password}
                      fill="outline"
                      onIonInput={(e) => setPassword(e.detail.value ?? "")}
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

                  {passwordError && (
                    <IonText color="danger" className="error-text">
                      <IonIcon icon={warningOutline} /> {passwordError}
                    </IonText>
                  )}
                </div>

                <div className="register-button-wrapper">
                  <IonButton
                    className="register-button"
                    expand="block"
                    onClick={handleRegistration}
                  >
                    Register
                  </IonButton>

                  {/* Google Registration Button */}
                  <div className="social-login-divider">
                    <div className="divider-line"></div>
                    <IonText className="divider-text">OR</IonText>
                    <div className="divider-line"></div>
                  </div>

                  <IonButton
                    className="google-login-button"
                    expand="block"
                    onClick={handleGoogleRegistration}
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
                    Already have an account?
                  </IonText>
                  <Link to="/login">
                    <IonButton
                      fill="clear"
                      className="register-text-button"
                      disabled={loading}
                    >
                      LOGIN
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
        duration={3000} // 3 seconds
        color={isSuccess ? "success" : "danger"} // Green for success, red for errors
      />
    </IonPage>
  );
};

export default Registration;
