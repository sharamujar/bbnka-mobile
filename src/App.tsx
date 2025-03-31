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
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { bag, home, notifications, person } from "ionicons/icons";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import Home from "./tabs/Home";
import Account from "./tabs/Account";
import Notifications from "./tabs/Notifications";
import Orders from "./tabs/Orders";
import Cart from "./products/Cart";
import Payment from "./checkout/Payment";
import SplashScreen from "./pages/Splashscreen";

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
