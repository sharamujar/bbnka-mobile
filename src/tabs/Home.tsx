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

  const handleShowToastMessage = (message: string, success: boolean) => {
    console.log("Toast message (not shown):", message, success);
  };

  // Check if user is logged in
  useEffect(() => {
    console.log("Home: Setting up auth listener");

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is logged in:", user.email);
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

        // Filter products to only show approved ones
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
      }
    );

    return () => {
      unsubscribeProducts();
    };
  }, []);

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
