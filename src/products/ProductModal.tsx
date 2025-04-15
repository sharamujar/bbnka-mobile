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
} from "ionicons/icons";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase-config";
import "../products/ProductModal.css";
import { ProductModalProps } from "../interfaces/interfaces";

interface Size {
  id: string;
  name: string;
  dimensions: string;
  slices: number;
  shape: string;
  price: number;
  maxVarieties: number;
  imageUrl: string;
  varieties: string[];
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

  // Fetch sizes and detailed product information when product changes
  useEffect(() => {
    if (!product) return;

    setLoading(true);

    // Fetch all available sizes
    const fetchSizes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sizes"));
        const sizeList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          varieties: doc.data().varieties || [],
        }));
        setSizes(sizeList as Size[]);

        // Filter sizes that have varieties for this product
        const productName = product.name;
        const filteredSizes = (sizeList as Size[]).filter(
          (size: Size) =>
            // Check if this product's name is in the size's varieties array
            size.varieties && size.varieties.includes(productName)
        );

        setAvailableSizes(filteredSizes);
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

  const handleClose = () => {
    onClose();
  };

  if (!product || loading) return null;

  return (
    <IonModal
      className="product-details-modal"
      isOpen={isOpen}
      canDismiss={true}
      onWillDismiss={onClose}
    >
      <IonToolbar className="product-details-toolbar">
            <IonButtons slot="start">
          <IonButton
            className="product-details-back-button"
            onClick={handleClose}
          >
            <IonIcon className="product-details-back-icon" icon={close} />
          </IonButton>
        </IonButtons>
        {/* {productDetails?.bestseller && (
          <IonChip className="bestseller-chip" slot="end">
            Bestseller
          </IonChip>
        )} */}
      </IonToolbar>

      <IonContent className="product-details-content">
          <div className="product-details-container">
          <div className="product-details-img">
            <IonImg src={product.imageURL} alt={product.name} />
          </div>

          <div className="product-details-content">
            <div className="product-details-header">
              <IonCardTitle>{product.name}</IonCardTitle>
              {/* <div className="product-rating">
                <IonIcon icon={star} color="warning" />
                <span>{productDetails.rating}</span>
            </div> */}
            </div>

            <p className="product-details-description">{product.description}</p>

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

            <div className="product-details-section">
              <div className="product-details-section-title">
                <IonIcon icon={checkmarkCircle} />
                <span>Size Options</span>
              </div>
              <p className="product-details-section-subtitle">
                This product is available in different sizes. Each size has
                specific dimensions and number of servings.
              </p>

              {availableSizes.length > 0 ? (
                <IonGrid className="product-details-sizes-grid">
                  <IonRow>
                    {availableSizes
              .sort((a, b) => b.price - a.price)
              .map((size) => (
                        <IonCol size="6" key={size.id}>
                          <div className="product-details-size-info-card">
                            <div className="product-details-size-info-name">
                              {size.name}
                            </div>
                            <div className="product-details-size-info-price">
                              ₱{size.price}
                            </div>
                            <div className="product-details-size-info-details">
                              {size.slices && (
                                <div className="product-details-size-info-servings">
                                  {size.slices} slices
                                </div>
                              )}
                              {size.dimensions && (
                                <div className="product-details-size-info-dimensions">
                          {size.dimensions}
                                </div>
                              )}
                            </div>
                      </div>
                </IonCol>
              ))}
          </IonRow>
                </IonGrid>
              ) : (
                <div className="no-sizes-available">
                  <IonText color="medium">
                    This product is not currently available in any size.
                  </IonText>
                </div>
              )}
            </div>

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
    </IonModal>
  );
};

export default ProductModal;
