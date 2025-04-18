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
import { AuthProvider } from "./contexts/AuthContext";

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
try {
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: "#000000" });
  StatusBar.show();
  StatusBar.setOverlaysWebView({ overlay: true }); // Changed to true to allow content under status bar
} catch (error) {
  console.log("StatusBar not available on this platform");
}

setupIonicReact();

const App: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
    // Skip if not authenticated or authentication state is still unknown
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Subscribe to unread count changes from the NotificationService
    const unsubscribe = notificationService.onUnreadCountChange((count) => {
      setUnreadCount(count);
    });

    // Return cleanup function
    return () => unsubscribe();
  }, [isAuthenticated]); // Add isAuthenticated as a dependency

  useEffect(() => {
    // Initialize push notifications
    pushNotificationService.initialize().catch((error) => {
      console.error("Error initializing push notifications:", error);
    });
  }, []);

  // Refresh StatusBar config when app component mounts
  useEffect(() => {
    try {
      // Re-apply StatusBar settings to ensure they take effect
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: "#000000" });
      StatusBar.show();
      StatusBar.setOverlaysWebView({ overlay: true }); // Changed to true to allow content under status bar
    } catch (error) {
      console.log("StatusBar not available on this platform");
    }
  }, []);

  // Show splash screen while loading or during initial 3 seconds
  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      {" "}
      {/* Wrap entire app with AuthProvider */}
      <IonApp>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/">
              {isAuthenticated ? <Redirect to="/home" /> : <Login />}
            </Route>
            <Route exact path="/register" key="register-route">
              {isAuthenticated ? <Redirect to="/home" /> : <Registration />}
            </Route>
            <Route exact path="/login" key="login-route">
              {isAuthenticated ? <Redirect to="/home" /> : <Login />}
            </Route>
            <IonTabs>
              <IonRouterOutlet>
                <Route exact path="/home">
                  {!isAuthenticated ? <Redirect to="/login" /> : <Home />}
                </Route>
                <Route exact path="/orders">
                  {!isAuthenticated ? <Redirect to="/login" /> : <Orders />}
                </Route>
                <Route exact path="/orders/:id">
                  {!isAuthenticated ? (
                    <Redirect to="/login" />
                  ) : (
                    <OrderDetail />
                  )}
                </Route>
                <Route exact path="/notifications">
                  {!isAuthenticated ? (
                    <Redirect to="/login" />
                  ) : (
                    <Notifications />
                  )}
                </Route>
                <Route exact path="/account">
                  {!isAuthenticated ? <Redirect to="/login" /> : <Account />}
                </Route>
                <Route exact path="/home/cart">
                  {!isAuthenticated ? <Redirect to="/login" /> : <Cart />}
                </Route>
                <Route exact path="/home/cart/schedule">
                  {!isAuthenticated ? <Redirect to="/login" /> : <Schedule />}
                </Route>
                <Route exact path="/home/cart/schedule/payment">
                  {!isAuthenticated ? <Redirect to="/login" /> : <Payment />}
                </Route>
                <Route exact path="/home/cart/schedule/payment/review">
                  {!isAuthenticated ? <Redirect to="/login" /> : <Review />}
                </Route>
                <Route exact path="/profile">
                  {!isAuthenticated ? <Redirect to="/login" /> : <Profile />}
                </Route>
                <Route exact path="/settings">
                  {!isAuthenticated ? <Redirect to="/login" /> : <Settings />}
                </Route>
                <Route exact path="/change-password">
                  {!isAuthenticated ? (
                    <Redirect to="/login" />
                  ) : (
                    <ChangePassword />
                  )}
                </Route>
                <Route exact path="/help">
                  {!isAuthenticated ? <Redirect to="/login" /> : <Help />}
                </Route>
                <Route exact path="/about">
                  {!isAuthenticated ? <Redirect to="/login" /> : <About />}
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
      </IonApp>
    </AuthProvider>
  );
};

export default App;
