import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonImg, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Home.css';
import { cart, cartOutline } from 'ionicons/icons';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className='title-toolbar'>BBNKA</IonTitle>
          <IonButtons slot='end'>
            <IonButton className='cart-button'>
              <IonIcon icon={cart} 
                       slot='end'>
              </IonIcon>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Blank</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonGrid className='product-grid'>
          <IonRow className='product-row'>
            <IonCol size='6'>
              <IonCard className='product-card'>
                <div className='product-img'>
                  <IonImg src='./assets/bibingka.jpg' />
                </div>
                <div className='product-details'>
                  <IonCardHeader className='product-header'>
                    <IonCardTitle>Bibingka</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className='product-desc'>A sweet, sticky rice delicacy with rich coconut flavor and a caramelized topping</IonCardContent>
                  <IonCardHeader className='price-header'>
                    <IonCardTitle>₱180</IonCardTitle>
                    <IonCardSubtitle>/box</IonCardSubtitle>
                    <IonButton className='add-to-cart-button'
                              size='small'>
                      <IonIcon icon={cartOutline}/>
                    </IonButton>
                  </IonCardHeader>
                </div>
              </IonCard>
            </IonCol>
            <IonCol className='product-right-col' size='6'>
              <IonCard className='product-card'>
                <div className='product-img'>
                  <IonImg src='./assets/sapin-sapin.jpg' />
                </div>
                <div className='product-details'>
                  <IonCardHeader className='product-header'>
                    <IonCardTitle>Sapin-Sapin</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className='product-desc'>A vibrant, layered rice cake with a rich blend of coconut, ube, and jackfruit flavors</IonCardContent>
                  <IonCardHeader className='price-header'>
                    <IonCardTitle>₱110</IonCardTitle>
                    <IonCardSubtitle>/¼ slice</IonCardSubtitle>
                    <IonButton className='add-to-cart-button'
                              size='small'>
                      <IonIcon icon={cartOutline}/>
                    </IonButton>
                  </IonCardHeader>
                </div>
              </IonCard>
            </IonCol>
          </IonRow>
          <IonRow className='product-row'>
            <IonCol size='6'>
              <IonCard className='product-card'>
                <div className='product-img'>
                  <IonImg src='./assets/kutsinta.jpg' />
                </div>
                <div className='product-details'>
                  <IonCardHeader className='product-header'>
                    <IonCardTitle>Bibingka</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className='product-desc'>A sweet, sticky rice delicacy with rich coconut flavor and a caramelized topping</IonCardContent>
                  <IonCardHeader className='price-header'>
                    <IonCardTitle>₱180</IonCardTitle>
                    <IonCardSubtitle>/box</IonCardSubtitle>
                    <IonButton className='add-to-cart-button'
                              size='small'>
                      <IonIcon icon={cartOutline}/>
                    </IonButton>
                  </IonCardHeader>
                </div>
              </IonCard>
            </IonCol>
            <IonCol className='product-right-col' size='6'>
              <IonCard className='product-card'>
                <div className='product-img'>
                  <IonImg src='./assets/kalamay.jpg' />
                </div>
                <div className='product-details'>
                  <IonCardHeader className='product-header'>
                    <IonCardTitle>Sapin-Sapin</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className='product-desc'>A vibrant, layered rice cake with a rich blend of coconut, ube, and jackfruit flavors</IonCardContent>
                  <IonCardHeader className='price-header'>
                    <IonCardTitle>₱110</IonCardTitle>
                    <IonCardSubtitle>/¼ slice</IonCardSubtitle>
                    <IonButton className='add-to-cart-button'
                              size='small'>
                      <IonIcon icon={cartOutline}/>
                    </IonButton>
                  </IonCardHeader>
                </div>
              </IonCard>
            </IonCol>
          </IonRow>
          <IonRow className='product-row'>
            <IonCol size='6'>
              <IonCard className='product-card'>
                <div className='product-img'>
                  <IonImg src='./assets/cassava.jpg' />
                </div>
                <div className='product-details'>
                  <IonCardHeader className='product-header'>
                    <IonCardTitle>Bibingka</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className='product-desc'>A sweet, sticky rice delicacy with rich coconut flavor and a caramelized topping</IonCardContent>
                  <IonCardHeader className='price-header'>
                    <IonCardTitle>₱180</IonCardTitle>
                    <IonCardSubtitle>/box</IonCardSubtitle>
                    <IonButton className='add-to-cart-button'
                              size='small'>
                      <IonIcon icon={cartOutline}/>
                    </IonButton>
                  </IonCardHeader>
                </div>
              </IonCard>
            </IonCol>
            <IonCol className='product-right-col' size='6'>
              <IonCard className='product-card'>
                <div className='product-img'>
                  <IonImg src='./assets/cocojam.png' />
                </div>
                <div className='product-details'>
                  <IonCardHeader className='product-header'>
                    <IonCardTitle>Sapin-Sapin</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className='product-desc'>A vibrant, layered rice cake with a rich blend of coconut, ube, and jackfruit flavors</IonCardContent>
                  <IonCardHeader className='price-header'>
                    <IonCardTitle>₱110</IonCardTitle>
                    <IonCardSubtitle>/¼ slice</IonCardSubtitle>
                    <IonButton className='add-to-cart-button'
                              size='small'>
                      <IonIcon icon={cartOutline}/>
                    </IonButton>
                  </IonCardHeader>
                </div>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Home;
