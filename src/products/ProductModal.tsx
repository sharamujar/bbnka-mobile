import React, { useEffect, useState } from "react";
import {
  IonModal,
  IonContent,
  IonButton,
  IonIcon,
  IonImg,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonHeader,
  IonButtons,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonAccordion,
  IonAccordionGroup,
  IonText,
  IonFooter,
  IonTitle,
  IonRouterLink,
  IonToast,
  IonRadio,
  IonRadioGroup,
} from "@ionic/react";
import {
  close,
  star,
  time,
  restaurant,
  medkit,
  nutrition,
  alertCircleOutline,
  informationCircleOutline,
  snowOutline,
  checkmarkCircle,
  arrowForward,
  fastFood,
  chevronForward,
  layersOutline,
  calendarOutline,
  chevronBack,
  chevronBackSharp,
  chevronBackCircle,
  shapes,
} from "ionicons/icons";
import {
  collection,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../firebase-config";
import "../products/ProductModal.css";
import { ProductModalProps } from "../interfaces/interfaces";
import BuildYourOwnModal from "../components/BuildYourOwnModal";

interface Size {
  id: string; // This is the primary key
  sizeId?: string; // Optional backward compatibility
  name: string;
  dimensions: string;
  shape: string; // Changed from slices to shape
  price: number;
  maxVarieties: number;
  imageUrl: string;
  isPublished: boolean; // Added for testSizes
  published: boolean; // Added for testSizes
  varieties: string[];
  status: "pending" | "approved" | "rejected";
  type?: string; // Added type field to match with testStocks
}

// Interface for FixedSizeStock
interface FixedSizeStock {
  id: string;
  criticalLevel: number;
  expiryDate: string;
  lastUpdated: string;
  minimumStock: number;
  productionDate: string;
  quantity: number;
  size: string;
  type: string;
  variety: string;
}

// Interface for product stocks from testStocks collection
interface Stock {
  id: string;
  criticalLevel: number;
  lastUpdated: string;
  minimumStock: number;
  productId: string; // Maps to the product id in testProducts
  quantity: number;
  sizeId: string; // If specific to a size
  type: string; // Type of stock (e.g., 'tray')
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [productDetails, setProductDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [availableSizes, setAvailableSizes] = useState<Size[]>([]);
  const [showBuildYourOwn, setShowBuildYourOwn] = useState(false);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState("success");
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [varietyStocks, setVarietyStocks] = useState<Stock[]>([]);
  const [fixedSizeStocks, setFixedSizeStocks] = useState<FixedSizeStock[]>([]);

  // Fetch sizes and detailed product information when product changes
  useEffect(() => {
    if (!product) return;

    setLoading(true);

    // Fetch all available sizes
    const fetchSizes = async () => {
      try {
        // Changed from sizes collection to testSizes collection
        const querySnapshot = await getDocs(collection(db, "testSizes"));
        const sizeList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Ensure varieties is always an array, even if missing in the data
          varieties: doc.data().varieties || [],
        }));

        console.log("All test sizes:", sizeList);

        // More robust filtering for published sizes - checking both published and isPublished flags
        const publishedSizes = sizeList.filter(
          (size) =>
            size &&
            typeof size === "object" &&
            (("published" in size && size.published === true) ||
              ("isPublished" in size && size.isPublished === true))
        );

        setSizes(publishedSizes as Size[]);

        // Filter sizes that have the current product name in their varieties array
        const productName = product.name;
        console.log("Filtering sizes for product:", productName);

        const filteredSizes = publishedSizes.filter((size) => {
          // Check if size has varieties array
          if (!size.varieties || !Array.isArray(size.varieties)) {
            return false;
          }

          // Check if any variety in the varieties array matches the product name
          // Use more flexible matching by normalizing strings (trim whitespace, lowercase)
          return size.varieties.some((varietyName: string) => {
            if (typeof varietyName !== "string") return false;
            return (
              varietyName.trim().toLowerCase() ===
              productName.trim().toLowerCase()
            );
          });
        });

        console.log("Filtered sizes for this product:", filteredSizes);
        setAvailableSizes(filteredSizes as Size[]);
      } catch (error) {
        console.error("Error fetching sizes:", error);
      }
    };

    // Fetch additional product details if needed
    const fetchProductDetails = async () => {
      try {
        // This is where you could fetch additional product details
        // For now, we'll just simulate this by adding more information
        setProductDetails({
          ...product,
          nutritionalInfo: {
            calories: Math.floor(Math.random() * 300) + 100,
            protein: Math.floor(Math.random() * 5) + 1,
            carbs: Math.floor(Math.random() * 30) + 10,
            fats: Math.floor(Math.random() * 10) + 2,
          },
          bestseller: Math.random() > 0.5,
          preparationTime: Math.floor(Math.random() * 20) + 10,
          ingredients: [
            "Rice flour",
            "Coconut milk",
            "Brown sugar",
            "Vanilla extract",
            "Natural flavoring",
          ],
          allergens: ["Coconut", "May contain traces of nuts"],
          storage:
            "Best stored in refrigerator. Consume within 2 days of purchase.",
          preparation:
            "Served at room temperature. Can be gently heated for 10-15 seconds in a microwave.",
          rating: (Math.random() * 1.5 + 3.5).toFixed(1),
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching product details:", error);
        setLoading(false);
      }
    };

    fetchSizes();
    fetchProductDetails();
  }, [product]);

  // Reset UI state when the modal is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedSize(null);
      setShowSizeSelector(false);

      // Fetch stock information when modal opens
      fetchVarietyStocks();
      fetchFixedSizeStocks();
    }
  }, [isOpen]);

  // Fetch variety stocks
  const fetchVarietyStocks = async () => {
    try {
      const varietyStocksSnapshot = await getDocs(collection(db, "testStocks"));
      const varietyStocksData = varietyStocksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Stock[];
      console.log("Product Modal - Stock data fetched:", varietyStocksData);
      setVarietyStocks(varietyStocksData);
    } catch (error) {
      console.error("Error fetching stocks:", error);
    }
  };

  // Fetch fixed size stocks for bibingka in small and solo sizes
  const fetchFixedSizeStocks = async () => {
    try {
      const q = query(
        collection(db, "testStocks"),
        where("variety", "==", "Bibingka"),
        where("type", "==", "fixed")
      );
      const fixedStocksSnapshot = await getDocs(q);
      const fixedStocksData = fixedStocksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FixedSizeStock[];
      setFixedSizeStocks(fixedStocksData);
    } catch (error) {
      console.error("Error fetching fixed size stocks:", error);
    }
  };

  // Helper function to get fixed size stock for Bibingka
  const getFixedSizeStock = (sizeName: string): FixedSizeStock | undefined => {
    return fixedSizeStocks.find(
      (stock) =>
        stock.variety === product.name &&
        stock.size.toLowerCase() === sizeName.toLowerCase()
    );
  };

  // Helper function to get variety stock based on productId
  const getVarietyStock = (productId: string): number => {
    // Find the stock entry that matches the product ID
    const stockEntry = varietyStocks.find(
      (stock) => stock.productId === productId
    );

    // Return the quantity if found, otherwise return 0
    return stockEntry ? stockEntry.quantity : 0;
  };

  // Helper function to determine stock status
  const getStockStatus = (stock: FixedSizeStock | undefined) => {
    if (!stock) return { status: "unavailable", text: "Unavailable" };

    const { quantity, minimumStock, criticalLevel } = stock;

    if (quantity <= 0) {
      return {
        status: "outOfStock",
        text: "Out of Stock",
        color: "danger",
      };
    } else if (quantity <= criticalLevel) {
      return {
        status: "low",
        text: `Low: ${Math.round(quantity)} in stock`,
        color: "danger",
      };
    } else if (quantity <= minimumStock) {
      return {
        status: "low",
        text: `Limited: ${Math.round(quantity)} in stock`,
        color: "warning",
      };
    } else {
      return {
        status: "available",
        text: `Available: ${Math.round(quantity)} in stock`,
        color: "success",
      };
    }
  };

  // Helper function to determine stock status based on product ID and size type from testStocks
  const getProductStockStatus = (productId: string, sizeType?: string) => {
    // Find the stock entry that matches both the product ID and the size type (if provided)
    const stockEntry = varietyStocks.find(
      (stock) =>
        stock.productId === productId && (!sizeType || stock.type === sizeType)
    );

    if (!stockEntry)
      return {
        status: "unavailable",
        text: "Unavailable",
        color: "medium",
      };

    const { quantity, minimumStock, criticalLevel } = stockEntry;

    if (quantity <= 0) {
      return {
        status: "outOfStock",
        text: "Out of Stock",
        color: "danger",
      };
    } else if (quantity <= criticalLevel) {
      return {
        status: "low",
        text: `Low: ${Math.round(quantity)} in stock`,
        color: "danger",
      };
    } else if (quantity <= minimumStock) {
      return {
        status: "low",
        text: `Limited: ${Math.round(quantity)} in stock`,
        color: "warning",
      };
    } else {
      return {
        status: "available",
        text: `Available: ${Math.round(quantity)} in stock`,
        color: "success",
      };
    }
  };

  const handleClose = () => {
    // Reset selection states when closing the modal
    setSelectedSize(null);
    setShowSizeSelector(false);
    onClose();
  };

  const handleBuildYourOwn = () => {
    setShowBuildYourOwn(true);
    onClose(); // Close the product modal
  };

  const handleBuildYourOwnClose = () => {
    setShowBuildYourOwn(false);
  };

  // Handle size selection
  const handleSizeSelect = (size: Size) => {
    // Get stock status using product ID and size type for proper matching
    const stockStatus = getProductStockStatus(product.id, size.type);

    // Check if item is out of stock or unavailable
    const isOutOfStock = stockStatus.status === "outOfStock";
    const isUnavailable = stockStatus.status === "unavailable";

    // Only set the selected size if it's in stock and available
    if (!isOutOfStock && !isUnavailable) {
      setSelectedSize(size);
    } else if (isOutOfStock) {
      // Show toast message for out-of-stock items
      setToastMessage(`${size.name} size is currently out of stock`);
      setToastColor("warning");
      setShowToast(true);
    } else if (isUnavailable) {
      // Show toast message for unavailable items
      setToastMessage(`${size.name} size is currently unavailable`);
      setToastColor("medium");
      setShowToast(true);
    }
  };

  // Toggle size selector visibility
  const toggleSizeSelector = () => {
    setShowSizeSelector(!showSizeSelector);
  };

  // Add to cart functionality
  const addToCart = async (size: Size) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setToastMessage("Please login to add items to your cart");
      setToastColor("warning");
      setShowToast(true);
      return;
    }

    try {
      setIsAddingToCart(true); // Start loading indicator
      const cartCollectionRef = collection(
        db,
        "customers",
        currentUser.uid,
        "cart"
      );

      // Check if this product and size combination already exists in the cart
      const q = query(
        cartCollectionRef,
        where("productVarieties", "array-contains", product.name),
        where("productSize", "==", size.name)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Item already exists, update the quantity and price
        const existingItem = querySnapshot.docs[0];
        const existingData = existingItem.data();
        const currentQuantity = existingData.productQuantity || 1;
        const newQuantity = currentQuantity + 1;
        const originalPrice = existingData.originalPrice || size.price;
        const newPrice = originalPrice * newQuantity;

        await updateDoc(existingItem.ref, {
          productQuantity: newQuantity,
          productPrice: newPrice,
          updatedAt: new Date().toISOString(),
        });

        setToastMessage(`${product.name} added to cart successfully!`);
      } else {
        // Item doesn't exist, create a new one
        const cartId = doc(cartCollectionRef).id;

        await setDoc(doc(cartCollectionRef, cartId), {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          productSize: size.name,
          productVarieties: [product.name], // Add the product as a variety
          productQuantity: 1,
          productPrice: size.price,
          originalPrice: size.price,
          specialInstructions: null,
          cartId,
          userId: currentUser.uid,
        });

        setToastMessage(`${product.name} added to cart successfully!`);
      }

      setToastColor("success");
      setShowToast(true);

      // Reset selection state
      setSelectedSize(null);
      setShowSizeSelector(false);

      // Close modal after short delay
      setTimeout(() => {
        setIsAddingToCart(false); // Stop loading indicator
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setToastMessage("Failed to add item to cart. Please try again.");
      setToastColor("danger");
      setShowToast(true);
      setIsAddingToCart(false); // Stop loading indicator on error
    }
  };

  if (!product || loading) return null;

  return (
    <>
      <IonModal
        className="product-details-modal"
        isOpen={isOpen}
        canDismiss={true}
        onWillDismiss={onClose}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={handleClose}>
                <IonIcon className="close-btn" icon={close}></IonIcon>
              </IonButton>
            </IonButtons>
            <IonTitle>Product Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        {/* <IonToolbar className="product-details-toolbar">
          <IonButtons slot="start">
            <IonButton
              className="product-details-back-button"
              onClick={handleClose}
            >
              <IonIcon className="product-details-back-icon" icon={close} />
            </IonButton>
            <IonTitle className="title-toolbar">Product Details</IonTitle>
          </IonButtons>
          {productDetails?.bestseller && (
            <IonChip className="bestseller-chip" slot="end">
              Bestseller
            </IonChip>
          )}
        </IonToolbar> */}

        <IonContent className="product-details-content">
          <div className="product-details-container">
            <div className="product-details-img">
              <IonImg src={product.imageUrl} alt={product.name} />
            </div>

            <div className="product-details-content">
              <div className="product-details-header">
                <IonCardTitle>{product.name}</IonCardTitle>
              </div>

              <p className="product-details-description">
                {product.description}
              </p>

              {/* <div className="product-details-summary">
                {productDetails.preparationTime && (
                  <div className="detail-item">
                    <IonIcon icon={time} />
                    <span>{productDetails.preparationTime} mins</span>
                  </div>
                )}
                {productDetails.nutritionalInfo && (
                  <div className="detail-item">
                    <IonIcon icon={restaurant} />
                    <span>
                      {productDetails.nutritionalInfo.calories} calories
                    </span>
            </div>
          )}
        </div> */}

              {/* Size Information Section - For Display Only */}
              {!showSizeSelector && (
                <div className="product-sizes-info">
                  <div className="info-section-header">
                    <IonIcon icon={layersOutline} />
                    <h3 className="available-sizes-title">Available Sizes</h3>
                  </div>

                  {availableSizes.length > 0 ? (
                    <div className="sizes-info-table">
                      <div className="sizes-table-header">
                        <div className="size-column">Size</div>
                        <div className="dimensions-column">Dimensions</div>
                        <div className="slices-column">Shape</div>
                        <div className="price-column">Price</div>
                      </div>
                      <div className="sizes-table-body">
                        {[...availableSizes]
                          .sort((a, b) => b.price - a.price) // Sort from highest to lowest price
                          .map((size) => (
                            <div className="size-info-row" key={size.id}>
                              <div className="size-column">{size.name}</div>
                              <div className="dimensions-column">
                                {size.dimensions || "—"}
                              </div>
                              <div className="slices-column">
                                {size.shape || "—"}
                              </div>
                              <div className="price-column">₱{size.price}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="no-sizes-message">
                      <IonText color="medium">
                        This product is not currently available in any size.
                      </IonText>
                    </div>
                  )}

                  <div className="sizes-info-note">
                    <IonIcon icon={informationCircleOutline} />
                    <p>
                      Prices may vary based on size and special requirements.
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Size Selection Section - For Adding to Cart */}
              {showSizeSelector && (
                <div className="size-selection-container">
                  <div className="info-section-header">
                    <IonButton
                      className="back-button"
                      fill="clear"
                      onClick={toggleSizeSelector}
                    >
                      <IonIcon slot="icon-only" icon={chevronBackCircle} />
                    </IonButton>
                    <h3>Select Size for {product.name}</h3>
                  </div>

                  {availableSizes.length > 0 ? (
                    <IonRadioGroup
                      value={selectedSize?.id || ""}
                      onIonChange={(e) => {
                        const selectedSizeId = e.detail.value;
                        const size = availableSizes.find(
                          (s) => s.id === selectedSizeId
                        );
                        if (size) {
                          handleSizeSelect(size);
                        }
                      }}
                    >
                      <div className="interactive-sizes-list">
                        {[...availableSizes]
                          .sort((a, b) => b.price - a.price) // Sort from highest to lowest price
                          .map((size) => {
                            // Get stock information based on product ID and size type
                            const stockStatus = getProductStockStatus(
                              product.id,
                              size.type
                            ); // Check if item is out of stock or unavailable
                            const isOutOfStock =
                              stockStatus.status === "outOfStock";
                            const isUnavailable =
                              stockStatus.status === "unavailable";

                            return (
                              <div
                                className={`size-selection-item ${
                                  selectedSize?.id === size.id ? "selected" : ""
                                } ${
                                  isOutOfStock || isUnavailable
                                    ? "out-of-stock"
                                    : ""
                                }`}
                                key={size.id}
                                onClick={() => handleSizeSelect(size)}
                              >
                                <div className="size-selection-details">
                                  <div className="size-header">
                                    <h4 className="size-name">{size.name}</h4>
                                    {/* Display stock information */}
                                    <div className="stock-indicator">
                                      <IonBadge
                                        color={stockStatus.color || "medium"}
                                        className="stock-badge"
                                      >
                                        {stockStatus.text}
                                      </IonBadge>
                                    </div>
                                  </div>

                                  <div className="size-detail-item">
                                    <IonIcon icon={layersOutline} />
                                    {size.dimensions || "Standard"}
                                  </div>

                                  <div className="size-detail-item">
                                    <IonIcon icon={shapes} />
                                    {size.shape || "rectangle"}
                                  </div>
                                </div>

                                {/* Radio button with price on top */}
                                <div className="radio-container">
                                  <div className="size-selection-price">
                                    <span className="price-tag">
                                      ₱{size.price}
                                    </span>
                                  </div>{" "}
                                  <IonRadio
                                    value={size.id}
                                    mode="md"
                                    disabled={isOutOfStock || isUnavailable}
                                    className="custom-radio"
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </IonRadioGroup>
                  ) : (
                    <div className="no-sizes-message">
                      <IonText color="medium">
                        This product is not currently available in any size.
                      </IonText>
                    </div>
                  )}
                </div>
              )}

              {/* {productDetails.ingredients && (
                <div className="product-details-section">
                  <div className="section-title">
                    <IonIcon icon={nutrition} />
                    <span>Ingredients</span>
                  </div>
                  <div className="ingredients-list">
                    {productDetails.ingredients.map(
                      (ingredient: string, index: number) => (
                        <IonChip key={index} className="ingredient-chip">
                          {ingredient}
                        </IonChip>
                      )
                    )}
                  </div>
                </div>
              )} */}

              {/* {productDetails.allergens && (
                <div className="product-details-section">
                  <div className="section-title">
                    <IonIcon icon={alertCircleOutline} />
                    <span>Allergen Information</span>
                  </div>
                  <div className="allergen-info">
                    {productDetails.allergens.map(
                      (allergen: string, index: number) => (
                        <div key={index} className="allergen-item">
                          <span className="allergen-bullet">•</span> {allergen}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )} */}

              {/* {productDetails.preparation && (
                <div className="product-details-section">
                  <div className="section-title">
                    <IonIcon icon={informationCircleOutline} />
                    <span>Preparation</span>
                  </div>
                  <p className="additional-info-text">
                    {productDetails.preparation}
                  </p>
                </div>
              )} */}

              {/* {productDetails.storage && (
                <div className="product-details-section">
                  <div className="section-title">
                    <IonIcon icon={snowOutline} />
                    <span>Storage</span>
                  </div>
                  <p className="additional-info-text">{productDetails.storage}</p>
                </div>
              )} */}

              {/* {productDetails.nutritionalInfo && (
                <div className="product-details-section">
                  <div className="section-title">
                    <IonIcon icon={nutrition} />
                    <span>Nutritional Information</span>
                  </div>
                  <IonList className="nutritional-list">
                    <IonItem>
                      <IonLabel>Calories</IonLabel>
                      <IonBadge slot="end">
                        {productDetails.nutritionalInfo.calories} kcal
                      </IonBadge>
                    </IonItem>
                    <IonItem>
                      <IonLabel>Protein</IonLabel>
                      <IonBadge slot="end">
                        {productDetails.nutritionalInfo.protein}g
                      </IonBadge>
                    </IonItem>
                    <IonItem>
                      <IonLabel>Carbohydrates</IonLabel>
                      <IonBadge slot="end">
                        {productDetails.nutritionalInfo.carbs}g
                      </IonBadge>
                    </IonItem>
                    <IonItem>
                      <IonLabel>Fats</IonLabel>
                      <IonBadge slot="end">
                        {productDetails.nutritionalInfo.fats}g
                      </IonBadge>
                    </IonItem>
                  </IonList>
                </div>
              )} */}

              {/* <div className="product-details-section">
                <div className="section-title">
                  <IonIcon icon={restaurant} />
                  <span>You May Also Like</span>
                </div>
                <div className="recommended-products">
              <IonGrid>
                <IonRow>
                      
                      {[1, 2].map((index) => (
                        <IonCol size="6" key={index}>
                          <div
                            className="recommended-product"
                            onClick={handleClose}
                          >
                            <div className="recommended-product-image">
                              <IonImg
                                src={`/assets/product${index + 1}.jpg`}
                                alt={`Recommended product ${index}`}
                              />
                            </div>
                            <div className="recommended-product-info">
                              <div className="recommended-product-name">
                                {index === 0
                                  ? "Bibingka Special"
                                  : "Puto Bumbong"}
                              </div>
                              <div className="recommended-product-price">
                                ₱{(index + 1) * 85}
                              </div>
                            </div>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
              </div>
              </div> */}
            </div>
          </div>
        </IonContent>

        <IonFooter className="product-modal-footer">
          <IonToolbar>
            <div className="build-your-own-footer">
              {showSizeSelector ? (
                <div className="size-selection-footer">
                  {/* <h4>
                    {selectedSize
                      ? `${selectedSize.name} - ₱${selectedSize.price}`
                      : "Select a size above"}
                  </h4> */}
                  <div className="modal-footer-buttons select-size-footer">
                    <IonButton
                      className="footer-back-action-button select-size-back"
                      onClick={toggleSizeSelector}
                      fill="outline"
                      disabled={isAddingToCart}
                    >
                      <IonIcon icon={chevronBack} slot="start" />
                      Back
                    </IonButton>
                    <IonButton
                      className="footer-action-button add-to-cart-button"
                      disabled={!selectedSize || isAddingToCart}
                      onClick={() => {
                        if (selectedSize) {
                          addToCart(selectedSize);
                        }
                      }}
                    >
                      {isAddingToCart ? (
                        "Adding..."
                      ) : (
                        <>
                          <IonIcon slot="start" icon={fastFood} />
                          ADD TO CART
                        </>
                      )}
                    </IonButton>
                  </div>
                </div>
              ) : (
                <>
                  <div className="product-modal-footer-buttons order-now-btn">
                    <IonButton
                      className="footer-back-action-button select-size-back"
                      onClick={toggleSizeSelector}
                      fill="outline"
                    >
                      <IonIcon icon={fastFood} slot="start" />
                      Order Now
                    </IonButton>

                    <div className="options-divider">
                      <div className="divider-text">OR</div>
                    </div>

                    <IonButton
                      className="footer-action-button"
                      onClick={handleBuildYourOwn}
                      fill="solid"
                    >
                      <IonIcon icon={chevronForward} slot="end" />
                      Customize Order
                    </IonButton>
                  </div>
                </>
              )}
            </div>
          </IonToolbar>
        </IonFooter>
      </IonModal>

      <BuildYourOwnModal
        isOpen={showBuildYourOwn}
        onClose={handleBuildYourOwnClose}
        showToastMessage={(message: string, success: boolean) => {
          // Handle toast message
        }}
      />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        color={toastColor}
      />
    </>
  );
};

export default ProductModal;
