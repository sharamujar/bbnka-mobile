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
  IonModal,
  IonSpinner,
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
  close,
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
  sendPasswordResetEmail,
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
import { useAuth } from "../contexts/AuthContext";

const Login: React.FC = () => {
  const { currentUser, isCustomer } = useAuth();
  const history = useHistory(); //for navigation
  const [loading, setLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false); // New state for login button loading

  // States for forgot password modal
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailError, setResetEmailError] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser && isCustomer) {
      history.replace("/home");
    }
  }, [currentUser, isCustomer, history]);

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

  // Clear form data when unmounting component
  useEffect(() => {
    // Clear form fields on unmount
    return () => {
      setEmail("");
      setPassword("");
      setEmailError("");
      setPasswordError("");
      setIsValidationError(false);
    };
  }, []);

  // Listen for navigation events to reset form before navigating
  useEffect(() => {
    const unlisten = history.listen(() => {
      // Clear form data immediately when navigation happens
      setEmail("");
      setPassword("");
      setEmailError("");
      setPasswordError("");
      setIsValidationError(false);
    });

    return () => {
      unlisten();
    };
  }, [history]);

  // Replace useIonViewWillEnter with useEffect to ensure it runs consistently
  useEffect(() => {
    setEmail("");
    setPassword("");
    setEmailError("");
    setPasswordError("");
    setIsValidationError(false);
  }, []); // Empty dependency array means this runs once on mount

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

    setIsLoggingIn(true);

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
        setIsLoggingIn(false); // Reset loading state
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
      setIsLoggingIn(false); // Reset loading state on error
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

      // We no longer need to check for phone number for Google SSO users
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
          // We no longer check for phone number for Google SSO users
          console.warn("User not found in customers collection:", user.email);
          console.log("New user detected. Creating account...");

          // For Google sign-in, properly format all name fields
          let firstName = "";
          let lastName = "";
          let fullName = "";

          if (user.displayName) {
            const nameParts = user.displayName.split(" ");
            firstName = nameParts[0] || "";
            lastName = nameParts.slice(1).join(" ") || "";
            fullName = user.displayName;
          }

          await setDoc(doc(db, "customers", user.uid), {
            email: user.email,
            firstName: firstName,
            lastName: lastName,
            name: fullName,
            phoneNumber: user.phoneNumber || "",
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

  // Update the navigation to register to use React Router without double navigation
  const navigateToRegister = (e: React.MouseEvent) => {
    // Prevent default button behavior
    e.preventDefault();

    // Clear form data
    setEmail("");
    setPassword("");
    setEmailError("");
    setPasswordError("");
    setIsValidationError(false);

    // Use React Router for smooth navigation without page refresh
    history.replace("/register");
  };

  // Handle forgot password modal opening
  const openForgotPasswordModal = () => {
    setResetEmail(email); // Pre-fill with current email if available
    setResetEmailError("");
    setShowForgotPasswordModal(true);
  };

  // Handle password reset
  const handleForgotPassword = async () => {
    // Validate email first
    const emailError = validateEmail(resetEmail);
    if (emailError) {
      setResetEmailError(emailError);
      return;
    }

    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setToastMessage("Password reset email sent. Check your inbox.");
      setIsSuccess(true);
      setShowToast(true);
      setShowForgotPasswordModal(false); // Close the modal
    } catch (error: any) {
      console.error("Password reset error:", error);
      if (error.code === "auth/user-not-found") {
        setToastMessage("No account found with this email address");
      } else {
        setToastMessage("Failed to send reset email. Try again later.");
      }
      setIsSuccess(false);
      setShowToast(true);
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="login-page" fullscreen>
        {/* <LoginContainer /> */}
        <div
          className="login-wrapper"
          style={{ paddingTop: "env(safe-area-inset-top, 20px)" }}
        >
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
                      isValidationError && emailError ? "login-input-error" : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="login-input-label" position="stacked">
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
                    <IonText color="danger" className="login-error-text">
                      <IonIcon icon={warningOutline} /> {emailError}
                    </IonText>
                  )}

                  <IonItem
                    className={`login-item ${
                      isValidationError && passwordError
                        ? "login-input-error"
                        : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="login-input-label" position="stacked">
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
                    <IonText color="danger" className="login-error-text">
                      <IonIcon icon={warningOutline} /> {passwordError}
                    </IonText>
                  )}
                </div>

                <div className="forgot-password-wrapper">
                  <IonButton fill="clear" onClick={openForgotPasswordModal}>
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
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <>
                        <IonSpinner name="dots" /> Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
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
                  <IonButton
                    fill="clear"
                    className="register-text-button"
                    onClick={(e) => navigateToRegister(e)}
                  >
                    REGISTER
                  </IonButton>
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

      {/* Forgot Password Modal */}
      <IonModal
        isOpen={showForgotPasswordModal}
        onDidDismiss={() => setShowForgotPasswordModal(false)}
        className="forgot-password-modal"
        breakpoints={[0, 0.4]}
        initialBreakpoint={0.4}
      >
        <div className="forgot-password-modal-content">
          <div className="forgot-password-modal-header">
            <h3>Reset Password</h3>
            <IonButton
              fill="clear"
              onClick={() => setShowForgotPasswordModal(false)}
            >
              <IonIcon icon={close} />
            </IonButton>
          </div>
          <p className="forgot-password-modal-message">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
          <div className="forgot-password-form">
            <IonItem className={resetEmailError ? "input-error" : ""}>
              <IonInput
                label="Email Address"
                labelPlacement="stacked"
                type="email"
                value={resetEmail}
                onIonInput={(e) => setResetEmail(e.detail.value || "")}
                placeholder="your@email.com"
              >
                <IonIcon icon={mail} slot="start"></IonIcon>
              </IonInput>
            </IonItem>
            {resetEmailError && (
              <IonText color="danger" className="reset-email-error">
                <IonIcon icon={warningOutline} /> {resetEmailError}
              </IonText>
            )}
            <IonButton
              expand="block"
              className="reset-password-button"
              onClick={handleForgotPassword}
              disabled={isResettingPassword}
            >
              {isResettingPassword ? (
                <>
                  <IonSpinner name="dots" /> Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </IonButton>
          </div>
        </div>
      </IonModal>
    </IonPage>
  );
};

export default Login;
