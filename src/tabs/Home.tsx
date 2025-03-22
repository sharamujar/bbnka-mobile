import React, { useState, useEffect } from "react";
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
} from "@ionic/react";
import { cart, searchOutline, add } from "ionicons/icons";
import { collection, doc, onSnapshot } from "firebase/firestore";
import ProductModal from "../products/ProductModal";
import "../tabs/Home.css";
import { Product, Category, Promotion } from "../interfaces/interfaces";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase-config";

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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

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

    // Automatically fetches products from Firestore Database
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
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
      handleCategorySelect(categories[0]);
    }
  }, [categories, activeCategory]);

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category);
    console.log("Selected Category:", category);
  };

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setProductDetailsModal(true);
  };

  const showToastMessage = (message: string, success: boolean) => {
    setToastMessage(message);
    setIsSuccess(success);
    setShowToast(true);
  };

  return (
    <IonPage className="home-page">
      <IonHeader className="home-header">
        <IonToolbar>
          <IonTitle className="title-toolbar">BBNKA</IonTitle>
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
        <div className="search-bar-container">
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
        </IonGrid>

        <ProductModal
          isOpen={productDetailsModal}
          onClose={() => setProductDetailsModal(false)}
          product={selectedProduct}
          showToastMessage={showToastMessage}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color={isSuccess ? "success" : "danger"}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
