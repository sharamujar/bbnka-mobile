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
        const sizesSnapshot = await getDocs(collection(db, "sizes"));
        const sizesData = sizesSnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log(`BYOM - Size ${doc.id} data:`, data);
          return {
            sizeId: doc.id,
            ...data,
          };
        }) as Size[];
        console.log("BYOM - All sizes data:", sizesData);
        setSizes(sizesData);
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
        const productsSnapshot = await getDocs(collection(db, "products"));
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
        showToastMessage("Failed to load products", false);
      }
    };

    if (isOpen) {
      fetchSizes();
      fetchVarieties();
      fetchProducts();
    }
  }, [isOpen, showToastMessage]);

  useEffect(() => {
    if (selectedSize) {
      const selectedSizeObj = sizes.find(
        (size) => size.sizeId === selectedSize
      );

      if (selectedSizeObj && selectedSizeObj.varieties) {
        const varietiesForDisplay = selectedSizeObj.varieties.map(
          (varietyName, index) => ({
            id: `${selectedSize}-variety-${index}`,
            name: varietyName,
            price: 0, // Set appropriate price if needed
            sizeId: selectedSize,
          })
        );

        setFilteredVarieties(varietiesForDisplay);
      } else {
        setFilteredVarieties([]);
      }

      // Reset selected variety when size changes
      setSelectedVarieties([]);
    }
  }, [selectedSize, sizes]);

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
                    .map((size) => (
                      <IonCol key={size.sizeId} size="6" size-md="4">
                        <IonCard
                          className={`size-card ${
                            selectedSize === size.sizeId ? "selected-size" : ""
                          }`}
                          onClick={() => setSelectedSize(size.sizeId)}
                        >
                          <div className="size-radio-container">
                            <IonRadio
                              value={size.sizeId}
                              className="custom-radio"
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
                                {size.slices} slices
                              </IonText>
                              <IonText className="size-price">
                                ₱{size.price}
                              </IonText>
                            </div>
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    ))}
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

                    return (
                      <IonCol key={variety.id} size="6">
                        <IonCard
                          className={`byok-variety-card ${
                            isSelected ? "selected-variety" : ""
                          } ${!canSelect ? "disabled-variety" : ""}`}
                          onClick={() =>
                            canSelect && toggleVarietySelection(variety.id)
                          }
                        >
                          {isSelected && (
                            <div className="selected-badge">
                              <IonIcon icon={checkmarkCircle} />
                            </div>
                          )}

                          <IonCardContent className="byok-variety-card-content">
                            <div className="byok-variety-image-container">
                              <IonImg
                                src={
                                  products.find(
                                    (product) => product.name === variety.name
                                  )?.imageURL || "default-image-url.jpg"
                                }
                                className="byok-variety-image"
                              />
                            </div>
                            <div className="variety-details">
                              <IonText className="byok-variety-name">
                                {variety.name}
                              </IonText>
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
                <IonIcon icon={arrowBackOutline} slot="start" />
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
                <IonIcon icon={arrowForwardOutline} slot="end" />
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
                    Add to Cart
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
                Add More Items
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
