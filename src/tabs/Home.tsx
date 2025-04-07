import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonInput,
  IonCard,
  IonImg,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonCardSubtitle,
  IonToast,
  IonList,
  IonLabel,
  IonFab,
  IonFabButton,
  useIonViewDidEnter,
  useIonViewWillLeave,
} from "@ionic/react";
import {
  cart,
  searchOutline,
  add,
  cartOutline,
  storefrontOutline,
  storefront,
  arrowForwardSharp,
  fastFood,
} from "ionicons/icons";
import { collection, doc, onSnapshot } from "firebase/firestore";
import ProductModal from "../products/ProductModal";
import "../tabs/Home.css";
import { Product, Category, Promotion } from "../interfaces/interfaces";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase-config";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css"; // Basic Swiper styles
import "swiper/css/pagination"; // Optional: Pagination styles
import { Pagination, Navigation, Autoplay } from "swiper/modules"; // Import modules
import BuildYourOwnModal from "../components/BuildYourOwnModal";

const Home: React.FC = () => {
  const history = useHistory();

  // Product state
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<any[]>([]);

  // Modal state
  const [productDetailsModal, setProductDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Toast state
  // const [showToast, setShowToast] = useState(false);
  // const [toastMessage, setToastMessage] = useState("");
  // const [isSuccess, setIsSuccess] = useState(false);

  // FAB button state
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollTop = useRef(0);
  const scrollListener = useRef<((ev: CustomEvent) => void) | null>(null);

  const [showBYOKModal, setBYOKShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    success: boolean;
    show: boolean;
  }>({
    message: "",
    success: false,
    show: false,
  });

  // Check if user is logged in
  useEffect(() => {
    const fetchAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is logged in:", user);
      } else if (location.pathname.includes("/home")) {
        console.log("No user detected, redirecting to login...");
        history.replace("/login");
      } else {
        console.log("User logged out, redirecting...");
      }
    });

    const fetchProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const productList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productList);
    });

    const fetchCategories = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        const categoryList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoryList);
      }
    );

    const fetchPromotions = onSnapshot(
      collection(db, "promotions"),
      (snapshot) => {
        const promotionsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPromotions(promotionsList);
      }
    );

    return () => {
      fetchAuth();
      fetchProducts();
      fetchCategories();
      fetchPromotions();
    };
  }, []);

  // Set the first category as active when categories are loaded
  // useEffect(() => {
  //   if (categories.length > 0 && !activeCategory) {
  //     setActiveCategory(categories[0]);
  //     handleCategorySelect(categories[0]);
  //   }
  // }, [categories, activeCategory]);

  // const handleCategorySelect = (category: string) => {
  //   setActiveCategory(category);
  //   console.log("Selected Category:", category);
  // };

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setProductDetailsModal(true);
  };

  // const showToastMessage = (message: string, success: boolean) => {
  //   setToastMessage(message);
  //   setIsSuccess(success);
  //   setShowToast(true);
  // };

  // Scroll event listener to hide/show the FAB button
  useIonViewDidEnter(() => {
    const content = document.querySelector("ion-content");

    if (content) {
      content.scrollEvents = true;

      const handleScroll = (ev: any) => {
        const scrollTop = ev.detail.scrollTop;

        if (scrollTop > lastScrollTop.current) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }

        lastScrollTop.current = scrollTop;
      };

      scrollListener.current = handleScroll;

      content.addEventListener("ionScroll", handleScroll);
    }
  });

  useIonViewWillLeave(() => {
    const content = document.querySelector("ion-content");

    if (content && scrollListener.current) {
      content.removeEventListener("ionScroll", scrollListener.current);
    }
  });

  useEffect(() => {
    return () => {
      const content = document.querySelector("ion-content");

      if (content && scrollListener.current) {
        content.removeEventListener("ionScroll", scrollListener.current);
      }
    };
  }, []);

  const handleShowToastMessage = (message: string, success: boolean) => {
    setToastMessage({
      message,
      success,
      show: true,
    });
  };

  return (
    <IonPage className="home-page">
      <IonHeader className="home-header">
        <IonToolbar>
          <IonTitle className="home-title">BBNKA</IonTitle>
          <IonButtons slot="end">
            <IonButton
              className="cart-button"
              onClick={() => history.push("/home/cart")}
            >
              <IonIcon
                className="cart-icon"
                icon={cart}
                slot="icon-only"
                size="small"
              ></IonIcon>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="home-content">
        <IonCard className="banner-container">
          {promotions.length > 0 && (
            <Swiper
              className="banner-scroll"
              modules={[Pagination, Autoplay]}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              loop={true}
              slidesPerView={1}
              centeredSlides={true}
            >
              {promotions.map((promo, index) => (
                <SwiperSlide key={index} className="banner-card">
                  <IonImg
                    src={promo.imageUrl}
                    className="banner-img"
                    alt="Promotion"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </IonCard>

        <IonCard
          className="byok-cta-card"
          onClick={() => setBYOKShowModal(true)}
        >
          <div className="byok-content">
            <div className="byok-text">
              <IonCardTitle>Build Your Own Kakanin</IonCardTitle>
              <IonCardSubtitle>
                Customize your kakanin with your favorite flavors!
              </IonCardSubtitle>
              <div className="byok-btn-container">
                <IonButton
                  className="byok-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBYOKShowModal(true);
                  }}
                >
                  Order Now
                  <IonIcon icon={fastFood} className="byok-icon"></IonIcon>
                </IonButton>
              </div>
            </div>
          </div>
        </IonCard>

        <BuildYourOwnModal
          isOpen={showBYOKModal}
          onClose={() => setBYOKShowModal(false)}
          showToastMessage={handleShowToastMessage}
        />

        <div>
          <IonTitle className="product-title">Our Products</IonTitle>
        </div>

        <IonGrid className="product-grid">
          <IonRow className="product-row">
            {products.length > 0 ? (
              [...products]
                .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically by name
                .map((product) => (
                  <IonCol key={product.id} size="6">
                    <IonCard
                      className="product-card"
                      onClick={() => openProductModal(product)}
                      button
                    >
                      <div className="product-img">
                        <IonImg src={product.imageURL} alt={product.name} />
                      </div>
                      <div className="home-product-details">
                        <h3 className="home-product-name">{product.name}</h3>
                        {product.description && (
                          <p className="home-product-description">
                            {product.description.length > 35
                              ? `${product.description.substring(0, 35)}...`
                              : product.description}
                          </p>
                        )}
                      </div>
                    </IonCard>
                  </IonCol>
                ))
            ) : (
              <IonCol size="12">
                <div className="no-products-container">
                  <IonIcon
                    icon={storefrontOutline}
                    style={{ fontSize: "48px", color: "#8a7e75", opacity: 0.6 }}
                  />
                  <p className="no-products-text">No products available yet</p>
                </div>
              </IonCol>
            )}
          </IonRow>
        </IonGrid>

        {/* <IonFab
          vertical="bottom"
          horizontal="end"
          slot="fixed"
          className={`order-now-fab ${!isVisible ? "hidden" : ""}`}
        >
          <IonButton
            className="order-now-btn"
            onClick={() => openProductModal(null)}
          >
            <div className="order-now-content">
              <IonIcon icon={storefront} className="order-icon" />
              <IonLabel className="order-label">Order Now</IonLabel>
            </div>
          </IonButton>
        </IonFab> */}

        {/* <div className="search-bar-container">
          <IonItem className="search-bar" lines="none">
            <IonInput
              className="search-input"
              type="text"
              placeholder="Search products..."
            />
            <IonButton className="search-button" expand="block">
              <IonIcon icon={searchOutline} />
            </IonButton>
          </IonItem>
        </div>
        <IonCard className="banner-container">
          {promotions.length > 0 && <IonImg src={promotions[0].imageUrl} />}
        </IonCard>
        <div>
          <IonTitle className="categories-title">Categories</IonTitle>
        </div>
        <div className="category-container">
          {categories.map((category, index) => (
            <IonButton
              fill="clear"
              key={category.id}
              className={`category-button ${
                activeCategory === category ? "active" : ""
              }`}
              onClick={() => handleCategorySelect(category)}
            >
              {category.name}
            </IonButton>
          ))}
        </div>

        <IonGrid className="product-grid">
          <IonRow className="product-row">
            {products.length > 0 ? (
              products.map((product) => (
                <IonCol key={product.id} size="6">
                  <IonCard
                    className="product-card"
                    button={true}
                    onClick={() => openProductModal(product)}
                  >
                    <div className="product-img">
                      <IonImg src={product.imageURL} />
                    </div>
                    <div className="product-details">
                      <IonCardHeader className="product-header">
                        <IonCardTitle>{product.name}</IonCardTitle>
                      </IonCardHeader>
                      <IonCardHeader className="price-header">
                        <div className="price-container">
                          <IonCardSubtitle>Starting at</IonCardSubtitle>
                          <IonCardTitle>₱{product.price}</IonCardTitle>
                        </div>
                        <IonButton
                          className="add-button"
                          size="small"
                          shape="round"
                        >
                          <IonIcon className="add-icon" icon={add} />
                        </IonButton>
                      </IonCardHeader>
                    </div>
                  </IonCard>
                </IonCol>
              ))
            ) : (
              <div className="no-products-container">
                <p className="no-products-text">No products available</p>
              </div>
            )}
          </IonRow>
        </IonGrid> */}

        <ProductModal
          isOpen={productDetailsModal}
          onClose={() => setProductDetailsModal(false)}
          product={selectedProduct}
        />

        {/* <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color={isSuccess ? "success" : "danger"}
        /> */}
      </IonContent>
    </IonPage>
  );
};

export default Home;
