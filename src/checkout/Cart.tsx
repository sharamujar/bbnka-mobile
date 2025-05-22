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
import { determineProductType } from "./StockHelper";

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
  }; // Function to fetch stock information for a specific product
  const fetchStockInfo = async (productId: string, productType: string) => {
    try {
      console.log(
        `Cart - Fetching stock info for productId=${productId}, type=${
          productType || "null"
        }`
      );

      // Validate inputs to prevent empty queries
      if (!productId) {
        console.log("No productId provided, can't fetch stock info");
        return null;
      }

      const stocksRef = collection(db, "testStocks"); // First try with the specific product type
      if (productType) {
        const typeLower = productType.toLowerCase();
        console.log(`Cart - Querying with type=${typeLower}`);

        // Try different variations of the product type (exact match and starting with)
        const potentialTypes = [typeLower];

        // Map common type variations
        if (typeLower === "small" || typeLower.startsWith("small")) {
          potentialTypes.push("small");
        } else if (typeLower === "solo" || typeLower.startsWith("solo")) {
          potentialTypes.push("solo");
        } else if (typeLower === "tray" || typeLower.includes("tray")) {
          potentialTypes.push("tray");
        } else if (typeLower === "bilao" || typeLower.includes("bilao")) {
          potentialTypes.push("bilao");
        }

        // Try each potential type
        for (const type of potentialTypes) {
          const typeQ = query(
            stocksRef,
            where("productId", "==", productId),
            where("type", "==", type)
          );

          const typeSnapshot = await getDocs(typeQ);
          if (!typeSnapshot.empty) {
            const stockData = typeSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            console.log(
              `Cart - Found ${stockData.length} stock entries with type=${type} match:`,
              stockData
            );
            return stockData;
          }
        }

        console.log(
          `Cart - No stock found with type ${productType} or variations, trying fallback`
        );
      }

      // If no results or no product type specified, try without type constraint
      console.log(`Cart - Trying fallback query for productId=${productId}`);
      const fallbackQ = query(stocksRef, where("productId", "==", productId));
      const fallbackSnapshot = await getDocs(fallbackQ);

      if (!fallbackSnapshot.empty) {
        const stockData = fallbackSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(
          `Cart - Found ${stockData.length} stock entries with fallback query:`,
          stockData
        );
        return stockData;
      } // If we still don't have stock data, try different product types as a last resort
      const productTypes = ["small", "solo", "tray", "bilao", "fixed"];

      // If productType is provided but not in our standard list, add it
      if (productType && !productTypes.includes(productType.toLowerCase())) {
        productTypes.unshift(productType.toLowerCase());
      }

      for (const type of productTypes) {
        console.log(
          `Cart - Trying type=${type} as last resort for productId=${productId}`
        );

        const typeQ = query(stocksRef, where("type", "==", type));

        const typeSnapshot = await getDocs(typeQ);
        if (!typeSnapshot.empty) {
          // Filter results to match our product ID
          const stockData = typeSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter(
              (item: any) =>
                item.productId === productId ||
                (item.variety &&
                  item.variety.toLowerCase() === productId.toLowerCase())
            );

          if (stockData.length > 0) {
            console.log(
              `Cart - Found ${stockData.length} stock entries with type=${type} as last resort:`,
              stockData
            );
            return stockData;
          }
        }
      }

      console.log(`Cart - No stock found for productId=${productId}`);
      return null;
    } catch (error) {
      console.error("Error fetching stock info:", error);
      return null;
    }
  };
  // Function to update stock information for all cart items
  const updateStockInfo = async () => {
    const stocksMap: Record<string, any> = {};
    console.log("Updating stock info for", cartItems.length, "items");

    for (const item of cartItems) {
      try {
        if (item.productId) {
          // For regular products from ProductModal
          console.log(
            `Processing item ${item.id} with productId=${item.productId}`
          );

          // Fetch stock directly from testStocks collection
          const stocksRef = collection(db, "testStocks");
          const stockQuery = query(
            stocksRef,
            where("productId", "==", item.productId)
          );
          if (item.productType) {
            // Try with product type first
            const typeLower = item.productType.toLowerCase();

            // Define potential type variations based on the actual type
            const potentialTypes = [typeLower];

            // Map common type variations
            if (typeLower === "small" || typeLower.startsWith("small")) {
              potentialTypes.push("small");
            } else if (typeLower === "solo" || typeLower.startsWith("solo")) {
              potentialTypes.push("solo");
            } else if (typeLower === "tray" || typeLower.includes("tray")) {
              potentialTypes.push("tray");
            } else if (typeLower === "bilao" || typeLower.includes("bilao")) {
              potentialTypes.push("bilao");
            }

            // Try each potential type
            let stockFound = false;
            for (const type of potentialTypes) {
              if (stockFound) continue;

              const typedStockQuery = query(
                stocksRef,
                where("productId", "==", item.productId),
                where("type", "==", type)
              );

              const typedStockSnapshot = await getDocs(typedStockQuery);
              if (!typedStockSnapshot.empty) {
                const stockData = typedStockSnapshot.docs[0].data();
                console.log(
                  `Found stock with type=${type} for ${item.productId}:`,
                  stockData
                );
                stocksMap[item.id] = {
                  quantity: stockData.quantity || 0,
                  minimumStock: stockData.minimumStock || 10,
                  criticalLevel: stockData.criticalLevel || 5,
                  type: type, // Store the actual type that was found
                };
                stockFound = true;
                continue;
              }
            }

            // If we found a stock with one of the potential types, skip the fallback query
            if (stockFound) continue;
          }

          // Fallback to query without type constraint
          const stockSnapshot = await getDocs(stockQuery);
          if (!stockSnapshot.empty) {
            const stockData = stockSnapshot.docs[0].data();
            console.log(`Found stock for ${item.productId}:`, stockData);
            stocksMap[item.id] = {
              quantity: stockData.quantity || 0,
              minimumStock: stockData.minimumStock || 10,
              criticalLevel: stockData.criticalLevel || 5,
            };
          } else {
            // If still no data, check for variety-based stock
            const varietyQuery = query(
              stocksRef,
              where("variety", "==", item.productVarieties?.[0] || "")
            );

            const varietySnapshot = await getDocs(varietyQuery);
            if (!varietySnapshot.empty) {
              const stockData = varietySnapshot.docs[0].data();
              console.log(
                `Found stock by variety for ${item.productVarieties?.[0]}:`,
                stockData
              );
              stocksMap[item.id] = {
                quantity: stockData.quantity || 0,
                minimumStock: stockData.minimumStock || 10,
                criticalLevel: stockData.criticalLevel || 5,
              };
            }
          }
        } else if (item.productIds && Array.isArray(item.productIds)) {
          // For products with multiple varieties (not just bilao)
          const multiStockInfo = [];
          for (let i = 0; i < item.productIds.length; i++) {
            const productId = item.productIds[i];
            const productVariety = item.productVarieties?.[i] || null;

            if (productId) {
              // Try to get stock data with the specified product type first
              if (item.productType) {
                const typeLower = item.productType.toLowerCase();
                console.log(
                  `Checking ${productVariety} with type=${typeLower}`
                );

                // Define potential type variations based on the actual type
                const potentialTypes = [typeLower];

                // Map common type variations
                if (typeLower === "small" || typeLower.startsWith("small")) {
                  potentialTypes.push("small");
                } else if (
                  typeLower === "solo" ||
                  typeLower.startsWith("solo")
                ) {
                  potentialTypes.push("solo");
                } else if (typeLower === "tray" || typeLower.includes("tray")) {
                  potentialTypes.push("tray");
                } else if (
                  typeLower === "bilao" ||
                  typeLower.includes("bilao")
                ) {
                  potentialTypes.push("bilao");
                }

                // Try each potential type
                let stockFound = false;
                for (const type of potentialTypes) {
                  if (stockFound) continue;

                  const typedStockQuery = query(
                    collection(db, "testStocks"),
                    where("productId", "==", productId),
                    where("type", "==", type)
                  );

                  const typedStockSnapshot = await getDocs(typedStockQuery);
                  if (!typedStockSnapshot.empty) {
                    const stockData = typedStockSnapshot.docs[0].data();
                    console.log(
                      `Found ${productVariety} stock with type=${type}:`,
                      stockData
                    );
                    multiStockInfo.push({
                      variety: productVariety,
                      stockInfo: {
                        quantity: stockData.quantity || 0,
                        minimumStock: stockData.minimumStock || 10,
                        criticalLevel: stockData.criticalLevel || 5,
                        type: type, // Store the actual type that was found
                      },
                    });
                    stockFound = true;
                  }
                }

                // If stock was found with one of the potential types, continue to next variety
                if (stockFound) continue;
              }

              // Fallback to query without type constraint if no stock found with specific type
              const stocksRef = collection(db, "testStocks");
              const stockQuery = query(
                stocksRef,
                where("productId", "==", productId)
              );

              const stockSnapshot = await getDocs(stockQuery);
              if (!stockSnapshot.empty) {
                const stockData = stockSnapshot.docs[0].data();
                console.log(
                  `Found ${productVariety} stock without type constraint:`,
                  stockData
                );
                multiStockInfo.push({
                  variety: productVariety,
                  stockInfo: {
                    quantity: stockData.quantity || 0,
                    minimumStock: stockData.minimumStock || 10,
                    criticalLevel: stockData.criticalLevel || 5,
                    type: stockData.type || "unknown",
                  },
                });
              }
            }
          }

          if (multiStockInfo.length > 0) {
            stocksMap[item.id] = multiStockInfo;
          }
        }
      } catch (error) {
        console.error(`Error processing stock for item ${item.id}:`, error);
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

              // Determine the appropriate product type based on item properties
              let productType = item.productType;
              if (!productType) {
                // Try to infer product type from size or other properties
                if (item.productSize) {
                  const sizeName =
                    typeof item.productSize === "object"
                      ? item.productSize.name?.toLowerCase()
                      : item.productSize.toLowerCase();

                  if (sizeName) {
                    if (sizeName.includes("small")) {
                      productType = "small";
                    } else if (sizeName.includes("solo")) {
                      productType = "solo";
                    } else if (sizeName.includes("tray")) {
                      productType = "tray";
                    } else if (sizeName.includes("bilao")) {
                      productType = "bilao";
                    } else {
                      productType = "bilao"; // Default if unable to determine
                    }
                  } else {
                    productType = "bilao"; // Default if size name is undefined
                  }
                } else {
                  productType = "bilao"; // Default if no size info available
                }
              }

              updates.push({
                itemId: item.id,
                data: {
                  productIds: productIds,
                  productType: productType,
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

              // Determine the appropriate product type based on item properties
              let productType = item.productType;
              if (!productType) {
                // Try to infer product type from size or other properties
                if (item.productSize) {
                  const sizeName =
                    typeof item.productSize === "object"
                      ? item.productSize.name?.toLowerCase()
                      : item.productSize.toLowerCase();

                  if (sizeName) {
                    if (sizeName.includes("small")) {
                      productType = "small";
                    } else if (sizeName.includes("solo")) {
                      productType = "solo";
                    } else if (sizeName.includes("tray")) {
                      productType = "tray";
                    } else if (sizeName.includes("bilao")) {
                      productType = "bilao";
                    } else {
                      productType = "bilao"; // Default if unable to determine
                    }
                  } else {
                    productType = "bilao"; // Default if size name is undefined
                  }
                } else {
                  productType = "bilao"; // Default if no size info available
                }
              }

              updates.push({
                itemId: item.id,
                data: {
                  productId: productId,
                  productType: productType,
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
    // Check if the item is out of stock
    if (isItemOutOfStock(itemId)) {
      // Display a toast notification to inform the user
      setToastMessage("Cannot select out of stock item");
      setShowToast(true);
      return; // Don't allow selection of out-of-stock items
    }

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
      // Otherwise select all items that are in stock
      const inStockItemIds = cartItems
        .filter((item) => !isItemOutOfStock(item.id))
        .map((item) => item.id);

      setSelectedItems(inStockItemIds);

      // If some items were out of stock and not selected, show a message
      if (inStockItemIds.length < cartItems.length) {
        setToastMessage("Out of stock items cannot be selected");
        setShowToast(true);
      }
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
    if (
      !loading &&
      cartItems.length > 0 &&
      Object.keys(productStocks).length > 0
    ) {
      // By default, select all items that are in stock
      const inStockItemIds = cartItems
        .filter((item) => !isItemOutOfStock(item.id))
        .map((item) => item.id);

      setSelectedItems(inStockItemIds);
    }
  }, [loading, cartItems, productStocks]);

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

    // Check available stock and round off the quantity
    const availableStock = getAvailableStock(cartId);
    const roundedQuantity = Math.round(newQuantity);

    // If requested quantity exceeds available stock, show message and use available stock instead
    if (roundedQuantity > availableStock && availableStock > 0) {
      setToastMessage(`Only ${availableStock} item(s) available in stock`);
      setShowToast(true);
      newQuantity = availableStock;
    }

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
  // Helper function to check if an item is out of stock
  const isItemOutOfStock = (itemId: string) => {
    const stockData = productStocks[itemId];

    // Consider item out of stock if no stock data is available
    if (!stockData) {
      return true;
    }

    // For direct quantity objects
    if (!Array.isArray(stockData)) {
      // If quantity is 0 or undefined/null, item is out of stock
      return stockData.quantity === 0 || stockData.quantity === undefined;
    }

    // For arrays (multiple varieties), check if all varieties are out of stock
    if (stockData.length === 0) {
      return true;
    }

    // Check if any of the varieties have stock
    return stockData.every((stockItem) => {
      const stockInfo = Array.isArray(stockItem.stockInfo)
        ? stockItem.stockInfo[0]
        : stockItem.stockInfo;

      return !stockInfo || stockInfo.quantity === 0;
    });
  };

  // Helper function to get stock status for a single variety
  const getStockStatusForVariety = (itemId: string, varietyName: string) => {
    const stockData = productStocks[itemId];

    // Handle missing stock data
    if (!stockData) {
      console.log(`No stock data for item ${itemId}`);
      return { status: "pending", quantity: 0 };
    }

    // Handle direct quantity objects from ProductModal
    if (!Array.isArray(stockData)) {
      console.log(
        `Stock data for ${itemId} is not an array, checking if it has quantity directly`
      );

      if (stockData.quantity !== undefined) {
        const stockLevel = stockData.quantity || 0;
        const minStock = stockData.minimumStock || 10; // Default if missing
        const criticalLevel = stockData.criticalLevel || 5; // Default if missing

        let status = "normal";
        if (stockLevel <= criticalLevel) {
          status = "critical";
        } else if (stockLevel <= minStock) {
          status = "low";
        }

        console.log(`Direct stock for ${itemId}: ${stockLevel} (${status})`);
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
      }

      return { status: "unknown", quantity: 0 };
    }

    // Handle array of stock data (for bilao products with multiple varieties)
    // Find the stock data for this specific variety
    const varietyStock = stockData.find(
      (stock) => stock.variety === varietyName
    );

    if (!varietyStock) {
      console.log(
        `No variety stock found for ${varietyName} in item ${itemId}`
      );
      return { status: "unknown", quantity: 0 };
    }

    if (!varietyStock.stockInfo) {
      console.log(`No stockInfo for variety ${varietyName} in item ${itemId}`);
      return { status: "unknown", quantity: 0 };
    }

    // Handle both array and direct object formats for stockInfo
    let stockItem;
    if (Array.isArray(varietyStock.stockInfo)) {
      if (varietyStock.stockInfo.length === 0) {
        return { status: "unknown", quantity: 0 };
      }
      stockItem = varietyStock.stockInfo[0];
    } else {
      stockItem = varietyStock.stockInfo;
    }

    const stockLevel = stockItem.quantity || 0;
    const minStock = stockItem.minimumStock || 10; // Default values if missing
    const criticalLevel = stockItem.criticalLevel || 5;

    let status = "normal";
    if (stockLevel <= criticalLevel) {
      status = "critical";
    } else if (stockLevel <= minStock) {
      status = "low";
    }

    console.log(
      `Stock for ${itemId}, variety ${varietyName}: ${stockLevel} (${status})`
    );
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
  }; // Function to get available stock quantity for an item
  const getAvailableStock = (itemId: string): number => {
    const stockData = productStocks[itemId];

    // If no stock data available, return 0 (out of stock)
    if (!stockData) {
      return 0;
    }

    // For direct quantity objects
    if (!Array.isArray(stockData)) {
      // If quantity is undefined/null, item has no stock data
      return stockData.quantity !== undefined
        ? Math.round(stockData.quantity)
        : 0;
    }

    // For arrays (multiple varieties), get the lowest stock among varieties
    if (stockData.length === 0) {
      return 0;
    }

    // Find the lowest stock quantity among all varieties
    const lowestStock = stockData.reduce((lowest, stockItem) => {
      const stockInfo = Array.isArray(stockItem.stockInfo)
        ? stockItem.stockInfo[0]
        : stockItem.stockInfo;

      const quantity =
        stockInfo?.quantity !== undefined ? Math.round(stockInfo.quantity) : 0;
      return Math.min(lowest, quantity);
    }, Infinity);

    return lowestStock === Infinity ? 0 : lowestStock;
  };

  const sortedCartItems = [...cartItems].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  }); // Helper function to render stock information
  const renderStockInfo = (itemId: string) => {
    const stockData = productStocks[itemId];

    if (!stockData) {
      return (
        <IonText className="stock-info-pending">Loading stock info...</IonText>
      );
    }

    // Handle direct quantity objects (from ProductModal)
    if (stockData.quantity !== undefined) {
      // This is a direct stock object
      const stockLevel = stockData.quantity || 0;
      const minStock = stockData.minimumStock || 10; // Default if missing
      const criticalLevel = stockData.criticalLevel || 5; // Default if missing
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
              <span>Stock: {Math.round(stockLevel)}</span>
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

    if (Array.isArray(stockData)) {
      // Multiple varieties
      return (
        <div className="stock-info-container">
          {stockData.map((stock, index) => {
            if (!stock.stockInfo) return null;

            // Handle both array and direct object cases
            let stockItem;
            if (Array.isArray(stock.stockInfo)) {
              if (stock.stockInfo.length === 0) return null;
              stockItem = stock.stockInfo[0];
            } else {
              stockItem = stock.stockInfo;
            }

            if (!stockItem) return null;

            const stockLevel = stockItem.quantity || 0;
            const minStock = stockItem.minimumStock || 10; // Default if missing
            const criticalLevel = stockItem.criticalLevel || 5; // Default if missing
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
                    <span>Stock: {Math.round(stockLevel)}</span>
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
    } else if (stockData && Array.isArray(stockData) && stockData.length > 0) {
      // Single item as array
      const stockItem = stockData[0];
      const stockLevel = stockItem.quantity || 0;
      const minStock = stockItem.minimumStock || 10;
      const criticalLevel = stockItem.criticalLevel || 5;
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
              <span>Stock: {Math.round(stockLevel)}</span>
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
                        {" "}
                        <IonItem
                          className={`cart-product-item-container ${
                            isItemOutOfStock(item.id)
                              ? "cart-item-out-of-stock"
                              : ""
                          }`}
                          lines="full"
                        >
                          {/* Improved checkbox layout with proper spacing */}{" "}
                          <div
                            className={`modern-checkbox-container ${
                              isItemOutOfStock(item.id) ? "out-of-stock" : ""
                            }`}
                            slot="start"
                          >
                            <IonCheckbox
                              checked={selectedItems.includes(item.id)}
                              onIonChange={() => toggleItemSelection(item.id)}
                              className={`cart-item-checkbox ${
                                isItemOutOfStock(item.id)
                                  ? "disabled-checkbox"
                                  : ""
                              }`}
                              disabled={isItemOutOfStock(item.id)}
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
                                {" "}
                                <IonText className="cart-name-text">
                                  {typeof item.productSize === "object"
                                    ? item.productSize.name
                                    : item.productSize || "Unknown Size"}
                                  {/* {isItemOutOfStock(item.id) && (
                                    <span className="cart-item-out-of-stock-label">
                                      {" "}
                                      OUT OF STOCK
                                    </span>
                                  )} */}
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
                                  </IonButton>{" "}
                                  <IonInput
                                    type="number"
                                    value={item.productQuantity || 1}
                                    min={1}
                                    max={getAvailableStock(item.id) || 1}
                                    onIonChange={(e) => {
                                      const value = parseInt(
                                        e.detail.value!,
                                        10
                                      );
                                      if (!isNaN(value) && value > 0) {
                                        // Update the quantity in Firestore with stock limit check
                                        updateQuantity(item.id, value);
                                      }
                                    }}
                                    className="quantity-input"
                                  />
                                  <IonButton
                                    className="byok-quantity-button"
                                    fill="clear"
                                    size="small"
                                    disabled={
                                      (item.productQuantity || 1) >=
                                      getAvailableStock(item.id)
                                    }
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
                {" "}
                <Link
                  to={{
                    pathname: "/home/cart/schedule",
                    state: {
                      selectedItems: cartItems.filter(
                        (item) =>
                          selectedItems.includes(item.id) &&
                          !isItemOutOfStock(item.id)
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
