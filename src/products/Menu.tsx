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
  IonBackButton,
  IonCard,
  IonImg,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonBadge,
  useIonViewWillEnter,
  useIonViewWillLeave,
} from "@ionic/react";
import { cart, storefrontOutline } from "ionicons/icons";
import { collection, onSnapshot } from "firebase/firestore";
import ProductModal from "./ProductModal";
import "../products/Menu.css";
import { db, auth } from "../firebase-config";

// Define an interface for the products from testProducts collection
interface TestProduct {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  published?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

const Menu: React.FC = () => {
  const history = useHistory();

  // State management with proper typing
  const [products, setProducts] = useState<TestProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<TestProduct[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [cartItemCount, setCartItemCount] = useState(0);

  // Modal state
  const [productDetailsModal, setProductDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TestProduct | null>(
    null
  );

  // Set the Home tab as active every time the Menu page is visited
  useIonViewWillEnter(() => {
    // This function runs every time the view is about to be displayed
    activateHomeTab();
  });

  // Reset tab selection when leaving the Menu page
  useIonViewWillLeave(() => {
    // This allows the tab bar to correctly highlight the active tab when navigating away
    resetTabSelection();
  });

  // Active home tab helper function
  const activateHomeTab = () => {
    const homeTab = document.querySelector('ion-tab-button[tab="home"]');
    if (homeTab) {
      // Add selected class to home tab
      homeTab.setAttribute("aria-selected", "true");
      homeTab.classList.add("tab-selected");

      // Make other tabs not selected
      document
        .querySelectorAll('ion-tab-button:not([tab="home"])')
        .forEach((tab) => {
          tab.setAttribute("aria-selected", "false");
          tab.classList.remove("tab-selected");
        });
    }
  };

  // Reset tab selection helper function
  const resetTabSelection = () => {
    // Check the current URL path to determine which tab should be active
    const currentPath = window.location.pathname;

    // Always highlight the home tab when going back to home
    if (currentPath === "/" || currentPath === "/home") {
      const homeTab = document.querySelector('ion-tab-button[tab="home"]');
      if (homeTab) {
        homeTab.setAttribute("aria-selected", "true");
        homeTab.classList.add("tab-selected");
      }

      // Make other tabs not selected
      document
        .querySelectorAll('ion-tab-button:not([tab="home"])')
        .forEach((tab) => {
          tab.setAttribute("aria-selected", "false");
          tab.classList.remove("tab-selected");
        });
    } else {
      // For other paths, determine the right tab to highlight
      let activeTab = null;

      if (currentPath.includes("/orders")) {
        activeTab = "orders";
      } else if (currentPath.includes("/notifications")) {
        activeTab = "notifications";
      } else if (currentPath.includes("/account")) {
        activeTab = "account";
      }

      // If we have an active tab to highlight, do it
      if (activeTab) {
        const tabToActivate = document.querySelector(
          `ion-tab-button[tab="${activeTab}"]`
        );
        if (tabToActivate) {
          tabToActivate.setAttribute("aria-selected", "true");
          tabToActivate.classList.add("tab-selected");
        }
      }
    }
  };

  // Fetch cart item count
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

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
  }, []);

  // Fetch products on mount
  useEffect(() => {
    const unsubscribeProducts = onSnapshot(
      collection(db, "testProducts"),
      (snapshot) => {
        const productList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TestProduct[];

        console.log("Fetched products:", productList);

        // Filter products that are published
        const publishedProducts = productList.filter((product) => {
          // Check if published field is true
          const isProductPublished = product.published === true;

          console.log(
            `Product ${product.name} - published: ${product.published}, displays: ${isProductPublished}`
          );

          return isProductPublished;
        });

        console.log("Products after filtering:", publishedProducts);

        setProducts(publishedProducts);
        setFilteredProducts(publishedProducts);
      }
    );

    return () => {
      unsubscribeProducts();
    };
  }, []);

  // Filter products when search text changes
  useEffect(() => {
    let results = [...products];

    // Apply search filter if there's search text
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      results = results.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          (product.description &&
            product.description.toLowerCase().includes(searchLower))
      );
    }

    setFilteredProducts(results);
  }, [searchText, products]);

  const openProductModal = (product: TestProduct) => {
    setSelectedProduct(product);
    setProductDetailsModal(true);
  };

  return (
    <IonPage className="menu-page">
      <IonHeader className="menu-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle className="menu-title">Menu</IonTitle>
          <IonButtons slot="end">
            <IonButton
              className="cart-button"
              onClick={() => history.push("/home/cart")}
            >
              <IonIcon
                className="menu-cart-icon"
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

      <IonContent fullscreen className="menu-content">
        <div className="menu-search-container">
          <IonSearchbar
            className="menu-searchbar"
            value={searchText}
            onIonChange={(e) => setSearchText(e.detail.value || "")}
            placeholder="Search products..."
            animated
          />
        </div>

        <div>
          <IonTitle className="menu-product-title">All Products</IonTitle>
          {searchText && (
            <div className="search-results-counter">
              Found {filteredProducts.length} results for "{searchText}"
            </div>
          )}
        </div>

        <IonGrid className="menu-product-grid">
          <IonRow className="menu-product-row">
            {filteredProducts.length > 0 ? (
              [...filteredProducts]
                .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically by name
                .map((product) => (
                  <IonCol key={product.id} size="6">
                    <IonCard
                      className="menu-product-card"
                      onClick={() => openProductModal(product)}
                      button
                    >
                      <div className="menu-product-img">
                        <IonImg src={product.imageUrl} alt={product.name} />
                      </div>
                      <div className="menu-product-details">
                        <h3 className="menu-product-name">{product.name}</h3>
                        {product.description && (
                          <p className="menu-product-description">
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
                  <p className="no-products-text">
                    {searchText
                      ? "No products found matching your search"
                      : "No products available"}
                  </p>
                </div>
              </IonCol>
            )}
          </IonRow>
        </IonGrid>

        <ProductModal
          isOpen={productDetailsModal}
          onClose={() => setProductDetailsModal(false)}
          product={selectedProduct}
        />
      </IonContent>
    </IonPage>
  );
};

export default Menu;
