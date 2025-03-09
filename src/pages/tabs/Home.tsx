import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonImg, IonLabel, IonModal, IonPage, IonRouterOutlet, IonRow, IonTabBar, IonTabButton, IonTabs, IonTitle, IonToast, IonToolbar } from '@ionic/react';
import { cart, cartOutline, home, library, notifications, person, playCircle, radio, search } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { collection, doc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase-config';
import { onAuthStateChanged } from "firebase/auth";
import './Home.css';
import { Redirect, Route, useHistory } from 'react-router';
import { IonReactRouter } from '@ionic/react-router';

const Home: React.FC = () => {
  const history = useHistory(); // used to navigate between pages
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null); // selected product for modal
  const [productDetailsModal, setProductDetailsModal] = useState(false); // modal for product details
  const [cartItems, setCartItems] = useState<any[]>([]); // state to manage cart items

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false); //for toast message color

  useEffect(() => {

    // Check if user is authenticated
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is logged in:", user);
      } else if (location.pathname.includes('/home')) {
        console.log("No user detected, redirecting to login...");
        history.replace("/login"); // Redirect if no user exists
      } else {
        console.log("User logged out, redirecting...");
      }
    });

    //automatically fetches products from Firestore Database
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const productList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productList);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProducts();
    }
  }, []);

  // Function to open the modal and pass the selected product
  const openProductDetails = (product: any) => {
    setSelectedProduct(product);
    setProductDetailsModal(true);
  }

  // Function to close the modal
  const closeModal = () => {
    setProductDetailsModal(false);
    setSelectedProduct(null);
  }

  // function to add product to the cart
  const addToCart = (product: any) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log("User is not logged in.");
      return;
    }

    // Reference to the cart collection inside the user's document
    const cartRef = doc(db, "customers", currentUser.uid, "cart", product.id);

    // Add product to the user's cart (using product ID as the document ID)
    setDoc(cartRef, product, { merge: true })
      .then(() => {
        console.log("Product added to the cart!");
        setToastMessage('Added to cart successfully!');
        setIsSuccess(true);
        setShowToast(true);
      })
      .catch((error) => {
        console.error("Error adding product to the cart:", error);
      });
    };

  // const navigateProductDetails = (product: any) => {
  //   history.push({
  //     pathname: '/product',
  //     state: { productDetails: product }
  //   });
  // }
    
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className='title-toolbar'>BBNKA</IonTitle>
          <IonButtons slot='end'>
            <IonButton className='cart-button'
              onClick={(() => 
                history.push('/home/cart')
              )}>
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
            {products.length > 0 ? (
              products.map((product) => (
            <IonCol key={product.id} size='6'>
              <IonCard className='product-card'
                       button={true} // forces ioncard to be clickable
                       onClick={() => openProductDetails(product)}>
                <div className='product-img'>
                  <IonImg src={product.imageURL} />
                </div>
                <div className='product-details'>
                  <IonCardHeader className='product-header'>
                    <IonCardTitle>{product.name}</IonCardTitle>
                  </IonCardHeader>
                  {/* <IonCardContent className='product-desc'>{product.description}</IonCardContent> */}
                  <IonCardHeader className='price-header'>
                    <IonCardTitle>₱{product.price}</IonCardTitle>
                    <IonCardSubtitle>/{product.unit}</IonCardSubtitle>
                    {/* <IonButton className='add-to-cart-button'
                              size='small'>
                      <IonIcon icon={cartOutline}/>
                    </IonButton> */}
                  </IonCardHeader>
                </div>
              </IonCard>
            </IonCol>
              ))
            ) : (
              <div className='no-products-container'>
                <p className='no-products-text'>No products available</p>
              </div>
            )}
          </IonRow>
        </IonGrid>

        {/* product details modal */}
        <IonModal 
          isOpen={productDetailsModal}
          onDidDismiss={closeModal}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="end">
                <IonButton onClick={closeModal}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent fullscreen>
            {selectedProduct && (
              <div>
                <IonImg src={selectedProduct.imageURL} />
                <h1>{selectedProduct.name}</h1>
                <p>{selectedProduct.description}</p>
                <p>Stock: {selectedProduct.stock}</p>
                <p>Unit: {selectedProduct.unit}</p>
                <p>₱{selectedProduct.price}</p>

                {/* ✅ Close Button */}
                <IonButton onClick={() => addToCart(selectedProduct)}>
                  Add To Cart
                </IonButton>
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}  // Toast disappears after 2 seconds
          color={isSuccess ? "success" : "danger"}  // Green for success, Red for error
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
