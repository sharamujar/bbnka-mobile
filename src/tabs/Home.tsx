import { IonAccordion, IonAccordionGroup, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCheckbox, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonList, IonModal, IonPage, IonRouterOutlet, IonRow, IonSearchbar, IonTabBar, IonTabButton, IonTabs, IonText, IonTitle, IonToast, IonToolbar } from '@ionic/react';
import { add, addCircleOutline, albumsOutline, arrowBackCircle, cart, cartOutline, checkmark, discOutline, fastFoodOutline, gridOutline, home, image, informationCircle, library, lockClosed, notifications, person, playCircle, radio, radioButtonOffOutline, radioButtonOnOutline, search, searchOutline, squareOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { collection, doc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged } from "firebase/auth";
import './Home.css';
import { Redirect, Route, useHistory } from 'react-router';
import { IonReactRouter } from '@ionic/react-router';

const categories = ['All', 'Fruits', 'Vegetables', 'Meat', 'Drinks', 'Snacks'];

const Home: React.FC = () => {
  const history = useHistory(); // used to navigate between pages

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null); // selected product for modal
  const [productDetailsModal, setProductDetailsModal] = useState(false); // modal for product details
  const [cartItems, setCartItems] = useState<any[]>([]); // state to manage cart items

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false); //for toast message color

  // set the "All" category as the default active category
  const [activeCategory, setActiveCategory] = useState('All');

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
    }

    // function to add product to the cart
    const addToCart = (product: any) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log("User is not logged in.");
      return;
    } else if (!selectedSize) {
      setToastMessage('Please select a size first');
      setShowToast(true);
      setIsSuccess(false);
      return;
    } 

    // Reference to the cart collection
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

    const handleCategoryClick = (category: string) => {
      setActiveCategory(category);
      // TODO: Filter your products based on category
      console.log('Selected Category:', category);
    };

  // Sizes and Varieties
  const sizes = [
    { id: "big-bilao", name: "Big Bilao", details: "Round", varieties: ["Bibingka", "Sapin-Sapin", "Kutsinta", "Kalamay"] },
    { id: "tray", name: "Tray", details: "Rectangle", varieties: ["Bibingka", "Sapin-Sapin", "Kutsinta", "Kalamay", "Cassava"] },
    { id: "small", name: "Small", details: "Round", varieties: ["Bibingka"] },
    { id: "half-tray", name: "Half-Tray", details: "Rectangle", varieties: ["Bibingka", "Sapin-Sapin", "Kutsinta", "Kalamay", "Cassava"] },
    { id: "solo", name: "Solo", details: "Round", varieties: ["Bibingka"] },
    { id: "slice", name: "1/4 Slice", details: "Rectangle", varieties: ["Bibingka", "Sapin-Sapin", "Kutsinta", "Kalamay", "Cassava"] },
  ];

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVarieties, setSelectedVarieties] = useState<string[]>([]);

  // Filter sizes based on the selected product
  const availableSizes = selectedProduct
    ? sizes.filter((size) => size.varieties.includes(selectedProduct.name))
    : sizes;

  // Find selected size object to access its varieties
  const selectedSizeObj = sizes.find(size => size.id === selectedSize);

  const handleSizeSelect = (sizeId: string) => {
    if (selectedSize === sizeId) {
      setSelectedSize(null); // Deselect size if it's already selected
      setSelectedVarieties([]);
    } else {
      setSelectedSize(sizeId); // Selects only one size

      // if the product name matches the variety, set the selected varieties to the product name
      const sizeObj = sizes.find(size => size.id === sizeId);

      if (sizeObj && sizeObj.varieties.includes(selectedProduct.name)) {
        setSelectedVarieties([selectedProduct.name]); 
      } else {
        setSelectedVarieties([]); // Clears selected varieties when switching sizes
      }
    }
  };

  const handleVarietyChange = (variety: string) => {

    // prevent deselecting the variety if it's the same as the product name
    if (variety === selectedProduct.name && selectedVarieties.includes(variety)) {
      return;
    }

    setSelectedVarieties((prev) =>
      prev.includes(variety) ? prev.filter((v) => v !== variety) : [...prev, variety]
    );
  };
    
  return (
    <IonPage className='home-page'>
      <IonHeader className='home-header'>
        <IonToolbar>
          <IonTitle className='title-toolbar'>BBNKA</IonTitle>
          <IonButtons slot='end'>
            <IonButton className='cart-button'
              onClick={(() => 
                history.push('/home/cart')
              )}>
              <IonIcon className='cart-icon' 
                       icon={cart} 
                       slot='icon-only'
                       size='small'>
              </IonIcon>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className='home-content'>
        <div className='search-bar-container'>
            <IonItem className='search-bar' lines='none'>
              <IonInput
                className='search-input'
                type='text'
                placeholder='Search products...'
              />
              <IonButton
                className='search-button'
                expand='block'  >
                <IonIcon icon={searchOutline} />
              </IonButton>
            </IonItem>
        </div>
        <IonCard className='banner-container'>
          <IonImg src='./assets/banner.svg' className='banner-img' />
        </IonCard>
        <div>
          <IonTitle className='categories-title'>Categories</IonTitle>
        </div>
        <div className='category-container'>
          {categories.map((category, index) => (
            <IonButton
              fill='clear'
              key={index}
              className={`category-button ${activeCategory === category ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </IonButton>
          ))}
        </div>
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
                    <div className='price-container'>
                      <IonCardSubtitle>Starting at</IonCardSubtitle>
                      <IonCardTitle>₱{product.price}</IonCardTitle>
                    </div>
                      <IonButton 
                        className='add-button'
                        size='small'
                        shape="round">
                        <IonIcon className='add-icon' icon={add} />
                      </IonButton>
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
          className='product-details-modal'
          isOpen={productDetailsModal}
          canDismiss={true}
          onWillDismiss={() => 
            setProductDetailsModal(false)}
          onDidDismiss={() => {
            setSelectedSize(null); // Reset selected size when modal closes
            setSelectedVarieties([]); // Reset selected varieties too (optional)
          }} 
        >
          
          <IonContent fullscreen>
            {selectedProduct && (
              <div className='product-details-container'>
                <div className='back-button-container'>
                  <IonButton 
                    className='back-button'
                    onClick={closeModal}>
                    <IonIcon 
                      className='back-icon'
                      icon={arrowBackCircle}
                      size='large'
                    />
                  </IonButton>
                </div>
                <div className='product-details-img'>
                  <IonImg src={selectedProduct.imageURL} />
                </div>
                <IonCardHeader className='product-details-header'>
                  <IonCardSubtitle>{selectedProduct.name}</IonCardSubtitle>
                  <IonCardTitle>₱{selectedProduct.price}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent className='product-details-description'>
                  {selectedProduct.description}
                </IonCardContent>
                {/* <p>Stock: {selectedProduct.stock}</p>
                <p>Unit: {selectedProduct.unit}</p> */}
              </div> 
            )}

            <div>
              <IonTitle className='categories-title'>Choose Size</IonTitle>
            </div>
            {/* Sizes and Varieties */}
            <div className='product-size-container'>
              {availableSizes.map((size) => (
                <IonCard
                  className={`product-size-card ${selectedSize === size.id ? 'selected-card' : ''}`}
                  onClick={() => handleSizeSelect(size.id)}
                  style={{
                  backgroundColor: selectedSize === size.id ? "#BF5906" : "#fff",
                  }}
                >
                  <IonCardContent>
                    <div className='product-size-img'>
                      <IonImg 
                        src='./assets/big-bilao.svg' 
                        className='product-size-image'/>
                    </div>
                    <IonCardHeader>
                      <IonCardTitle>{size.name}</IonCardTitle>
                      <IonCardSubtitle>{size.details}</IonCardSubtitle>
                    </IonCardHeader>
                  </IonCardContent>
                </IonCard>
              ))} 
            </div>
            
            {selectedSizeObj && (
            <div className="varieties-section">
              <IonTitle className="categories-title">Choose Varieties</IonTitle>
              <div className="varieties-container">
                {selectedSizeObj.varieties.map((variety) => {
                  const isProductVariety = variety === selectedProduct.name;
                  const isSelected = selectedVarieties.includes(variety);
                
                return (
                  <IonCard 
                    key={variety}
                    className={`variety-card ${isSelected ? 'selected-variety' : ''} ${isProductVariety ? 'product-variety' : ''}`}
                    onClick={() => handleVarietyChange(variety)}
                  >
                    <IonCardContent className="variety-card-content">
                      {isSelected && (
                        <div className="checkmark-icon">
                          <IonIcon icon={checkmark} color="success" />
                        </div>
                      )}
                      <div className="variety-name">{variety}</div>
                    </IonCardContent>
                  </IonCard>
                );
              })}
            </div>
          </div>
        )}

            {/* add to Cart Button */}
            <IonButton 
              className='add-to-cart-button'
              expand='block'
              onClick={() => addToCart(selectedProduct)}>Add To Cart
            </IonButton>
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
