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
  call,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { db, auth } from "../firebase-config";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithCredential,
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
  serverTimestamp,
} from "firebase/firestore";
// import { useKeyboardState } from '@ionic/react-hooks/keyboard';
import "./Registration.css";
import { Link, useHistory } from "react-router-dom";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

const Registration: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  // input fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const googleProvider = new GoogleAuthProvider();

  // error messages
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isValidationError, setIsValidationError] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false); //for toast message color

  const history = useHistory(); //for navigation
  const [loading, setLoading] = useState(false);

  useIonViewWillEnter(() => {
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");

    //clear registration error message
    setFirstNameError("");
    setLastNameError("");
    setPhoneNumberError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setIsValidationError(false);
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateFirstName = (firstName: string) => {
    if (!firstName) {
      return "First Name is required";
    } else if (firstName.length < 2) {
      return "First Name must be at least 2 characters";
    } else if (!/^[A-Za-z\s\-']+$/.test(firstName)) {
      return "First Name can only contain letters, spaces, hyphens and apostrophes";
    } else if (firstName.length > 30) {
      return "First Name cannot exceed 30 characters";
    } else {
      return "";
    }
  };

  const validateLastName = (lastName: string) => {
    if (!lastName) {
      return "Last Name is required";
    } else if (lastName.length < 2) {
      return "Last Name must be at least 2 characters";
    } else if (!/^[A-Za-z\s\-']+$/.test(lastName)) {
      return "Last Name can only contain letters, spaces, hyphens and apostrophes";
    } else if (lastName.length > 30) {
      return "Last Name cannot exceed 30 characters";
    } else {
      return "";
    }
  };

  const validatePhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) {
      return "Phone Number is required";
    }

    // Remove spaces, dashes and parentheses for validation
    const cleanedPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

    // Check if starts with +63
    if (!cleanedPhoneNumber.startsWith("+63")) {
      return "Phone number must start with +63";
    }

    // After +63 prefix, should have 10 digits (Philippine mobile format)
    const digitsPart = cleanedPhoneNumber.substring(3); // Skip the +63 part

    if (!/^[0-9]{10}$/.test(digitsPart)) {
      return "Please enter a valid mobile number";
    }

    return "";
  };

  const validateEmail = (email: string) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      return "Email is required";
    } else if (!emailPattern.test(email)) {
      return "Please enter a valid email address";
    } else if (email.length > 100) {
      return "Email address is too long";
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
    } else if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character";
    } else if (password.length > 128) {
      return "Password is too long (maximum 128 characters)";
    } else {
      return "";
    }
  };

  const validateConfirmPassword = (confirmPwd: string) => {
    if (!confirmPwd) {
      return "Please confirm your password";
    } else if (confirmPwd !== password) {
      return "Passwords do not match";
    } else {
      return "";
    }
  };

  const handleRegistration = async () => {
    setFirstNameError("");
    setLastNameError("");
    setPhoneNumberError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setIsValidationError(false);

    const firstNameValidationError = validateFirstName(firstName);
    const lastNameValidationError = validateLastName(lastName);
    const phoneNumberValidationError = validatePhoneNumber(phoneNumber);
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);
    const confirmPasswordValidationError =
      validateConfirmPassword(confirmPassword);

    if (
      firstNameValidationError ||
      lastNameValidationError ||
      phoneNumberValidationError ||
      emailValidationError ||
      passwordValidationError ||
      confirmPasswordValidationError
    ) {
      setFirstNameError(firstNameValidationError);
      setLastNameError(lastNameValidationError);
      setPhoneNumberError(phoneNumberValidationError);
      setEmailError(emailValidationError);
      setPasswordError(passwordValidationError);
      setConfirmPasswordError(confirmPasswordValidationError);
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

      // Format the full name properly with correct spacing
      const fullName = `${firstName} ${lastName}`.trim();

      const userRef = doc(db, "customers", user.uid);
      await setDoc(userRef, {
        firstName: firstName,
        lastName: lastName,
        name: fullName,
        phoneNumber: phoneNumber,
        email: user.email,
        uid: user.uid,
        createdAt: serverTimestamp(),
      });

      console.log("Registration Success!:", user);

      // Clear form fields
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Navigate to home page immediately
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

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      setEmailError("");
      setPasswordError("");
      setIsValidationError(false);

      // Simple Firebase auth with popup
      const result = await FirebaseAuthentication.signInWithGoogle();
      console.log("User signed in:", result.user);

      // Check if user exists already and if we have valid user data
      if (result.user && result.user.email) {
        const q = query(
          collection(db, "customers"),
          where("email", "==", result.user.email)
        );
        const querySnapshot = await getDocs(q);

        // If user doesn't exist yet, we need to check for a valid Philippine phone number
        if (
          querySnapshot.empty &&
          (!result.user.phoneNumber ||
            !result.user.phoneNumber.startsWith("+63"))
        ) {
          setToastMessage("Phone number is required to complete registration");
          setIsSuccess(false);
          setShowToast(true);

          // Show a modal or redirect to a page to collect phone number
          // For now, we'll just show a toast message
          setLoading(false);
          return;
        }
      }

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
          // If no phone number or not a Philippine phone number, we can't create account
          if (!user.phoneNumber || !user.phoneNumber.startsWith("+63")) {
            console.warn("Phone number required for registration");
            // TODO: Redirect to a page to collect phone number
            // For now we'll just sign out the user
            await auth.signOut();
            setToastMessage(
              "Phone number is required to complete registration"
            );
            setIsSuccess(false);
            setShowToast(true);
            return;
          }

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
                <IonText className="login-title">Sign Up</IonText>
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
                      onIonInput={(e) => {
                        const value = e.detail.value ?? "";
                        setFirstName(value);
                        setFirstNameError(validateFirstName(value));
                      }}
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
                      onIonInput={(e) => {
                        const value = e.detail.value ?? "";
                        setLastName(value);
                        setLastNameError(validateLastName(value));
                      }}
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
                      isValidationError && phoneNumberError ? "input-error" : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="input-label" position="stacked">
                      Phone Number
                    </IonLabel>
                    <IonInput
                      className="login-input"
                      type="tel"
                      placeholder="+63 9XX XXX XXXX"
                      value={phoneNumber}
                      fill="outline"
                      onIonInput={(e) => {
                        let value = e.detail.value ?? "";

                        // If the user hasn't entered the +63 prefix, add it
                        if (
                          value &&
                          !value.startsWith("+") &&
                          !value.startsWith("0")
                        ) {
                          value = "+63" + value;
                        } else if (value && value.startsWith("0")) {
                          // Convert 09XX format to +639XX format
                          value = "+63" + value.substring(1);
                        }

                        setPhoneNumber(value);
                        setPhoneNumberError(validatePhoneNumber(value)); // Validate immediately
                      }}
                    >
                      <IonIcon icon={call} slot="start"></IonIcon>
                    </IonInput>
                  </IonItem>
                  {phoneNumberError && (
                    <IonText color="danger" className="error-text">
                      <IonIcon icon={warningOutline} /> {phoneNumberError}
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
                      onIonInput={(e) => {
                        const value = e.detail.value ?? "";
                        setEmail(value);
                        setEmailError(validateEmail(value));
                      }}
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
                      onIonInput={(e) => {
                        const value = e.detail.value ?? "";
                        setPassword(value);
                        setPasswordError(validatePassword(value));
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

                  {passwordError && (
                    <IonText color="danger" className="error-text">
                      <IonIcon icon={warningOutline} /> {passwordError}
                    </IonText>
                  )}

                  <IonItem
                    className={`login-item ${
                      isValidationError && confirmPasswordError
                        ? "input-error"
                        : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="input-label" position="stacked">
                      Confirm Password
                    </IonLabel>
                    <IonInput
                      className="login-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      fill="outline"
                      onIonInput={(e) => {
                        const value = e.detail.value ?? "";
                        setConfirmPassword(value);
                        setConfirmPasswordError(validateConfirmPassword(value));
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

                  {confirmPasswordError && (
                    <IonText color="danger" className="error-text">
                      <IonIcon icon={warningOutline} /> {confirmPasswordError}
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
        duration={3000}
        color={isSuccess ? "success" : "danger"}
        position="middle"
        cssClass="registration-toast"
        buttons={[
          {
            text: "OK",
            role: "cancel",
          },
        ]}
      />
    </IonPage>
  );
};

export default Registration;
