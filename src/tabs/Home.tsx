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
  IonText,
  IonBadge,
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
  chevronForward,
  chevronForwardSharp,
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
  const [cartItemCount, setCartItemCount] = useState(0);

  // Modal state
  const [productDetailsModal, setProductDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // FAB button state
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollTop = useRef(0);
  const scrollListener = useRef<((ev: CustomEvent) => void) | null>(null);

  const [showBYOKModal, setBYOKShowModal] = useState(false);

  // Dummy function for BuildYourOwnModal
  const handleShowToastMessage = (message: string, success: boolean) => {
    console.log("Toast message (not shown):", message, success);
    // Toast is not shown but BuildYourOwnModal requires this prop
  };

  // Check if user is logged in
  useEffect(() => {
    console.log("Home: Setting up auth listener");

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is logged in:", user.email);
        // Set up cart listener when user is authenticated
        const cartRef = collection(db, "customers", user.uid, "cart");
        const unsubscribeCart = onSnapshot(
          cartRef,
          (snapshot) => {
            setCartItemCount(snapshot.size);
          },
          (error) => {
            console.error("Error fetching cart items:", error);
          }
        );

        return () => {
          unsubscribeCart();
        };
      } else if (location.pathname.includes("/home")) {
        console.log("No user detected, redirecting to login...");
        history.replace("/login");
      } else {
        console.log("User logged out, redirecting...");
      }
    });

    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const productList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter products to only show approved ones with runtime check
        const approvedProducts = productList.filter(
          (product) =>
            product &&
            typeof product === "object" &&
            "status" in product &&
            product.status === "approved"
        );
        setProducts(approvedProducts);
      }
    );

    const unsubscribeCategories = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        const categoryList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoryList);
      }
    );

    const unsubscribePromotions = onSnapshot(
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
      console.log("Home: Cleaning up listeners");
      unsubscribeAuth();
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribePromotions();
    };
  }, []);

  // Fetch featured products
  useEffect(() => {
    const unsubscribeProducts = onSnapshot(
      collection(db, "testProducts"),
      (snapshot) => {
        const productList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter products to only show approved AND featured ones
        // const approvedFeaturedProducts = productList.filter(
        //   (product) =>
        //     product &&
        //     typeof product === "object" &&
        //     "status" in product &&
        //     product.status === "approved" &&
        //     "published" in product &&
        //     product.published === true &&
        //     "featured" in product &&
        //     product.featured === true
        // );
        // setFeaturedProducts(approvedFeaturedProducts);

        // Update loading state
        // setLoading(false);
      }
    );

    return () => {
      unsubscribeProducts();
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
                className="home-cart-icon"
                icon={cart}
                slot="icon-only"
                size="small"
              ></IonIcon>
              {cartItemCount > 0 && (
                <IonBadge color="danger" className="cart-badge">
                  {cartItemCount}
                </IonBadge>
              )}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="home-content">
        <IonCard className="banner-container">
          {promotions.filter((promo) => promo.status === "active").length >
            0 && (
            <Swiper
              className="banner-scroll"
              modules={[Pagination, Autoplay]}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              loop={true}
              slidesPerView={1}
              centeredSlides={true}
            >
              {promotions
                .filter((promo) => promo.status === "active")
                .map((promo, index) => (
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

        <div>
          <IonTitle className="home-product-title">Explore Our App</IonTitle>
        </div>

        <IonCard
          className="home-byok-cta-card"
          onClick={() => setBYOKShowModal(true)}
        >
          <div className="home-byok-content">
            <div className="home-byok-text">
              <IonCardTitle>Build Your Own Kakanin</IonCardTitle>
              <IonCardSubtitle>
                Customize your order with your favorite kakanin!
              </IonCardSubtitle>
              <div className="home-byok-btn-container">
                <IonButton
                  className="home-byok-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBYOKShowModal(true);
                  }}
                >
                  <IonIcon
                    icon={fastFood}
                    className="home-byok-icon"
                    slot="start"
                  ></IonIcon>
                  Add to Cart
                  <IonIcon
                    icon={chevronForward}
                    className="home-byok-icon"
                    slot="end"
                  ></IonIcon>
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

        <IonCard
          className="home-menu-cta-card"
          onClick={() => history.push("/menu")}
        >
          <div className="home-menu-content">
            <div className="home-menu-text">
              <IonCardTitle>View Our Menu</IonCardTitle>
              <IonCardSubtitle>
                Explore our delicious selection of traditional kakanin!
              </IonCardSubtitle>
              <div className="home-menu-btn-container">
                <IonButton
                  className="home-menu-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    history.push("/menu");
                  }}
                >
                  <IonIcon
                    icon={storefront}
                    className="home-menu-icon"
                    slot="start"
                  ></IonIcon>
                  View Products
                  <IonIcon
                    icon={chevronForward}
                    className="home-menu-icon"
                    slot="end"
                  ></IonIcon>
                </IonButton>
              </div>
            </div>
          </div>
        </IonCard>

        {/* <div>
          <IonTitle className="home-product-title">Our Products</IonTitle>
        </div>

        <IonGrid className="home-product-grid">
          <IonRow className="home-product-row">
            {products.length > 0 ? (
              [...products]
                .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically by name
                .map((product) => (
                  <IonCol key={product.id} size="6">
                    <IonCard
                      className="home-product-card"
                      onClick={() => openProductModal(product)}
                      button
                    >
                      <div className="home-product-img">
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
        </IonGrid> */}

        <ProductModal
          isOpen={productDetailsModal}
          onClose={() => setProductDetailsModal(false)}
          product={selectedProduct}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
