import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonPage,
  IonRouterLink,
  IonRow,
  IonText,
  IonThumbnail,
  IonTitle,
  IonToolbar,
  useIonAlert,
  IonToast,
  IonCheckbox,
  IonProgressBar,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase-config";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  add,
  addCircle,
  arrowForward,
  bag,
  cardOutline,
  cart,
  cartOutline,
  chevronForward,
  chevronForwardCircle,
  close,
  remove,
  removeCircle,
  timeOutline,
  trash,
  trashBin,
  trashBinOutline,
  trashSharp,
  alertCircleOutline,
  informationCircleOutline,
} from "ionicons/icons";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import "./Cart.css";
import BuildYourOwnModal from "../components/BuildYourOwnModal";

const Cart: React.FC = () => {
  const user = auth.currentUser;
  const history = useHistory(); //for navigation

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBYOKModal, setShowBYOKModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // Track selected item IDs
  const [selectAll, setSelectAll] = useState(false); // Track select all state
  const [productStocks, setProductStocks] = useState<Record<string, any>>({});

  const [quantity, setQuantity] = useState(1);

  // Toast message handler for BuildYourOwnModal
  const handleShowToastMessage = (message: string, success: boolean) => {
    console.log("Toast message (not shown):", message, success);
    // We're not showing a toast here, but the BuildYourOwnModal requires this prop
  };

  // Function to fetch stock information for a specific product
  const fetchStockInfo = async (productId: string, productType: string) => {
    try {
      const stocksRef = collection(db, "testStocks");
      let q = query(stocksRef, where("productId", "==", productId));

      // If product type is available, add it to the query
      if (productType) {
        q = query(
          stocksRef,
          where("productId", "==", productId),
          where("type", "==", productType.toLowerCase())
        );
      }

      const stocksSnapshot = await getDocs(q);

      if (!stocksSnapshot.empty) {
        const stockData = stocksSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        return stockData;
      }

      return null;
    } catch (error) {
      console.error("Error fetching stock info:", error);
      return null;
    }
  };

  // Function to update stock information for all cart items
  const updateStockInfo = async () => {
    const stocksMap: Record<string, any> = {};

    for (const item of cartItems) {
      if (item.productId) {
        // For regular products
        const stockInfo = await fetchStockInfo(
          item.productId,
          item.productType
        );
        if (stockInfo) {
          stocksMap[item.id] = stockInfo;
        }
      } else if (item.productIds && Array.isArray(item.productIds)) {
        // For bilao products with multiple varieties
        const multiStockInfo = [];
        for (let i = 0; i < item.productIds.length; i++) {
          const productId = item.productIds[i];
          const productVariety = item.productVarieties?.[i] || null;

          if (productId) {
            const stockInfo = await fetchStockInfo(productId, item.productType);
            if (stockInfo) {
              multiStockInfo.push({
                variety: productVariety,
                stockInfo: stockInfo,
              });
            }
          }
        }

        if (multiStockInfo.length > 0) {
          stocksMap[item.id] = multiStockInfo;
        }
      }
    }

    setProductStocks(stocksMap);
    console.log("Updated stock information:", stocksMap);
  };

  useEffect(() => {
    console.log("Cart component mounted");
    console.log("Auth state:", user ? "Logged in" : "Not logged in");

    // Clear any existing checkout data in localStorage
    localStorage.removeItem("pickupDate");
    localStorage.removeItem("pickupTime");
    localStorage.removeItem("paymentMethod");
    localStorage.removeItem("gcashReference");
    localStorage.removeItem("pickupOption");
    localStorage.removeItem("status");

    if (!user) {
      console.log("No user found, redirecting to login...");
      setLoading(false);
      return;
    }

    console.log("Setting up Firebase listener for user:", user.uid);
    const cartRef = collection(db, "customers", user.uid, "cart");

    const unsubscribe = onSnapshot(
      cartRef,
      (querySnapshot) => {
        console.log("Firebase snapshot received");
        console.log("Snapshot size:", querySnapshot.size);

        const items: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Document ID:", doc.id);
          console.log("Document data:", JSON.stringify(data, null, 2));
          items.push({ ...data, id: doc.id });
        });

        console.log("Total items processed:", items.length);
        setCartItems(items);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Firebase listener error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      console.log("Cleaning up Firebase listener");
      unsubscribe();
    };
  }, [user]);

  // Update stock information whenever cart items change
  useEffect(() => {
    if (cartItems.length > 0 && !loading) {
      updateStockInfo();
    }
  }, [cartItems, loading]);

  // Fetch product IDs by name to match with stocks
  const [productNameToIdMap, setProductNameToIdMap] = useState<
    Record<string, string>
  >({});

  // Load product names and IDs from testProducts collection for mapping
  useEffect(() => {
    const fetchProductsForMapping = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, "testProducts"));
        const productsMap: Record<string, string> = {};

        productsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.name) {
            productsMap[data.name.toLowerCase()] = doc.id;
          }
        });

        console.log("Product name to ID mapping:", productsMap);
        setProductNameToIdMap(productsMap);
      } catch (error) {
        console.error("Error fetching products for mapping:", error);
      }
    };

    fetchProductsForMapping();
  }, []);

  // Add function to update cart items with missing product IDs
  useEffect(() => {
    // Wait until we have both cart items and product mapping
    if (
      cartItems.length > 0 &&
      Object.keys(productNameToIdMap).length > 0 &&
      user
    ) {
      const updateCartItemsWithProductIds = async () => {
        console.log("Checking cart items for missing product IDs...");

        const updates = [];

        for (const item of cartItems) {
          // Skip items that already have a productId or productIds
          if (
            item.productId ||
            (item.productIds &&
              Array.isArray(item.productIds) &&
              item.productIds.length > 0)
          ) {
            continue;
          }

          // If item has productVarieties, try to map them to productIds
          if (
            item.productVarieties &&
            Array.isArray(item.productVarieties) &&
            item.productVarieties.length > 0
          ) {
            const productIds = item.productVarieties
              .map((name: string) => {
                const id = productNameToIdMap[name.toLowerCase()];
                if (id) {
                  console.log(`Found product ID ${id} for variety ${name}`);
                  return id;
                }
                return null;
              })
              .filter(Boolean);

            if (productIds.length > 0) {
              console.log(
                `Updating cart item ${item.id} with product IDs:`,
                productIds
              );
              updates.push({
                itemId: item.id,
                data: {
                  productIds: productIds,
                  // Also set productType if missing
                  productType: item.productType || "bilao",
                },
              });
            }
          } else if (typeof item.productName === "string") {
            // For items with productName but no productId
            const productId =
              productNameToIdMap[item.productName.toLowerCase()];
            if (productId) {
              console.log(
                `Updating cart item ${item.id} with product ID ${productId} based on name`
              );
              updates.push({
                itemId: item.id,
                data: {
                  productId: productId,
                  // Also set productType if missing
                  productType: item.productType || "bilao",
                },
              });
            }
          }
        }

        // Apply updates to Firestore
        for (const update of updates) {
          try {
            await updateDoc(
              doc(db, "customers", user.uid, "cart", update.itemId),
              update.data
            );
            console.log(`Successfully updated cart item ${update.itemId}`);
          } catch (error) {
            console.error(
              `Failed to update cart item ${update.itemId}:`,
              error
            );
          }
        }
      };

      updateCartItemsWithProductIds();
    }
  }, [cartItems, productNameToIdMap, user]);

  // Selection handling functions
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        // If item is already selected, unselect it
        return prev.filter((id) => id !== itemId);
      } else {
        // Otherwise add it to selected items
        return [...prev, itemId];
      }
    });
  };

  const toggleSelectAll = () => {
    // If all items are currently selected, unselect all
    if (selectAll) {
      setSelectedItems([]);
    } else {
      // Otherwise select all items
      const allItemIds = cartItems.map((item) => item.id);
      setSelectedItems(allItemIds);
    }
    setSelectAll(!selectAll);
  };

  // Effect to keep selectAll state in sync with individual selections
  useEffect(() => {
    // Set selectAll to true if all items are selected
    setSelectAll(
      cartItems.length > 0 &&
        cartItems.every((item) => selectedItems.includes(item.id))
    );
  }, [selectedItems, cartItems]);

  // Initialize selected items when cart loads
  useEffect(() => {
    if (!loading && cartItems.length > 0) {
      // By default, select all items
      const allItemIds = cartItems.map((item) => item.id);
      setSelectedItems(allItemIds);
    }
  }, [loading, cartItems]);

  // Calculate cart totals for selected items only
  const subtotal = cartItems.reduce((total, item) => {
    // Only include the item in the total if it's selected
    if (selectedItems.includes(item.id)) {
      return total + (item.productPrice || 0);
    }
    return total;
  }, 0);
  const discountPercentage = 0;
  const discountAmount = (subtotal * discountPercentage) / 100;
  const total = subtotal - discountAmount;

  const updateQuantity = async (cartId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const cartRef = doc(db, "customers", currentUser.uid, "cart", cartId);

    try {
      const cartDoc = await getDoc(cartRef);
      if (!cartDoc.exists()) return;

      const cartData = cartDoc.data();

      // Ensure originalPrice is always the base price
      const originalPrice = cartData.originalPrice; // Do not use productPrice as a fallback

      if (!originalPrice) {
        console.error("Original price is missing in cart data.");
        return;
      }

      // Calculate updated price
      const updatedPrice =
        newQuantity === 1 ? originalPrice : originalPrice * newQuantity;

      await updateDoc(cartRef, {
        productQuantity: newQuantity,
        productPrice: updatedPrice,
      });

      console.log(
        `Updated cart item ${cartId}: quantity = ${newQuantity}, price = ${updatedPrice}`
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (cartId: string) => {
    try {
      if (!user) return;

      const cartRef = collection(db, "customers", user.uid, "cart");

      const q = query(cartRef, where("cartId", "==", cartId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(db, "customers", user.uid, "cart", docToDelete.id));
        console.log("Item successfully removed from cart in Firestore");
      }

      const itemElement = document.getElementById(`cart-item-${cartId}`);
      if (itemElement) {
        itemElement.classList.add("removing");
        setTimeout(() => {
          setCartItems(cartItems.filter((item) => item.cartId !== cartId));
        }, 300);
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
    }
  };

  // Helper function to get stock status for a single variety
  const getStockStatusForVariety = (itemId: string, varietyName: string) => {
    const stockData = productStocks[itemId];
    if (!stockData || !Array.isArray(stockData)) {
      return { status: "pending", quantity: 0 };
    }

    // Find the stock data for this specific variety
    const varietyStock = stockData.find(
      (stock) => stock.variety === varietyName
    );
    if (
      !varietyStock ||
      !varietyStock.stockInfo ||
      varietyStock.stockInfo.length === 0
    ) {
      return { status: "unknown", quantity: 0 };
    }

    const stockItem = varietyStock.stockInfo[0];
    const stockLevel = stockItem.quantity || 0;
    const minStock = stockItem.minimumStock || 0;
    const criticalLevel = stockItem.criticalLevel || 0;

    let status = "normal";
    if (stockLevel <= criticalLevel) {
      status = "critical";
    } else if (stockLevel <= minStock) {
      status = "low";
    }

    return {
      status,
      quantity: stockLevel,
      color:
        status === "critical"
          ? "danger"
          : status === "low"
          ? "warning"
          : "success",
    };
  };

  const sortedCartItems = [...cartItems].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // Helper function to render stock information
  const renderStockInfo = (itemId: string) => {
    const stockData = productStocks[itemId];

    if (!stockData) {
      return (
        <IonText className="stock-info-pending">Loading stock info...</IonText>
      );
    }

    if (Array.isArray(stockData)) {
      // Multiple varieties
      return (
        <div className="stock-info-container">
          {stockData.map((stock, index) => {
            if (!stock.stockInfo || stock.stockInfo.length === 0) return null;

            const stockItem = stock.stockInfo[0];
            const stockLevel = stockItem.quantity || 0;
            const minStock = stockItem.minimumStock || 0;
            const criticalLevel = stockItem.criticalLevel || 0;
            const stockPercent = Math.min((stockLevel / minStock) * 100, 100);

            let stockStatus = "normal";
            if (stockLevel <= criticalLevel) {
              stockStatus = "critical";
            } else if (stockLevel <= minStock) {
              stockStatus = "low";
            }

            return (
              <div key={index} className="variety-stock-info">
                {stock.variety && (
                  <div className="variety-name">{stock.variety}</div>
                )}
                <div className={`stock-level ${stockStatus}`}>
                  <div className="stock-text">
                    <IonIcon icon={informationCircleOutline} />
                    <span>Stock: {stockLevel.toFixed(2)}</span>
                  </div>
                  <IonProgressBar
                    value={stockPercent / 100}
                    color={
                      stockStatus === "critical"
                        ? "danger"
                        : stockStatus === "low"
                        ? "warning"
                        : "success"
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    } else if (stockData && stockData.length > 0) {
      // Single item
      const stockItem = stockData[0];
      const stockLevel = stockItem.quantity || 0;
      const minStock = stockItem.minimumStock || 0;
      const criticalLevel = stockItem.criticalLevel || 0;
      const stockPercent = Math.min((stockLevel / minStock) * 100, 100);

      let stockStatus = "normal";
      if (stockLevel <= criticalLevel) {
        stockStatus = "critical";
      } else if (stockLevel <= minStock) {
        stockStatus = "low";
      }

      return (
        <div className="stock-info-container">
          <div className={`stock-level ${stockStatus}`}>
            <div className="stock-text">
              <IonIcon icon={informationCircleOutline} />
              <span>Stock: {stockLevel.toFixed(2)}</span>
              <span className="min-stock">Min: {minStock}</span>
              <span className="critical-level">Critical: {criticalLevel}</span>
            </div>
            <IonProgressBar
              value={stockPercent / 100}
              color={
                stockStatus === "critical"
                  ? "danger"
                  : stockStatus === "low"
                  ? "warning"
                  : "success"
              }
            />
          </div>
        </div>
      );
    }

    return (
      <IonText className="stock-info-none">No stock info available</IonText>
    );
  };

  // badge color
  const getSizeColor = (sizeName: any): string => {
    // Handle case where sizeName is an object
    if (typeof sizeName === "object" && sizeName !== null) {
      // If it's an object with a name property
      if (sizeName.name) {
        sizeName = sizeName.name;
      } else {
        // If it's an object but no name property, return a default color
        return "hsl(0, 0%, 50%)";
      }
    }

    // Handle case where sizeName is not a string
    if (typeof sizeName !== "string") {
      return "hsl(0, 0%, 50%)";
    }

    let hash = 0;
    for (let i = 0; i < sizeName.length; i++) {
      hash = sizeName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = ((Math.abs(hash * 47) % 360) + 360) % 360;
    const saturation = 35 + (Math.abs(hash * 12) % 35);
    const lightness = 35 + (Math.abs(hash * 42) % 30);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // badge initials
  const getSizeAbbreviation = (sizeName: any): string => {
    // Handle case where sizeName is an object
    if (typeof sizeName === "object" && sizeName !== null) {
      // If it's an object with a name property
      if (sizeName.name) {
        sizeName = sizeName.name;
      } else {
        // If it's an object but no name property, return a default
        return "N/A";
      }
    }

    // Handle case where sizeName is not a string
    if (typeof sizeName !== "string") {
      return "N/A";
    }

    // Now we can safely split the string
    return sizeName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // Add error display in the UI
  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="end">
              <IonRouterLink routerLink="/home" routerDirection="back">
                <IonButton>
                  <IonIcon icon={close}></IonIcon>
                </IonButton>
              </IonRouterLink>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="error-container">
            <IonText color="danger">
              <h2>Error loading cart</h2>
              <p>{error}</p>
            </IonText>
            <IonButton expand="block" onClick={() => window.location.reload()}>
              Retry
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton>
              <IonRouterLink routerLink="/home" routerDirection="back">
                <IonIcon className="close-btn" icon={close}></IonIcon>
              </IonRouterLink>
            </IonButton>
          </IonButtons>
          <IonTitle>Cart</IonTitle>
          {cartItems.length > 0 && (
            <IonButtons slot="end">
              <div
                className={`select-all-toggle ${selectAll ? "active" : ""}`}
                onClick={toggleSelectAll}
              >
                <IonLabel>Select All</IonLabel>
                <IonCheckbox
                  checked={selectAll}
                  onIonChange={toggleSelectAll}
                />
              </div>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {loading ? (
          <div className="skeleton-container">
            <div className="skeleton-header">
              <div className="skeleton-title"></div>
              <div className="skeleton-subtitle"></div>
            </div>
            {[1, 2, 3].map((item) => (
              <div className="skeleton-item" key={item}>
                <div className="skeleton-badge"></div>
                <div className="skeleton-content">
                  <div className="skeleton-name"></div>
                  <div className="skeleton-info"></div>
                  <div className="skeleton-price-row">
                    <div className="skeleton-price"></div>
                    <div className="skeleton-quantity"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : cartItems.length === 0 ? (
          <div className="empty-notifications">
            <IonIcon icon={cartOutline} className="empty-icon" />
            <IonText className="empty-text">Your cart is Empty</IonText>
            <p className="empty-subtext">You haven't added any items yet.</p>
            <IonButton
              className="browse-button"
              expand="block"
              onClick={() => setShowBYOKModal(true)}
            >
              Add Items to Cart
              <IonIcon slot="end" icon={chevronForward} />
            </IonButton>
          </div>
        ) : (
          <>
            <IonGrid>
              <IonRow>
                <IonCol>
                  {sortedCartItems.map((item) => {
                    console.log("Rendering cart item:", item);
                    return (
                      <IonItemSliding
                        key={item.id}
                        id={`cart-item-${item.cartId}`}
                      >
                        <IonItem
                          className="cart-product-item-container"
                          lines="full"
                        >
                          {/* Improved checkbox layout with proper spacing */}
                          <div
                            className="modern-checkbox-container"
                            slot="start"
                          >
                            <IonCheckbox
                              checked={selectedItems.includes(item.id)}
                              onIonChange={() => toggleItemSelection(item.id)}
                              className="cart-item-checkbox"
                            />
                          </div>

                          <div className="cart-badge-container">
                            <IonBadge
                              className="cart-size-badge"
                              style={{
                                backgroundColor: getSizeColor(
                                  item.productSize || "Default"
                                ),
                              }}
                            >
                              {getSizeAbbreviation(
                                item.productSize || "Default"
                              )}
                            </IonBadge>
                          </div>

                          <div className="cart-content-container">
                            <div className="cart-bottom-row">
                              <div className="product-name-container">
                                <IonText className="cart-name-text">
                                  {typeof item.productSize === "object"
                                    ? item.productSize.name
                                    : item.productSize || "Unknown Size"}
                                </IonText>
                              </div>
                              <IonButton
                                className="cart-delete-icon"
                                fill="clear"
                                onClick={() => removeItem(item.id)}
                              >
                                <IonIcon icon={trashSharp} color="danger" />
                              </IonButton>
                            </div>{" "}
                            <div className="cart-size-container">
                              <div className="cart-varieties-container">
                                {Array.isArray(item.productVarieties) &&
                                  item.productVarieties.length > 0 && (
                                    <>
                                      {" "}
                                      <div className="cart-varieties-text">
                                        {item.productVarieties.map(
                                          (variety: string, idx: number) => {
                                            const stockStatus =
                                              getStockStatusForVariety(
                                                item.id,
                                                variety
                                              );
                                            return (
                                              <span
                                                key={idx}
                                                className={`variety-stock-text variety-stock-${stockStatus.status}`}
                                              >
                                                {variety}:{" "}
                                                {stockStatus.status ===
                                                "pending"
                                                  ? "Loading..."
                                                  : `${stockStatus.quantity.toFixed(
                                                      0
                                                    )} `}
                                              </span>
                                            );
                                          }
                                        )}
                                      </div>
                                    </>
                                  )}
                              </div>

                              <div className="price-quantity-container">
                                <IonText className="cart-price-text">
                                  ₱{item.productPrice.toLocaleString()}
                                </IonText>
                                <div className="cart-quantity-control">
                                  <IonButton
                                    className="byok-quantity-button"
                                    fill="clear"
                                    size="small"
                                    onClick={() =>
                                      updateQuantity(
                                        item.id,
                                        (item.productQuantity || 1) - 1
                                      )
                                    }
                                  >
                                    <IonIcon icon={removeCircle} />
                                  </IonButton>
                                  <IonInput
                                    type="number"
                                    value={item.productQuantity || 1}
                                    min={1}
                                    max={99}
                                    onIonChange={(e) => {
                                      const value = parseInt(
                                        e.detail.value!,
                                        10
                                      );
                                      if (!isNaN(value) && value > 0) {
                                        // Update the quantity in Firestore
                                        updateQuantity(item.id, value);
                                      }
                                    }}
                                    className="quantity-input"
                                  />
                                  <IonButton
                                    className="byok-quantity-button"
                                    fill="clear"
                                    size="small"
                                    onClick={() =>
                                      updateQuantity(
                                        item.id,
                                        (item.productQuantity || 1) + 1
                                      )
                                    }
                                  >
                                    <IonIcon icon={addCircle} />
                                  </IonButton>
                                </div>
                              </div>
                            </div>
                          </div>
                        </IonItem>

                        <IonItemOptions side="end">
                          <IonItemOption
                            className="cart-delete-button"
                            onClick={() => removeItem(item.id)}
                          >
                            <IonIcon slot="icon-only" icon={trash} />
                          </IonItemOption>
                        </IonItemOptions>
                      </IonItemSliding>
                    );
                  })}
                </IonCol>
              </IonRow>
            </IonGrid>
          </>
        )}
      </IonContent>

      {cartItems.length > 0 && (
        <IonFooter>
          <IonToolbar className="product-footer">
            <div className="footer-content">
              <div className="total-container">
                <IonLabel className="total-label">Total: </IonLabel>
                <IonText className="total-price-text">
                  ₱{total.toLocaleString()}
                </IonText>
              </div>
              <div className="footer-action-button-container">
                <Link
                  to={{
                    pathname: "/home/cart/schedule",
                    state: {
                      selectedItems: cartItems.filter((item) =>
                        selectedItems.includes(item.id)
                      ),
                    },
                  }}
                  className="checkout-button-link"
                >
                  <IonButton
                    className="footer-action-button schedule-button"
                    disabled={selectedItems.length === 0}
                  >
                    Checkout{" "}
                    {selectedItems.length > 0
                      ? `(${selectedItems.length})`
                      : ""}
                    <IonIcon slot="start" icon={bag} />
                    <IonIcon slot="end" icon={chevronForward} />
                  </IonButton>
                </Link>
              </div>
            </div>
          </IonToolbar>
        </IonFooter>
      )}

      {/* Build Your Own Kakanin Modal */}
      <BuildYourOwnModal
        isOpen={showBYOKModal}
        onClose={() => setShowBYOKModal(false)}
        showToastMessage={handleShowToastMessage}
      />

      {/* Toast for stock limit notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="bottom"
        color="warning"
        buttons={[
          {
            text: "OK",
            role: "cancel",
          },
        ]}
      />
    </IonPage>
  );
};

export default Cart;
