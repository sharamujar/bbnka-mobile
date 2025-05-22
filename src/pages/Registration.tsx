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
  IonSpinner,
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
  sendEmailVerification,
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
import { AuthProvider, useAuth } from "../contexts/AuthContext";

const Registration: React.FC = () => {
  const { markVerificationModalAsShown } = useAuth();
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
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingPhoneNumber, setIsCheckingPhoneNumber] = useState(false); // Check if we're currently validating the phone number

  // Email verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isInVerificationProcess, setIsInVerificationProcess] = useState(false);

  // Store registration data for after email verification
  const [registrationData, setRegistrationData] = useState<{
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string | null;
    uid: string;
  } | null>(null);

  // Clear form data when unmounting component
  useEffect(() => {
    // Clear form fields on unmount
    return () => {
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFirstNameError("");
      setLastNameError("");
      setPhoneNumberError("");
      setEmailError("");
      setPasswordError("");
      setConfirmPasswordError("");
      setIsValidationError(false);
    };
  }, []);

  // Listen for navigation events to reset form before navigating
  useEffect(() => {
    const unlisten = history.listen(() => {
      // Clear form data immediately when navigation happens
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFirstNameError("");
      setLastNameError("");
      setPhoneNumberError("");
      setEmailError("");
      setPasswordError("");
      setConfirmPasswordError("");
      setIsValidationError(false);
    });

    return () => {
      unlisten();
    };
  }, [history]);

  // Replace useIonViewWillEnter with useEffect to ensure it runs consistently
  useEffect(() => {
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstNameError("");
    setLastNameError("");
    setPhoneNumberError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setIsValidationError(false);
  }, []); // Empty dependency array means this runs once on mount

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateFirstName = (firstName: string) => {
    if (!firstName) {
      return "First Name is required";
    } else if (!/^[A-Za-z\s\-']+$/.test(firstName)) {
      return "First Name can only contain letters, spaces, hyphens and apostrophes";
    } else {
      return "";
    }
  };

  const validateLastName = (lastName: string) => {
    if (!lastName) {
      return "Last Name is required";
    } else if (!/^[A-Za-z\s\-']+$/.test(lastName)) {
      return "Last Name can only contain letters, spaces, hyphens and apostrophes";
    } else {
      return "";
    }
  };

  const validatePhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) {
      return "Phone Number is required";
    }

    const cleanedPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

    if (!cleanedPhoneNumber.startsWith("+63")) {
      return "Phone number must start with +63";
    }

    if (!cleanedPhoneNumber.startsWith("+639")) {
      return "After +63, the next digit must be 9";
    }

    const digitsPart = cleanedPhoneNumber.substring(3);

    if (!/^[0-9]{10}$/.test(digitsPart)) {
      return "Please enter a valid mobile number";
    }

    return "";
  };

  // Check if phone number already exists in database
  const checkPhoneNumberExists = async (phoneNumber: string) => {
    if (!phoneNumber) return false;

    const cleanedPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

    try {
      const q = query(
        collection(db, "customers"),
        where("phoneNumber", "==", cleanedPhoneNumber)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking phone number:", error);
      return false;
    }
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
    // Prevent multiple submissions
    if (isRegistering) return;

    setIsRegistering(true);
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
      setIsRegistering(false); // Reset registering state on validation error
      return;
    }

    // Check if phone number already exists
    setIsCheckingPhoneNumber(true);
    try {
      const phoneExists = await checkPhoneNumberExists(phoneNumber);
      if (phoneExists) {
        setPhoneNumberError("This phone number is already registered");
        setIsValidationError(true);
        setIsRegistering(false);
        setIsCheckingPhoneNumber(false);
        return;
      }
    } catch (error) {
      console.error("Error checking phone number:", error);
      // Continue with registration even if phone check fails
    } finally {
      setIsCheckingPhoneNumber(false);
    }

    try {
      // Set verification process flag to true
      setIsInVerificationProcess(true);

      // Create the user account but don't store in Firestore yet
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Send email verification immediately
      await sendEmailVerification(user);

      // Store verification email and show modal
      setVerificationEmail(email);

      // Format the full name properly with correct spacing
      const fullName = `${firstName} ${lastName}`.trim();

      console.log("About to store user data in Firestore with fields:", {
        firstName,
        lastName,
        name: fullName,
        phoneNumber,
        email: user.email || email,
        uid: user.uid,
        emailVerified: false,
      });

      // Store user data in Firestore immediately
      await setDoc(doc(db, "customers", user.uid), {
        firstName,
        lastName,
        name: fullName,
        phoneNumber,
        email: user.email || email,
        uid: user.uid,
        createdAt: serverTimestamp(),
        emailVerified: false, // Track verification status in Firestore
      });

      console.log("User data successfully stored in Firestore");

      // Store registration data in state for later use
      setRegistrationData({
        firstName,
        lastName,
        phoneNumber,
        email: user.email || email,
        uid: user.uid,
      });

      // Mark that we're showing the verification modal so it doesn't appear twice
      markVerificationModalAsShown();

      // Show the verification modal
      setShowVerificationModal(true);
    } catch (error: any) {
      // Set verification process flag to false on error
      setIsInVerificationProcess(false);
      console.error("Registration Error", error.message);

      if (error.code === "auth/email-already-in-use") {
        setEmailError("Email is already in use");
      } else if (error.code === "auth/weak-password") {
        setPasswordError("Password should be at least 8 characters");
      } else {
        setPasswordError("Something went wrong. Please try again later");
      }
      setIsValidationError(true);
      setIsRegistering(false); // Reset registering state on error
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

        // For Google sign-in, we don't need to validate phone number
        // User will be allowed to sign up without a phone number
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

        // Skip any redirections if the verification modal is already showing
        // This prevents the duplicate email verification popup
        if (showVerificationModal) {
          console.log(
            "Verification modal is already showing, skipping auth state handling"
          );
          return;
        }

        // Skip the phone number check if we're in the verification process
        if (isInVerificationProcess) {
          console.log("In verification process, skipping phone number check");
          return;
        }

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
          // For Google sign-in, we don't need to check for phone number anymore
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
            emailVerified: true, // Mark Google users as verified
          });

          setToastMessage("Welcome! Your account has been created.");
          setIsSuccess(true);
          setShowToast(true);

          history.replace("/home"); // Redirect after registration
        }
      }
    });

    return () => unsubscribe();
  }, [isInVerificationProcess, history, showVerificationModal]);

  // Update the Link to use history.push instead of direct Link
  const navigateToLogin = () => {
    // No need to clear fields manually - the Registration component will unmount
    // Just navigate directly without setTimeout
    history.replace("/login");
  };

  return (
    <IonPage>
      <IonContent className="registration-page" fullscreen>
        <div
          className="registration-wrapper"
          style={{ paddingTop: "env(safe-area-inset-top, 20px)" }}
        >
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
                      isValidationError && firstNameError
                        ? "login-input-error"
                        : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="login-input-label" position="stacked">
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
                    <IonText color="danger" className="login-error-text">
                      <IonIcon icon={warningOutline} /> {firstNameError}
                    </IonText>
                  )}

                  <IonItem
                    className={`login-item ${
                      isValidationError && lastNameError
                        ? "login-input-error"
                        : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="login-input-label" position="stacked">
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
                    <IonText color="danger" className="login-error-text">
                      <IonIcon icon={warningOutline} /> {lastNameError}
                    </IonText>
                  )}

                  <IonItem
                    className={`login-item ${
                      isValidationError && phoneNumberError
                        ? "login-input-error"
                        : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="login-input-label" position="stacked">
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
                    <IonText color="danger" className="login-error-text">
                      <IonIcon icon={warningOutline} /> {phoneNumberError}
                    </IonText>
                  )}

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
                    <IonText color="danger" className="login-error-text">
                      <IonIcon icon={warningOutline} /> {passwordError}
                    </IonText>
                  )}

                  <IonItem
                    className={`login-item ${
                      isValidationError && confirmPasswordError
                        ? "login-input-error"
                        : ""
                    }`}
                    lines="none"
                  >
                    <IonLabel className="login-input-label" position="stacked">
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
                    <IonText color="danger" className="login-error-text">
                      <IonIcon icon={warningOutline} /> {confirmPasswordError}
                    </IonText>
                  )}
                </div>

                <div className="register-button-wrapper">
                  <IonButton
                    className="register-button"
                    expand="block"
                    onClick={handleRegistration}
                    disabled={isRegistering || isCheckingPhoneNumber}
                  >
                    {isRegistering || isCheckingPhoneNumber ? (
                      <>
                        <IonSpinner name="dots" /> Registering...
                      </>
                    ) : (
                      "Register"
                    )}
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
                  <IonButton
                    fill="clear"
                    className="register-text-button"
                    disabled={loading}
                    onClick={navigateToLogin}
                  >
                    LOGIN
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
        duration={3000}
        color={isSuccess ? "success" : "danger"}
        position="bottom"
        cssClass="registration-toast"
        buttons={[
          {
            text: "OK",
            role: "cancel",
          },
        ]}
      />

      {/* Email Verification Modal */}
      <IonModal
        isOpen={showVerificationModal}
        backdropDismiss={false}
        onDidDismiss={() => {
          setShowVerificationModal(false);
          // Sign out the user if they close the modal without verifying
          auth.signOut();
          history.push("/login");
        }}
        className="verification-modal"
      >
        <div className="verification-modal-content">
          <div className="verification-icon">
            <IonIcon icon={mail} />
          </div>
          <h2>Verify Your Email</h2>
          <p>
            We've sent a verification email to: <br />
            <strong>{verificationEmail}</strong>
          </p>
          <p className="verification-instructions">
            Please check your inbox and click the verification link to activate
            your account. If you don't see the email, check your spam folder.
          </p>

          <div className="verification-buttons">
            <IonButton
              expand="block"
              className="check-verification-button"
              onClick={async () => {
                if (isVerifying) return;

                setIsVerifying(true);
                try {
                  // Reload the current user to check verification status
                  if (auth.currentUser) {
                    await auth.currentUser.reload();

                    if (auth.currentUser.emailVerified) {
                      // Email is verified, now ensure the Firestore document is properly updated
                      if (registrationData) {
                        const { firstName, lastName, phoneNumber, email, uid } =
                          registrationData;

                        // Format the full name properly with correct spacing
                        const fullName = `${firstName} ${lastName}`.trim();

                        // Update the document with all required fields consistently
                        await setDoc(doc(db, "customers", uid), {
                          firstName,
                          lastName,
                          name: fullName,
                          phoneNumber,
                          email,
                          uid,
                          emailVerified: true, // Mark as verified
                          createdAt: serverTimestamp(),
                          updatedAt: serverTimestamp(),
                        });

                        console.log(
                          "User profile updated after email verification"
                        );

                        // Show success toast and navigate to home
                        setToastMessage(
                          "Welcome! Your account has been verified."
                        );
                        setIsSuccess(true);
                        setShowToast(true);

                        // Close modal and navigate to home
                        setShowVerificationModal(false);
                        history.replace("/home");
                      }
                    } else {
                      // Not verified yet
                      setToastMessage(
                        "Email not verified yet. Please check your inbox and click the verification link."
                      );
                      setIsSuccess(false);
                      setShowToast(true);
                    }
                  }
                } catch (error) {
                  console.error("Error checking verification status:", error);
                  setToastMessage(
                    "Failed to check verification status. Please try again."
                  );
                  setIsSuccess(false);
                  setShowToast(true);
                } finally {
                  setIsVerifying(false);
                }
              }}
              disabled={isVerifying}
            >
              {isVerifying ? "Checking..." : "I've Verified My Email"}
            </IonButton>

            <IonButton
              expand="block"
              className="resend-email-button"
              onClick={async () => {
                if (isResendingEmail) return;

                setIsResendingEmail(true);
                try {
                  // Current user should be the one who just registered
                  const user = auth.currentUser;
                  if (user) {
                    await sendEmailVerification(user);
                    setToastMessage("Verification email resent!");
                    setIsSuccess(true);
                    setShowToast(true);
                  }
                } catch (error) {
                  console.error("Error resending verification email:", error);
                  setToastMessage("Failed to resend verification email");
                  setIsSuccess(false);
                  setShowToast(true);
                } finally {
                  setIsResendingEmail(false);
                }
              }}
              disabled={isResendingEmail}
            >
              {isResendingEmail ? "Sending..." : "Resend Verification Email"}
            </IonButton>
          </div>
        </div>
      </IonModal>
    </IonPage>
  );
};

export default Registration;
