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
} from "@ionic/react";
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
} from "ionicons/icons";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase-config";
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

  // Calculated total
  const [totalPrice, setTotalPrice] = useState(0);

  const [showToast, setShowToast] = useState(false);

  const getSizeImage = (sizeName: string): string => {
    const sizeImages: Record<string, string> = {
      "Big Bilao": "/assets/bilao.webp",
      Tray: "/assets/rectangle.webp",
      Small: "/assets/round.webp",
      "Half-Tray": "/assets/rectangle.webp",
      Solo: "/assets/round.webp",
      "1/4 Slice": "/assets/slice1.webp",
    };

    return sizeImages[sizeName] ?? "/assets/default.png";
  };

  // Fetch sizes and varieties
  useEffect(() => {
    const fetchSizes = async () => {
      try {
        const sizesSnapshot = await getDocs(collection(db, "sizes"));
        const sizesData = sizesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Size[];
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
      const selectedSizeObj = sizes.find((size) => size.id === selectedSize);

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
      const size = sizes.find((s) => s.id === selectedSize);
      if (size) total += size.price;
    }

    // Add variety price if applicable
    selectedVarieties.forEach((varietyId) => {
      const variety = varieties.find((v) => v.id === varietyId);
      if (variety) total += variety.price;
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
    const selectedSizeObj = sizes.find((size) => size.id === selectedSize);
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

  const handleAddToCart = () => {
    const customItem = {
      sizeId: selectedSize,
      varietyId: selectedVarieties,
      quantity,
      totalPrice,
      specialInstructions,
    };

    console.log("Adding to cart:", customItem);
    showToastMessage("Your custom Kakanin has been added to cart!", true);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setStep(1);
    setSelectedSize("");
    setSelectedVarieties([]);
    setQuantity(1);
    setSpecialInstructions("");
  };

  // Render step indicator
  const renderStepIndicator = () => {
    return (
      <div className="step-indicator">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`step-dot ${step === s ? "active" : ""} ${
              step > s ? "completed" : ""
            }`}
            onClick={() => {
              // Only allow going back to previous steps or current step
              if (s <= step) setStep(s);
            }}
          >
            {step > s ? <IonIcon icon={checkmarkCircle} /> : s}
          </div>
        ))}
      </div>
    );
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <div className="step-header">
              <IonTitle className="step-title product-title">
                Choose Size
              </IonTitle>
              <IonText className="step-description">
                Select a size for your kakanin
              </IonText>
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
                      <IonCol key={size.id} size="6" size-md="4">
                        <IonCard
                          className={`size-card ${
                            selectedSize === size.id ? "selected-size" : ""
                          }`}
                          onClick={() => setSelectedSize(size.id)}
                        >
                          <div className="size-radio-container">
                            <IonRadio
                              value={size.id}
                              className="custom-radio"
                            />
                          </div>
                          <IonCardContent className="size-card-content">
                            <IonImg
                              src={getSizeImage(size.name)}
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
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="step-header">
              <IonTitle className="step-title product-title">
                Choose Variety (Up to{" "}
                {sizes.find((size) => size.id === selectedSize)?.maxVarieties ||
                  1}
                )
              </IonTitle>
              <IonText className="step-description">
                Select variety/varieties of kakanin
              </IonText>
            </div>

            {selectedSize ? (
              <IonGrid className="variety-grid">
                <IonRow className="variety-selection-row">
                  {filteredVarieties.map((variety) => {
                    const selectedSizeObj = sizes.find(
                      (size) => size.id === selectedSize
                    );
                    const maxVarieties = selectedSizeObj?.maxVarieties || 1;

                    return (
                      <IonCol key={variety.id} size="6" size-md="4">
                        <IonCard
                          className={`variety-card ${
                            selectedVarieties.includes(variety.id)
                              ? "selected-variety"
                              : ""
                          }`}
                          onClick={() => toggleVarietySelection(variety.id)}
                        >
                          <div className="variety-checkbox-container">
                            <IonCheckbox
                              className="custom-checkbox"
                              slot="start"
                              checked={selectedVarieties.includes(variety.id)}
                              onIonChange={() =>
                                toggleVarietySelection(variety.id)
                              }
                              disabled={
                                selectedVarieties.length >= maxVarieties &&
                                !selectedVarieties.includes(variety.id)
                              }
                            />
                          </div>
                          <IonCardContent className="variety-card-content">
                            <div className="variety-image-container">
                              <IonImg
                                src={
                                  products.find(
                                    (product) => product.name === variety.name
                                  )?.imageURL || "default-image-url.jpg"
                                }
                                className="variety-image"
                              />
                            </div>
                            <IonText className="variety-name">
                              {variety.name}
                            </IonText>
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
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h3 className="step-title">Review & Finalize</h3>
            <p className="step-description">
              Review your selection and add to cart
            </p>

            <div className="review-section">
              <div className="review-summary">
                <h4>Your Custom Kakanin</h4>

                <div className="review-detail">
                  <span className="review-label">Size:</span>
                  <span className="review-value">
                    {selectedSize
                      ? sizes.find((s) => s.id === selectedSize)?.name
                      : "None selected"}
                  </span>
                </div>

                <div className="review-detail">
                  <span className="review-label">Varieties:</span>
                  <span className="review-value">
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

              <div className="quantity-section">
                <h4>Quantity</h4>
                <div className="quantity-control">
                  <IonButton
                    fill="clear"
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <IonIcon icon={removeCircleOutline} />
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
                    fill="clear"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <IonIcon icon={addCircleOutline} />
                  </IonButton>
                </div>
              </div>

              <div className="special-instructions">
                <h4>Special Instructions (Optional)</h4>
                <IonTextarea
                  placeholder="Add any special requests or instructions here..."
                  value={specialInstructions}
                  onIonChange={(e) => setSpecialInstructions(e.detail.value!)}
                  rows={3}
                />
              </div>

              <div className="price-summary">
                <div className="total-price">
                  <span className="total-label">Total Price</span>
                  <span className="total-value">₱{totalPrice.toFixed(2)}</span>
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
          sizes.find((size) => size.id === selectedSize)?.maxVarieties || 1
        } varieties only.`}
        duration={2000}
      />
      <IonHeader>
        <IonToolbar>
          <IonTitle className="title-toolbar">Build Your Own Kakanin</IonTitle>
          <IonButtons slot="end">
            <IonButton className="byok-back-button" onClick={onClose}>
              <IonIcon className="byok-back-icon" icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {renderStepIndicator()}
        {renderStepContent()}
      </IonContent>

      <IonFooter>
        <IonToolbar className="product-footer">
          <div className="footer-content">
            <div className="footer-back-action-button-container">
              {step > 1 && (
                <IonButton
                  className="footer-back-action-button byok-next-button"
                  fill="outline"
                  onClick={prevStep}
                >
                  <IonIcon slot="start" icon={chevronBackCircleOutline} />
                  Back
                </IonButton>
              )}
            </div>
            {step < 3 && (
              <IonButton
                className="footer-action-button byok-next-button"
                disabled={!isStepComplete()}
                onClick={nextStep}
              >
                Next
                <IonIcon slot="end" icon={chevronForwardCircle} />
              </IonButton>
            )}

            {step === 3 && (
              <IonButton
                color="success"
                disabled={!isStepComplete()}
                onClick={handleAddToCart}
              >
                Add to Cart
                <IonIcon slot="end" icon={cartOutline} />
              </IonButton>
            )}
          </div>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default BuildYourOwnModal;
