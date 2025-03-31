import React, { useEffect, useState } from "react";
import {
  IonModal,
  IonContent,
  IonButton,
  IonIcon,
  IonImg,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonTitle,
  IonCard,
  IonFooter,
  IonToolbar,
  IonText,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonHeader,
  IonButtons,
} from "@ionic/react";
import {
  chevronBack,
  checkmark,
  cart,
  removeCircle,
  addCircle,
  addCircleOutline,
  removeCircleOutline,
  checkmarkCircle,
  ellipse,
  square,
  ellipseOutline,
  squareOutline,
} from "ionicons/icons";
import {
  doc,
  collection,
  setDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase-config";
// import { Variety } from "../interfaces/interfaces";
import "../products/ProductModal.css";
import { ProductModalProps } from "../interfaces/interfaces";

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
  // showToastMessage,
}) => {
  const [sizes, setSizes] = useState<any[]>([]);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVarieties, setSelectedVarieties] = useState<string[]>([]);

  useEffect(() => {
    const fetchSizes = onSnapshot(collection(db, "sizes"), (snapshot) => {
      const sizesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSizes(sizesList);
    });

    return () => {
      fetchSizes();
    };
  }, []);

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

  // Sizes and Varieties
  // const varieties: Variety[] = [
  //   {
  //     id: "big-bilao",
  //     varieties: ["Bibingka", "Sapin-Sapin", "Kutsinta", "Kalamay"],
  //   },
  //   {
  //     id: "tray",
  //     varieties: ["Bibingka", "Sapin-Sapin", "Kutsinta", "Kalamay", "Cassava"],
  //   },
  //   {
  //     id: "small",
  //     varieties: ["Bibingka"],
  //   },
  //   {
  //     id: "half-tray",
  //     varieties: ["Bibingka", "Sapin-Sapin", "Kutsinta", "Kalamay", "Cassava"],
  //   },
  //   {
  //     id: "solo",
  //     varieties: ["Bibingka"],
  //   },
  //   {
  //     id: "slice",
  //     varieties: ["Bibingka", "Sapin-Sapin", "Kutsinta", "Kalamay", "Cassava"],
  //   },
  // ];

  const handleSize = (sizeId: string | null) => {
    console.log("handleSize Triggered:", sizeId);

    if (sizeId === null) {
      setSelectedSize(null);
      setSelectedVarieties([]);
      return;
    }

    setSelectedSize(sizeId);
  };

  // const handleVariety = (variety: string) => {
  //   if (!product) return;

  //   // prevent deselecting the variety if it's the same as the product name
  //   if (variety === product.name && selectedVarieties.includes(variety)) {
  //     return;
  //   }

  //   setSelectedVarieties((prev) =>
  //     prev.includes(variety)
  //       ? prev.filter((v) => v !== variety)
  //       : [...prev, variety]
  //   );
  // };

  const handleAddToCart = async () => {
    if (!product) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("User is not logged in.");
      return;
    } else if (!selectedSize) {
      // showToastMessage("Please select a size first", false);
      return;
    }

    const cartCollectionRef = collection(
      db,
      "customers",
      currentUser.uid,
      "cart"
    );

    try {
      // **Check if an item with the same size and varieties exists**
      const q = query(
        cartCollectionRef,
        where("productName", "==", product.name),
        where("productSize.name", "==", selectedSize),
        where("productVarieties", "==", selectedVarieties)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // **Item already exists, update quantity**
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data();
        const newQuantity = (existingData.productQuantity || 1) + 1;

        await updateDoc(existingDoc.ref, { productQuantity: newQuantity });

        console.log("Quantity updated in cart!");
        // showToastMessage("Added to cart successfully!", true);
      } else {
        // **Item does not exist, add as new**
        const cartId = doc(cartCollectionRef).id;
        const cartRef = doc(cartCollectionRef, cartId);

        const cartItem = {
          createdAt: new Date().toISOString(),
          productName: product.name,
          productImg: product.imageURL,
          productPrice: product.price,
          cartId,
          productSize: selectedSize,
          productVarieties: selectedVarieties,
          productQuantity: 1,
        };

        await setDoc(cartRef, cartItem, { merge: true });

        console.log("Product added to the cart!");
        // showToastMessage("Added to cart successfully!", true);
      }
    } catch (error) {
      console.error("Error adding/updating product in the cart:", error);
      // showToastMessage("Failed to add to cart", false);
    }
  };

  const handleClose = () => {
    setSelectedSize(null);
    setSelectedVarieties([]);
    onClose();
  };

  return (
    <IonModal
      className="product-details-modal"
      isOpen={isOpen}
      canDismiss={true}
      onWillDismiss={onClose}
      onDidDismiss={() => {
        setSelectedSize(null);
        setSelectedVarieties([]);
      }}
    >
      <IonContent fullscreen>
        <IonHeader className="home-header">
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton className="back-button" onClick={handleClose}>
                <IonIcon className="back-icon" icon={chevronBack} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        {/* <div className="back-button-container">
          <IonButton className="back-button" onClick={handleClose}>
            <IonIcon className="back-icon" icon={chevronBack} />
          </IonButton>
        </div> */}
        {product && (
          <div className="product-details-container">
            {/* <div className="back-button-container">
              <IonButton className="back-button" onClick={handleClose}>
                <IonIcon className="back-icon" icon={chevronBack} />
              </IonButton>
            </div> */}
            <div className="product-details-img">
              <IonImg src={product.imageURL} />
            </div>
            <IonCardHeader className="product-details-header">
              <IonCardSubtitle>{product.name}</IonCardSubtitle>
              <IonCardTitle>₱{product.price}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="product-details-description">
              {product.description}
            </IonCardContent>
          </div>
        )}

        <div>
          <IonTitle className="product-title">Choose Size</IonTitle>
        </div>
        {/* Sizes and Varieties */}
        <IonGrid className="size-grid">
          <IonRow className="size-selection-row">
            {[...sizes]
              .sort((a, b) => b.price - a.price)
              .map((size) => (
                <IonCol size="6" key={size.id} className="size-col">
                  <IonCard
                    className={`size-card ${
                      selectedSize === size.id ? "selected-size" : ""
                    }`}
                    onClick={() => {
                      handleSize(selectedSize === size.id ? null : size.id);
                    }}
                  >
                    <IonCardContent className="size-card-content">
                      {/* Size Details */}
                      <IonImg
                        src={getSizeImage(size.name)}
                        className="size-image"
                        alt={size.name}
                      />
                      <div className="size-details">
                        <IonText className="size-name">{size.name}</IonText>
                        <IonText className="size-dimension">
                          {size.dimensions}
                        </IonText>
                        <IonText className="size-slices">
                          {size.slices} slices
                        </IonText>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
          </IonRow>
        </IonGrid>

        {selectedSize && (
          <>
            <IonTitle className="product-title">Available Varieties</IonTitle>
            <IonGrid>
              <IonRow>
                {selectedVarieties.map((variety) => (
                  <IonCol key={variety} size="6">
                    <IonChip>{variety}</IonChip>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </>
        )}

        {/* Show varieties only if a size is selected */}
        {/* {selectedSizeObj && (
          <div className="varieties-section">
            <IonTitle className="categories-title">Choose Varieties</IonTitle>
            <div className="varieties-container">
              {selectedSizeObj.varieties.map((variety) => {
                const isProductVariety = product && variety === product.name;
                const isSelected = selectedVarieties.includes(variety);

                return (
                  <IonChip
                    key={variety}
                    className={`variety-chip ${
                      isSelected ? "selected-variety" : ""
                    } ${isProductVariety ? "product-variety" : ""}`}
                    onClick={() => handleVariety(variety)}
                  >
                    {isSelected && <IonIcon icon={checkmark} color="success" />}
                    <span>{variety}</span>
                  </IonChip>
                );
              })}
            </div>
          </div>
        )} */}
      </IonContent>

      <IonFooter>
        <IonToolbar className="product-footer">
          <div className="footer-content">
            <div className="product-quantity-control">
              <IonButton
                className="product-quantity-button"
                fill="clear"
                size="small"
              >
                <IonIcon icon={removeCircleOutline} />
              </IonButton>
              <IonBadge className="product-quantity-badge">
                <IonText color="dark"></IonText>
              </IonBadge>
              <IonButton
                className="product-quantity-button"
                fill="clear"
                size="small"
              >
                <IonIcon icon={addCircleOutline} />
              </IonButton>
            </div>
            <IonButton
              className="footer-action-button add-to-cart-button"
              onClick={handleAddToCart}
            >
              <IonIcon icon={cart} slot="start" />
              Add To Cart
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default ProductModal;
