import { Redirect, Route, useHistory } from 'react-router-dom';
import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { bag, cart, home, library, notifications, person, radio } from 'ionicons/icons';
import Login from './pages/Login';
import Registration from './pages/Registration';
import Home from './pages/tabs/Home';
import Account from './pages/tabs/Account';
import Orders from './pages/tabs/Orders';
import Cart from './pages/Cart';
import Product from './pages/Product';
import AuthHandler from './components/AuthHandler';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/structure.css';

/* Theme variables */
import './theme/variables.css';
import './theme/global.css';

setupIonicReact();

const App: React.FC = () => {

  return (
    <IonApp>
      <IonReactRouter>
        <AuthHandler />
          <IonRouterOutlet>
            <Route exact path="/register">
                <Registration />
            </Route>
            <Route exact path="/login">
                <Login />
            </Route>
            <Route exact path="/product">
                <Product />
            </Route>
            <Route exact path="/">
                <Redirect to="/login" />
            </Route>
            <IonTabs>
              <IonRouterOutlet>
                <Route exact path="/home">
                  <Home /> 
                </Route>
                
                <Route exact path="/orders">
                  <Orders />
                </Route>
                <Route exact path="/account">
                  <Account />
                </Route>
                <Route exact path="/home/cart">
                  <Cart />
                </Route>
                <Route exact path="/">
                  <Redirect to="/home" />
                </Route>
            </IonRouterOutlet>

              {/* menu bottom nav bar */}
              <IonTabBar slot="bottom">
              <IonTabButton tab="home" href="/home">
                <IonIcon icon={home} />
                {/* <IonLabel>Home</IonLabel> */}
              </IonTabButton>

              <IonTabButton tab="orders" href="/orders">
                <IonIcon icon={bag} />
                {/* <IonLabel>Orders</IonLabel> */}
              </IonTabButton>

              <IonTabButton tab="notifications" href="/notifications">
                <IonIcon icon={notifications} />
                {/* <IonLabel>Notifications</IonLabel> */}
              </IonTabButton>

              <IonTabButton tab="account" href="/account">
                <IonIcon icon={person} />
                {/* <IonLabel>Account</IonLabel> */}
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;