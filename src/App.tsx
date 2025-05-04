import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
  IonBadge,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { bag, home, notifications, person } from "ionicons/icons";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import Home from "./tabs/Home";
import Account from "./tabs/Account";
import Notifications from "./tabs/Notifications";
import Orders from "./tabs/Orders";
import OrderDetail from "./orders/OrderDetail";
import Cart from "./checkout/Cart";
import Payment from "./checkout/Payment";
import SplashScreen from "./pages/Splashscreen";
import Profile from "./account/Profile";
import Settings from "./account/Settings";
import Help from "./account/Help";
import ChangePassword from "./account/ChangePassword";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { pushNotificationService } from "./services/PushNotificationService";
import { notificationService } from "./services/NotificationService";
import About from "./account/About";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import EmailVerificationModal from "./components/EmailVerificationModal";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";
import "@ionic/react/css/structure.css";

/* Theme variables */
import "./theme/variables.css";
import "./theme/global.css";
import "./App.css";
import { StatusBar, Style } from "@capacitor/status-bar";
import Schedule from "./checkout/Schedule";
import Review from "./checkout/Review";

// Configure StatusBar immediately on app load
// try {
//   StatusBar.setStyle({ style: Style.Dark });
//   StatusBar.setBackgroundColor({ color: "#000000" });
//   StatusBar.show();
//   StatusBar.setOverlaysWebView({ overlay: true }); // Changed to true to allow content under status bar
// } catch (error) {
//   console.log("StatusBar not available on this platform");
// }

setupIonicReact();

// AppContent component to access AuthContext
const AppContent: React.FC = () => {
  const { currentUser, hasUnverifiedEmail, isLoading } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Check if we need to show the verification modal when app reopens
  useEffect(() => {
    // Only show the verification modal once auth is loaded and we have a user with unverified email
    if (!isLoading && currentUser && hasUnverifiedEmail) {
      setShowVerificationModal(true);
    }
  }, [isLoading, currentUser, hasUnverifiedEmail]);

  // Handle splash screen timing separately
  useEffect(() => {
    // Always show splash for exactly 3 seconds regardless of auth state
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Only fetch notifications when authenticated
  useEffect(() => {
    // Skip if not authenticated
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    // Subscribe to unread count changes from the NotificationService
    const unsubscribe = notificationService.onUnreadCountChange((count) => {
      setUnreadCount(count);
    });

    // Return cleanup function
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    // Initialize push notifications
    pushNotificationService.initialize().catch((error) => {
      console.error("Error initializing push notifications:", error);
    });
  }, []);

  // Show splash screen while loading or during initial 3 seconds
  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/">
            {currentUser ? <Redirect to="/home" /> : <Login />}
          </Route>
          <Route exact path="/register" key="register-route">
            {currentUser ? <Redirect to="/home" /> : <Registration />}
          </Route>
          <Route exact path="/login" key="login-route">
            {currentUser ? <Redirect to="/home" /> : <Login />}
          </Route>
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/home">
                {!currentUser ? <Redirect to="/login" /> : <Home />}
              </Route>
              <Route exact path="/orders">
                {!currentUser ? <Redirect to="/login" /> : <Orders />}
              </Route>
              <Route exact path="/orders/:id">
                {!currentUser ? <Redirect to="/login" /> : <OrderDetail />}
              </Route>
              <Route exact path="/notifications">
                {!currentUser ? <Redirect to="/login" /> : <Notifications />}
              </Route>
              <Route exact path="/account">
                {!currentUser ? <Redirect to="/login" /> : <Account />}
              </Route>
              <Route exact path="/home/cart">
                {!currentUser ? <Redirect to="/login" /> : <Cart />}
              </Route>
              <Route exact path="/home/cart/schedule">
                {!currentUser ? <Redirect to="/login" /> : <Schedule />}
              </Route>
              <Route exact path="/home/cart/schedule/payment">
                {!currentUser ? <Redirect to="/login" /> : <Payment />}
              </Route>
              <Route exact path="/home/cart/schedule/payment/review">
                {!currentUser ? <Redirect to="/login" /> : <Review />}
              </Route>
              <Route exact path="/profile">
                {!currentUser ? <Redirect to="/login" /> : <Profile />}
              </Route>
              <Route exact path="/settings">
                {!currentUser ? <Redirect to="/login" /> : <Settings />}
              </Route>
              <Route exact path="/change-password">
                {!currentUser ? <Redirect to="/login" /> : <ChangePassword />}
              </Route>
              <Route exact path="/help">
                {!currentUser ? <Redirect to="/login" /> : <Help />}
              </Route>
              <Route exact path="/about">
                {!currentUser ? <Redirect to="/login" /> : <About />}
              </Route>
              <Redirect from="/" to="/home" exact />
            </IonRouterOutlet>
            <IonTabBar slot="bottom">
              <IonTabButton tab="home" href="/home">
                <IonIcon icon={home} />
              </IonTabButton>
              <IonTabButton tab="orders" href="/orders">
                <IonIcon icon={bag} />
              </IonTabButton>
              <IonTabButton tab="notifications" href="/notifications">
                <IonIcon icon={notifications} />
                {unreadCount > 0 && (
                  <IonBadge color="danger" className="notification-badge">
                    {unreadCount}
                  </IonBadge>
                )}
              </IonTabButton>
              <IonTabButton tab="account" href="/account">
                <IonIcon icon={person} />
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonRouterOutlet>
      </IonReactRouter>

      {/* Email verification modal when reopening the app with unverified email */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </IonApp>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
