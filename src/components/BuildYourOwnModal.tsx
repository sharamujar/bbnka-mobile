import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonFooter,
  IonCheckbox,
  IonToast,
  IonText,
  IonImg,
  IonRouterLink,
  IonProgressBar,
  IonBadge,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import {
  close,
  addCircleOutline,
  removeCircleOutline,
  chevronForward,
  chevronBack,
  checkmarkCircle,
  cartOutline,
  arrowBackCircle,
  chevronForwardCircle,
  chevronBackCircleOutline,
  removeCircle,
  addCircle,
  checkmarkOutline,
  arrowBackOutline,
  arrowForwardOutline,
  arrowForward,
  alertCircleOutline,
  addOutline,
  calendarOutline, // Added missing calendarOutline icon
} from "ionicons/icons";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase-config";
import "./BuildYourOwnModal.css";
import { Size } from "../interfaces/interfaces";
import { Varieties } from "../interfaces/interfaces";
import { BuildYourOwnModalProps } from "../interfaces/interfaces";
import { Product } from "../interfaces/interfaces";

// Add Stock interface
interface Stock {
  id?: string;
  criticalLevel: number;
  minimumStock: number;
  productId: string;
  quantity: number;
  sizeId: string;
  type: string;
}

// Add FixedSizeStock interface
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

const BuildYourOwnModal: React.FC<BuildYourOwnModalProps> = ({
  isOpen,
  onClose,
  showToastMessage,
}) => {
  const history = useHistory();
  // States for sizes and varieties
  const [step, setStep] = useState(1);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [varieties, setVarieties] = useState<Varieties[]>([]);
  const [filteredVarieties, setFilteredVarieties] = useState<Varieties[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  // Remove sizeStocks state
  // Add state for variety stocks
  const [varietyStocks, setVarietyStocks] = useState<Stock[]>([]);
  // Add state for fixed size stocks
  const [fixedSizeStocks, setFixedSizeStocks] = useState<FixedSizeStock[]>([]);

  // Selected options
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedVarieties, setSelectedVarieties] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // UI states
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showAddedToCartToast, setShowAddedToCartToast] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Calculated total
  const [totalPrice, setTotalPrice] = useState(0);

  // const getSizeImage = (sizeName: string): string => {
  //   const sizeImages: Record<string, string> = {
  //     "Big Bilao": "/assets/bilao.webp",
  //     Tray: "/assets/rectangle.webp",
  //     Small: "/assets/round.webp",
  //     "Half-Tray": "/assets/rectangle.webp",
  //     Solo: "/assets/round.webp",
  //     "1/4 Slice": "/assets/slice1.webp",
  //   };

  //   return sizeImages[sizeName] ?? "/assets/default.png";
  // };

  // Fetch sizes and varieties
  useEffect(() => {
    const fetchSizes = async () => {
      try {
        // Using testSizes collection
        const sizesSnapshot = await getDocs(collection(db, "testSizes"));
        const sizesData = sizesSnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log(`BYOM - Size ${doc.id} data:`, data);
          return {
            sizeId: doc.id,
            ...data,
            // Check both potential field names for varieties and ensure it's always an array
            varieties: data.varieties || data.variety || [],
          };
        }) as Size[];
        console.log("BYOM - All sizes data:", sizesData);

        // More robust filtering with runtime checks for production build
        const approvedPublishedSizes = sizesData.filter(
          (size) =>
            size &&
            typeof size === "object" &&
            (("published" in size && size.published === true) ||
              ("isPublished" in size && size.isPublished === true))
        );
        setSizes(approvedPublishedSizes);
      } catch (error) {
        console.error("Error fetching sizes:", error);
        showToastMessage("Failed to load sizes", false);
      }
    };

    const fetchVarieties = async () => {
      try {
        const varietiesSnapshot = await getDocs(collection(db, "varieties"));
        const varietiesData = varietiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Varieties[];
        setVarieties(varietiesData);
      } catch (error) {
        console.error("Error fetching varieties:", error);
        showToastMessage("Failed to load varieties", false);
      }
    };

    const fetchProducts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, "testProducts"));
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        // Filter for only published products
        const publishedProducts = productsData.filter(
          (product) =>
            product &&
            typeof product === "object" &&
            "published" in product &&
            product.published === true
        );
        setProducts(publishedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        showToastMessage("Failed to load products", false);
      }
    };

    const fetchVarietyStocks = async () => {
      try {
        // Fetch all stock data from testStocks collection
        const stocksSnapshot = await getDocs(collection(db, "testStocks"));
        const stocksData = stocksSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Stock[];

        console.log("BYOM - Stocks data:", stocksData);
        setVarietyStocks(stocksData);
      } catch (error) {
        console.error("Error fetching stocks:", error);
      }
    };

    // Add function to fetch fixed size stocks for bibingka in small and solo sizes
    const fetchFixedSizeStocks = async () => {
      try {
        // Create a query to get fixed size stocks for bibingka in small and solo sizes
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

        console.log(
          "BYOM - Fixed size stocks data for Bibingka:",
          fixedStocksData
        );
        setFixedSizeStocks(fixedStocksData);
      } catch (error) {
        console.error("Error fetching fixed size stocks:", error);
      }
    };

    if (isOpen) {
      fetchSizes();
      fetchVarieties();
      fetchProducts();
      fetchVarietyStocks(); // Fetch variety stocks when modal opens
      fetchFixedSizeStocks(); // Fetch fixed size stocks for bibingka
    }
  }, [isOpen, showToastMessage]);

  useEffect(() => {
    const fetchProductsForSelectedSize = async () => {
      if (selectedSize) {
        console.log("🔍 Selected size ID:", selectedSize);

        // Get the selected size object
        const selectedSizeObj = sizes.find(
          (size) => size.sizeId === selectedSize
        );
        console.log("📏 Selected size object:", selectedSizeObj);

        if (selectedSizeObj) {
          // Get varieties directly from Firestore for the selected size
          try {
            // Use the products state variable that's already filtered for published items
            // instead of fetching again from Firestore
            console.log("🍰 Using filtered published products:", products);

            // Get the varieties array from the selected size
            let varietyNames: string[] = [];

            if (selectedSizeObj.varieties) {
              if (Array.isArray(selectedSizeObj.varieties)) {
                // Handle direct array of strings
                varietyNames = selectedSizeObj.varieties.filter(
                  (v) => typeof v === "string"
                );

                // If it's an empty array or non-string values, try checking if it has numeric indices
                if (varietyNames.length === 0) {
                  varietyNames = Object.values(
                    selectedSizeObj.varieties
                  ).filter((value) => typeof value === "string");
                }
              } else if (typeof selectedSizeObj.varieties === "object") {
                // Handle object with properties like {0: "Bibingka", 1: "Kalamay", ...}
                varietyNames = Object.values(selectedSizeObj.varieties).filter(
                  (value) => typeof value === "string"
                );
              }
            }

            console.log("🔤 Extracted variety names:", varietyNames);

            // Sort variety names alphabetically
            varietyNames.sort();

            console.log("🔤 Sorted variety names:", varietyNames);

            // Match products with variety names - using the already filtered products state
            const matchingProducts = products.filter((product) =>
              varietyNames.includes(product.name)
            );

            console.log("🔍 Matching products found:", matchingProducts);

            if (matchingProducts.length > 0) {
              // Create varieties objects for display
              const varietiesForDisplay = matchingProducts.map((product) => ({
                id: `${selectedSize}-${product.id}`,
                name: product.name,
                productId: product.id, // Store the actual product ID to match with stocks
                sizeId: selectedSize,
                // Store image URL in a custom property that TypeScript knows about
                _imageURL: product.imageUrl || "/assets/default.png",
              }));

              // Sort varieties alphabetically by name
              varietiesForDisplay.sort((a, b) => a.name.localeCompare(b.name));

              console.log(
                "✅ Final varieties for display:",
                varietiesForDisplay
              );
              setFilteredVarieties(varietiesForDisplay);
            } else {
              console.log(
                "❌ No matching products found for varieties:",
                varietyNames
              );
              setFilteredVarieties([]);
            }
          } catch (error) {
            console.error("❌ Error fetching products for varieties:", error);
            setFilteredVarieties([]);
          }
        } else {
          console.log("❌ Selected size not found in sizes array");
          setFilteredVarieties([]);
        }

        // Reset selected varieties when size changes
        setSelectedVarieties([]);
      }
    };

    fetchProductsForSelectedSize();
  }, [selectedSize, sizes, products]);

  // Calculate total price
  useEffect(() => {
    let total = 0;

    // Add size price
    if (selectedSize) {
      const size = sizes.find((s) => s.sizeId === selectedSize);
      if (size) total += size.price;
    }

    // Add variety price if applicable
    selectedVarieties.forEach((varietyId) => {
      const variety = varieties.find((v) => v.id === varietyId);
    });

    // Multiply by quantity
    total *= quantity;

    setTotalPrice(total);
  }, [selectedSize, selectedVarieties, quantity, sizes, varieties]);

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleVarietySelection = (varietyId: string) => {
    const selectedSizeObj = sizes.find((size) => size.sizeId === selectedSize);
    const maxVarieties = selectedSizeObj?.maxVarieties || 1;

    setSelectedVarieties((prev) => {
      if (prev.includes(varietyId)) {
        return prev.filter((id) => id !== varietyId); // Remove if selected
      } else if (prev.length < maxVarieties) {
        return [...prev, varietyId]; // Add if under limit
      } else {
        setShowToast(true); // Show toast when limit is reached
      }
      return prev; // No change if at limit
    });
  };

  const handleAddToCart = async () => {
    if (!selectedSize || selectedVarieties.length === 0) {
      showToastMessage("Please select a size and at least one variety.", false);
      return;
    }

    setIsAddingToCart(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("User is not logged in.");
      setIsAddingToCart(false);
      return;
    }

    const cartCollectionRef = collection(
      db,
      "customers",
      currentUser.uid,
      "cart"
    );

    try {
      // Get the size object
      const selectedSizeObj = sizes.find(
        (size) => size.sizeId === selectedSize
      );
      if (!selectedSizeObj) {
        throw new Error("Selected size not found");
      }

      // Get the variety names
      const varietyNames = selectedVarieties
        .map((varietyId) => {
          const variety = filteredVarieties.find((v) => v.id === varietyId);
          return variety ? variety.name : null;
        })
        .filter(Boolean);

      // Check if an item with the same size and varieties exists
      const q = query(
        cartCollectionRef,
        where("productSize", "==", selectedSizeObj.name)
      );

      const querySnapshot = await getDocs(q);

      const existingCartItem = querySnapshot.docs.find((doc) => {
        const data = doc.data();
        return (
          JSON.stringify(data.productVarieties.sort()) ===
          JSON.stringify(varietyNames.sort())
        );
      });

      if (existingCartItem) {
        const newQuantity = existingCartItem.data().productQuantity + quantity;
        await updateDoc(existingCartItem.ref, {
          productQuantity: newQuantity,
          productPrice: selectedSizeObj.price * newQuantity,
          originalPrice: selectedSizeObj.price,
          updatedAt: new Date().toISOString(),
        });
        showToastMessage(`Updated cart: ${newQuantity} items`, true);
      } else {
        const cartId = doc(cartCollectionRef).id;
        await setDoc(doc(cartCollectionRef, cartId), {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          productSize: selectedSizeObj.name,
          productVarieties: varietyNames,
          productQuantity: quantity,
          productPrice: selectedSizeObj.price * quantity,
          originalPrice: selectedSizeObj.price,
          specialInstructions: specialInstructions || null,
          cartId,
          userId: currentUser.uid,
        });

        showToastMessage("Added to cart successfully!", true);
      }

      // Show success overlay instead of immediately closing
      setShowSuccessOverlay(true);
    } catch (error) {
      console.error("Error adding/updating product in the cart:", error);
      showToastMessage("Failed to add to cart", false);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const closeSuccessOverlay = () => {
    setShowSuccessOverlay(false);
    // Reset form data but don't close the modal
    setStep(1);
    setSelectedSize("");
    setSelectedVarieties([]);
    setQuantity(1);
    setSpecialInstructions("");
  };

  const goToCart = () => {
    setShowSuccessOverlay(false);
    onClose();
    history.push("/home/cart");
  };

  useEffect(() => {
    if (!isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep(1);
    setSelectedSize("");
    setSelectedVarieties([]);
    // setQuantity(1);
    setSpecialInstructions("");
  };

  // Helper function to get fixed size stock for Bibingka
  const getBibingkaStock = (sizeName: string): FixedSizeStock | undefined => {
    return fixedSizeStocks.find(
      (stock) =>
        stock.variety === "Bibingka" &&
        stock.size.toLowerCase() === sizeName.toLowerCase()
    );
  };

  // Helper function to determine stock status
  const getStockStatus = (stock: FixedSizeStock | undefined) => {
    if (!stock) return { status: "unavailable", text: "Unavailable" };

    const { quantity, minimumStock, criticalLevel } = stock;

    if (quantity <= 0) {
      return { status: "outOfStock", text: "Out of Stock" };
    } else if (quantity <= criticalLevel) {
      return {
        status: "critical",
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

  // Helper function to get stock information for a product based on type and product ID
  const getProductStock = (
    productName: string,
    sizeType: string
  ): Stock | undefined => {
    // Extract product ID from filteredVarieties
    const product = products.find((p) => p.name === productName);
    if (!product) return undefined;

    // Find stock that matches product ID and type
    return varietyStocks.find(
      (stock) => stock.productId === product.id && stock.type === sizeType
    );
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = ["Size", "Variety", "Review"];

    return (
      <div className="byok-step-indicator">
        {steps.map((stepLabel, index) => (
          <div key={index} className="byok-step-item">
            <div
              className={`byok-step-dot ${
                step > index + 1
                  ? "completed"
                  : step === index + 1
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                // Only allow clicking on completed steps or the current step
                if (step > index + 1 || (index === 1 && selectedSize)) {
                  setStep(index + 1);
                }
              }}
            >
              {step > index + 1 ? (
                <IonIcon icon={checkmarkOutline} />
              ) : (
                index + 1
              )}
            </div>
            <div
              className={`byok-step-label ${
                step === index + 1 ? "active-label" : ""
              }`}
            >
              {stepLabel}
            </div>
            {index < 2 && (
              <div
                className={`byok-step-line ${
                  step > index + 1 ? "completed-line" : ""
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Get step information based on current step
  const getStepInfo = () => {
    switch (step) {
      case 1:
        return {
          title: "Select a Size",
          description: "Choose the size that works best for your occasion",
        };
      case 2:
        return {
          title: `Choose Variety ${
            selectedSize
              ? `(Up to ${
                  sizes.find((size) => size.sizeId === selectedSize)
                    ?.maxVarieties || 1
                })`
              : ""
          }`,
          description:
            "Select your favorite flavors from our kakanin selection",
        };
      case 3:
        return {
          title: "Review Your Order",
          description: "Confirm your customized kakanin before adding to cart",
        };
      default:
        return { title: "", description: "" };
    }
  };

  // Render step content
  const renderStepContent = () => {
    const { title, description } = getStepInfo();

    switch (step) {
      case 1:
        return (
          <div className="byok-step-content">
            <div className="byok-step-header">
              <IonTitle className="byok-step-title">{title}</IonTitle>
              <IonText className="byok-step-description">{description}</IonText>
            </div>

            <IonRadioGroup
              value={selectedSize}
              onIonChange={(e) => setSelectedSize(e.detail.value)}
            >
              <IonGrid className="size-grid">
                <IonRow className="size-selection-row">
                  {[...sizes]
                    .sort((a, b) => b.price - a.price)
                    .map((size) => {
                      // For Bibingka in small and solo sizes, get stock information
                      const isBibingkaSize = ["small", "solo"].includes(
                        size.name.toLowerCase()
                      );
                      const stockInfo = isBibingkaSize
                        ? getBibingkaStock(size.name)
                        : undefined;
                      const stockStatus = stockInfo
                        ? getStockStatus(stockInfo)
                        : undefined;

                      return (
                        <IonCol key={size.sizeId} size="6" size-md="4">
                          <IonCard
                            className={`size-card ${
                              selectedSize === size.sizeId
                                ? "selected-size"
                                : ""
                            } ${
                              stockStatus &&
                              (stockStatus.status === "outOfStock" ||
                                stockStatus.status === "unavailable")
                                ? "disabled-size"
                                : ""
                            }`}
                            onClick={() => {
                              if (
                                !(
                                  stockStatus &&
                                  (stockStatus.status === "outOfStock" ||
                                    stockStatus.status === "unavailable")
                                )
                              ) {
                                setSelectedSize(size.sizeId);
                              }
                            }}
                          >
                            <div className="size-radio-container">
                              <IonRadio
                                value={size.sizeId}
                                className="custom-radio"
                                disabled={
                                  stockStatus &&
                                  (stockStatus.status === "outOfStock" ||
                                    stockStatus.status === "unavailable")
                                }
                              />
                            </div>
                            <IonCardContent className="size-card-content">
                              <IonImg
                                src={size.imageUrl}
                                className="size-image"
                                alt={size.name}
                              />
                              <div className="size-details">
                                <IonText className="size-name">
                                  {size.name}
                                </IonText>
                                <IonText className="size-dimension">
                                  {size.dimensions}
                                </IonText>
                                <IonText className="size-slices">
                                  {size.shape}
                                </IonText>
                                <IonText className="size-price">
                                  ₱{size.price}
                                </IonText>

                                {/* Show out of stock overlay if applicable */}
                                {stockStatus &&
                                  stockStatus.status === "outOfStock" && (
                                    <div className="out-of-stock-overlay">
                                      <span>Out of Stock</span>
                                    </div>
                                  )}

                                {/* Show unavailable overlay if applicable */}
                                {stockStatus &&
                                  stockStatus.status === "unavailable" && (
                                    <div className="out-of-stock-overlay unavailable-overlay">
                                      <span>Unavailable</span>
                                    </div>
                                  )}
                              </div>
                            </IonCardContent>
                          </IonCard>
                        </IonCol>
                      );
                    })}
                </IonRow>
              </IonGrid>
            </IonRadioGroup>

            {sizes.length === 0 && (
              <div className="no-data-message">
                <IonIcon name="alert-circle-outline" />
                <p>Loading available sizes...</p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="byok-step-content">
            <div className="byok-step-header">
              <IonTitle className="byok-step-title">{title}</IonTitle>
              <IonText className="byok-step-description">{description}</IonText>
            </div>

            {selectedSize && (
              <div className="selected-size-badge">
                <span>
                  Size Selected:{" "}
                  {sizes.find((s) => s.sizeId === selectedSize)?.name}
                </span>
                <span>
                  ₱{sizes.find((s) => s.sizeId === selectedSize)?.price}
                </span>
              </div>
            )}

            {selectedSize ? (
              <IonGrid className="byok-variety-grid">
                <IonRow className="byok-variety-selection-row">
                  {filteredVarieties.map((variety) => {
                    const selectedSizeObj = sizes.find(
                      (size) => size.sizeId === selectedSize
                    );
                    const maxVarieties = selectedSizeObj?.maxVarieties || 1;
                    const isSelected = selectedVarieties.includes(variety.id);
                    const canSelect =
                      selectedVarieties.length < maxVarieties || isSelected;

                    // Get the size type from the selected size object
                    const sizeType = selectedSizeObj?.type || "bilao"; // Default to "bilao" if no type specified

                    // Get product ID directly from variety object if available (from our updated code)
                    // or find it from the products array as a fallback
                    const productId =
                      (variety as any).productId ||
                      products.find((p) => p.name === variety.name)?.id;

                    // Find stock information using productId
                    const stockInfo = productId
                      ? varietyStocks.find(
                          (stock) =>
                            stock.productId === productId &&
                            stock.type === sizeType
                        )
                      : undefined;

                    console.log(`Stock lookup for ${variety.name}:`, {
                      productId,
                      sizeType,
                      stockFound: !!stockInfo,
                      stockDetails: stockInfo,
                    });

                    // Determine stock availability status
                    let stockStatus = {
                      status: "unavailable",
                      text: "Unavailable",
                    };
                    let stockColor = "medium";

                    if (stockInfo) {
                      const { quantity, minimumStock, criticalLevel } =
                        stockInfo;

                      if (quantity <= 0) {
                        stockStatus = {
                          status: "outOfStock",
                          text: "Out of Stock",
                        };
                        stockColor = "danger";
                      } else if (quantity <= criticalLevel) {
                        stockStatus = {
                          status: "critical",
                          text: `Low: ${Math.round(quantity)} left`,
                        };
                        stockColor = "danger";
                      } else if (quantity <= minimumStock) {
                        stockStatus = {
                          status: "low",
                          text: `Limited: ${Math.round(quantity)} left`,
                        };
                        stockColor = "warning";
                      } else {
                        stockStatus = {
                          status: "available",
                          text: `Available: ${Math.round(quantity)} in stock`,
                        };
                        stockColor = "success";
                      }
                    }

                    const outOfStock = stockInfo && stockInfo.quantity <= 0;

                    return (
                      <IonCol key={variety.id} size="6">
                        {" "}
                        <IonCard
                          className={`size-card ${
                            isSelected ? "selected-size" : ""
                          } ${
                            !canSelect ||
                            outOfStock ||
                            stockStatus.status === "unavailable"
                              ? "disabled-size"
                              : ""
                          }`}
                          onClick={() =>
                            canSelect &&
                            !outOfStock &&
                            stockStatus.status !== "unavailable" &&
                            toggleVarietySelection(variety.id)
                          }
                        >
                          {isSelected && (
                            <div className="selected-badge">
                              <IonIcon icon={checkmarkCircle} />
                            </div>
                          )}

                          {outOfStock && (
                            <div className="out-of-stock-overlay">
                              <span>Out of Stock</span>
                            </div>
                          )}

                          {stockStatus.status === "unavailable" &&
                            !outOfStock && (
                              <div className="out-of-stock-overlay unavailable-overlay">
                                <span>Unavailable</span>
                              </div>
                            )}

                          <IonCardContent className="size-card-content">
                            <IonImg
                              src={
                                (variety as any)._imageURL ||
                                "/assets/default.png"
                              }
                              className="size-image"
                              alt={variety.name}
                            />
                            <div className="size-details">
                              <IonText className="size-name">
                                {variety.name}
                              </IonText>
                              <div className="stock-indicator">
                                {stockInfo ? (
                                  <IonBadge
                                    color={stockColor}
                                    className="stock-badge"
                                  >
                                    {stockStatus.text}
                                  </IonBadge>
                                ) : (
                                  <IonBadge
                                    color="medium"
                                    className="stock-badge"
                                  >
                                    Unavailable
                                  </IonBadge>
                                )}
                              </div>
                            </div>
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    );
                  })}
                </IonRow>
              </IonGrid>
            ) : (
              <div className="no-size-selected">
                <p>Please select a size first</p>
                <IonButton
                  fill="outline"
                  size="small"
                  onClick={() => setStep(1)}
                >
                  Go Back to Select Size
                </IonButton>
              </div>
            )}

            {selectedSize && filteredVarieties.length === 0 && (
              <div className="no-data-message">
                <IonIcon name="alert-circle-outline" />
                <p>No varieties available for this size</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="byok-step-content">
            <div className="byok-step-header">
              <IonTitle className="byok-step-title">{title}</IonTitle>
              <IonText className="byok-step-description">{description}</IonText>
            </div>

            <div className="byok-review-section">
              <div className="byok-review-summary">
                <IonTitle>Your Customized Kakanin</IonTitle>

                <div className="review-detail">
                  <span className="review-label">Size:</span>
                  <span className="review-value">
                    {selectedSize
                      ? sizes.find((s) => s.sizeId === selectedSize)?.name
                      : "None selected"}
                  </span>
                </div>

                <div className="review-detail">
                  <span className="review-label review-label-variety">
                    Varieties:
                  </span>
                  <span className="review-value review-value-varieties">
                    {selectedVarieties.length > 0
                      ? selectedVarieties
                          .map(
                            (varietyId) =>
                              filteredVarieties.find((v) => v.id === varietyId)
                                ?.name
                          )
                          .filter(Boolean)
                          .join(", ")
                      : "None selected"}
                  </span>
                </div>

                {/* If Bibingka is selected and size is small or solo, display stock info */}
                {selectedVarieties.some((varietyId) => {
                  const variety = filteredVarieties.find(
                    (v) => v.id === varietyId
                  );
                  return variety?.name === "Bibingka";
                }) &&
                  selectedSize &&
                  (() => {
                    const selectedSizeObj = sizes.find(
                      (s) => s.sizeId === selectedSize
                    );
                    const sizeName = selectedSizeObj?.name.toLowerCase() || "";
                    if (["small", "solo"].includes(sizeName)) {
                      const stockInfo = getBibingkaStock(sizeName);
                      const stockStatus = getStockStatus(stockInfo);

                      if (stockInfo) {
                        // return (
                        //   <div className="review-detail review-stock-info">
                        //     <span className="review-label">Stock Info:</span>
                        //     <IonBadge
                        //       color={stockStatus.color || "medium"}
                        //       className="review-stock-badge"
                        //     >
                        //       {stockStatus.text}
                        //     </IonBadge>
                        //   </div>
                        // );
                      }
                    }
                    return null;
                  })()}

                {/* Display expiry date for Bibingka if available */}
                {selectedVarieties.some((varietyId) => {
                  const variety = filteredVarieties.find(
                    (v) => v.id === varietyId
                  );
                  return variety?.name === "Bibingka";
                }) &&
                  selectedSize &&
                  (() => {
                    const selectedSizeObj = sizes.find(
                      (s) => s.sizeId === selectedSize
                    );
                    const sizeName = selectedSizeObj?.name.toLowerCase() || "";
                    if (["small", "solo"].includes(sizeName)) {
                      const stockInfo = getBibingkaStock(sizeName);

                      if (stockInfo && stockInfo.expiryDate) {
                        // return (
                        //   <div className="review-detail">
                        //     <span className="review-label">
                        //       <IonIcon
                        //         icon={calendarOutline}
                        //         className="calendar-icon"
                        //       />
                        //       Best Before:
                        //     </span>
                        //     <span className="review-value">
                        //       {stockInfo.expiryDate}
                        //     </span>
                        //   </div>
                        // );
                      }
                    }
                    return null;
                  })()}
              </div>

              {/* <div className="quantity-section">
                <IonTitle>Quantity</IonTitle>
                <div className="quantity-control">
                  <IonButton
                    className="byok-quantity-button"
                    fill="clear"
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <IonIcon icon={removeCircle} />
                  </IonButton>

                  <IonInput
                    type="number"
                    value={quantity}
                    min={1}
                    max={99}
                    onIonChange={(e) => {
                      const value = parseInt(e.detail.value!, 10);
                      if (!isNaN(value) && value > 0) {
                        setQuantity(value);
                      }
                    }}
                    className="quantity-input"
                  />

                  <IonButton
                    className="byok-quantity-button"
                    fill="clear"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <IonIcon icon={addCircle} />
                  </IonButton>
                </div>
                </div> */}

              {/* <div className="special-instructions">
                <IonTitle className="special-instructions-text">
                  Special Instructions (Optional)
                </IonTitle>
                <IonTextarea
                  className="special-instructions-textarea"
                  placeholder="Add any special requests or instructions here..."
                  value={specialInstructions}
                  onIonChange={(e) => setSpecialInstructions(e.detail.value!)}
                />
              </div> */}

              <div className="price-summary">
                <div className="total-price">
                  <span className="total-label">Total Price: </span>
                  <span className="total-value">
                    ₱{(totalPrice * quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Check if the current step is complete
  const isStepComplete = () => {
    switch (step) {
      case 1:
        return !!selectedSize;
      case 2:
        return selectedVarieties.length > 0;
      case 3:
        return quantity > 0;
      default:
        return false;
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={() => {
        resetForm();
        onClose();
      }}
      className="build-your-own-modal"
    >
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={`You can select up to ${
          sizes.find((size) => size.sizeId === selectedSize)?.maxVarieties || 1
        } varieties only.`}
        duration={5000}
      />
      <IonToast
        isOpen={showAddedToCartToast}
        onDidDismiss={() => setShowAddedToCartToast(false)}
        message="Item added to cart! Go to your cart to proceed to checkout."
        duration={3000}
        position="bottom"
        color="success"
        buttons={[
          {
            text: "View Cart",
            handler: () => {
              // Navigate to cart page
              window.location.href = "/home/cart";
            },
          },
        ]}
      />
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} className="close-btn" />
            </IonButton>
          </IonButtons>
          <IonTitle className="title-toolbar">Build Your Own Kakanin</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {renderStepIndicator()}
        {renderStepContent()}
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <div className="modal-footer-buttons">
            {step > 1 && (
              <IonButton
                className="footer-back-action-button"
                fill="outline"
                onClick={prevStep}
                disabled={isAddingToCart}
              >
                <IonIcon icon={chevronBack} slot="start" />
                Back
              </IonButton>
            )}

            {step < 3 && (
              <IonButton
                className="footer-action-button"
                disabled={!isStepComplete() || isAddingToCart}
                onClick={nextStep}
              >
                Next
                <IonIcon icon={chevronForward} slot="end" />
              </IonButton>
            )}

            {step === 3 && (
              <IonButton
                className="footer-action-button add-to-cart-button"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? (
                  <div className="button-spinner">Adding...</div>
                ) : (
                  <>
                    <IonIcon icon={cartOutline} slot="start" />
                    ADD TO CART
                  </>
                )}
              </IonButton>
            )}
          </div>
        </IonToolbar>
      </IonFooter>

      {/* Success Overlay */}
      {showSuccessOverlay && (
        <div className="success-overlay">
          <div className="success-content">
            <div className="success-icon">
              <IonIcon icon={checkmarkCircle} />
            </div>
            <h2>Added to Cart!</h2>
            <p className="success-message">
              Your item has been added to your cart successfully.
            </p>

            <div className="success-actions">
              <IonButton
                fill="outline"
                onClick={closeSuccessOverlay}
                className="add-more-button"
              >
                Add Items
                <IonIcon slot="end" icon={addOutline} />
              </IonButton>
              <IonButton onClick={goToCart} className="view-cart-button">
                Go to Cart
                <IonIcon slot="end" icon={cartOutline} />
              </IonButton>
            </div>
          </div>
        </div>
      )}
    </IonModal>
  );
};

export default BuildYourOwnModal;
