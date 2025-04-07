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
import OrderDetail from "./pages/OrderDetail";
import Cart from "./checkout/Cart";
import Payment from "./checkout/Payment";
import SplashScreen from "./pages/Splashscreen";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase-config";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";
import "@ionic/react/css/structure.css";

/* Theme variables */
import "./theme/variables.css";
import "./theme/global.css";
import "./App.css";
import { StatusBar } from "@capacitor/status-bar";
import AuthHandler from "./components/AuthHandler";
import Schedule from "./checkout/Schedule";
import Review from "./checkout/Review";

setupIonicReact();

const App: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      where("isRead", "==", false)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const count = querySnapshot.docs.length;
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, []);

  StatusBar.setOverlaysWebView({ overlay: false }); // prevent status bar from overlaying

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/">
            <Login />
          </Route>
          <Route exact path="/register">
            <Registration />
          </Route>
          <Route exact path="/login">
            <Login />
          </Route>
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/home">
                <Home />
              </Route>
              <Route exact path="/orders">
                <Orders />
              </Route>
              <Route exact path="/orders/:id">
                <OrderDetail />
              </Route>
              <Route exact path="/notifications">
                <Notifications />
              </Route>
              <Route exact path="/account">
                <Account />
              </Route>
              <Route exact path="/home/cart">
                <Cart />
              </Route>
              <Route exact path="/home/cart/schedule">
                <Schedule />
              </Route>
              <Route exact path="/home/cart/schedule/payment">
                <Payment />
              </Route>
              <Route exact path="/home/cart/schedule/payment/review">
                <Review />
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
  );
};

export default App;
