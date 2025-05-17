import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonToast,
  IonModal,
  IonLoading,
  IonButtons,
  IonSegment,
  IonSegmentButton,
  IonInput,
} from "@ionic/react";
import {
  chevronBackCircleOutline,
  chevronForwardCircle,
  checkmarkCircleSharp,
  timeOutline,
  calendarOutline,
  cardOutline,
  locationOutline,
  closeCircleOutline,
  storefront,
  home,
  imageOutline,
  informationCircleOutline,
  keyOutline,
  trash,
  copy,
  close,
  copyOutline,
  checkmarkCircle,
  closeCircle,
  cashOutline,
  chevronBack,
  download,
} from "ionicons/icons";
import { auth, db } from "../firebase-config";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";
import CheckoutStepProgress from "../components/CheckoutStepProgress";
import "./Review.css";
import dayjs from "dayjs";
import { notificationService } from "../services/NotificationService";

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = "bbnka-payment-screenshots"; // Set your upload preset here
const CLOUDINARY_CLOUD_NAME = "dbmofuvwn"; // Set your cloud name here
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/dbmofuvwn/image/upload`;

// Custom GCash Icon component
const GCashIcon: React.FC = () => (
  <svg
    viewBox="0 0 192 192"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    width="18"
    height="18"
    style={{ color: "#bf5906" }}
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="12"
      d="M84 96h36c0 19.882-16.118 36-36 36s-36-16.118-36-36 16.118-36 36-36c9.941 0 18.941 4.03 25.456 10.544"
    />
    <path
      fill="currentColor"
      d="M145.315 66.564a6 6 0 0 0-10.815 5.2l10.815-5.2ZM134.5 120.235a6 6 0 0 0 10.815 5.201l-10.815-5.201Zm-16.26-68.552a6 6 0 1 0 7.344-9.49l-7.344 9.49Zm7.344 98.124a6 6 0 0 0-7.344-9.49l7.344 9.49ZM84 152c-30.928 0-56-25.072-56-56H16c0 37.555 30.445 68 68 68v-12ZM28 96c0-30.928 25.072-56 56-56V28c-37.555 0-68 30.445-68 68h12Zm106.5-24.235C138.023 79.09 140 87.306 140 96h12c0-10.532-2.399-20.522-6.685-29.436l-10.815 5.2ZM140 96c0 8.694-1.977 16.909-5.5 24.235l10.815 5.201C149.601 116.522 152 106.532 152 96h-12ZM84 40c12.903 0 24.772 4.357 34.24 11.683l7.344-9.49A67.733 67.733 0 0 0 84 28v12Zm34.24 100.317C108.772 147.643 96.903 152 84 152v12a67.733 67.733 0 0 0 41.584-14.193l-7.344-9.49Z"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="12"
      d="M161.549 58.776C166.965 70.04 170 82.666 170 96c0 13.334-3.035 25.96-8.451 37.223"
    />
  </svg>
);

const Review: React.FC = () => {
  const history = useHistory();
  const [currentStep, setCurrentStep] = useState(2);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // GCash payment modal state
  const [showGcashModal, setShowGcashModal] = useState(false);
  const [showRefundPolicyModal, setShowRefundPolicyModal] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isValidReference, setIsValidReference] = useState(false);
  const [referenceError, setReferenceError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationResult, setVerificationResult] = useState<
    "success" | "error" | null
  >(null);
  const [paymentVerificationMethod, setPaymentVerificationMethod] = useState<
    "reference" | "screenshot"
  >("reference");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get data from localStorage
  const [orderDetails, setOrderDetails] = useState({
    pickupDate: "",
    pickupTime: "",
    paymentMethod: "cash",
    gcashReference: "",
    pickupOption: "later",
  });

  // Helper function to upload GCash screenshot to Cloudinary
  const uploadImageToCloudinary = async (
    base64Image: string
  ): Promise<string> => {
    // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
    const imageData = base64Image.split(",")[1];

    // setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", `data:image/jpeg;base64,${imageData}`);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();
      console.log("Image uploaded successfully:", data);

      // Return the secure URL of the uploaded image
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      throw error;
    } finally {
      // setIsUploading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToastMessage("Image is too large. Maximum size is 5MB.");
        setShowToast(true);
        return;
      }

      // Check file type
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        setToastMessage("Please upload a valid image (JPEG or PNG).");
        setShowToast(true);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGcashSubmit = async () => {
    if (!isValidReference) {
      setToastMessage("Please enter a valid reference number");
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    setVerificationComplete(false);
    setVerificationResult(null);

    try {
      // Simulate verification process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Store in local storage
      localStorage.setItem("gcashReference", referenceNumber);
      localStorage.setItem("paymentMethod", "gcash");

      setIsLoading(false);
      setVerificationResult("success");
      setVerificationComplete(true);

      // Update the state to reflect the change
      setOrderDetails({
        ...orderDetails,
        paymentMethod: "gcash",
        gcashReference: referenceNumber,
      });
    } catch (error) {
      setIsLoading(false);
      setVerificationResult("error");
      setVerificationComplete(true);
      setToastMessage("Payment verification failed. Please try again.");
      setShowToast(true);
    }
  };

  const handleScreenshotSubmit = async () => {
    if (!selectedImage) {
      setToastMessage("Please upload a screenshot of your payment");
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    setVerificationComplete(false);
    setVerificationResult(null);

    try {
      // Simulate verification process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Store in local storage (just save "SCREENSHOT_UPLOADED" as a flag)
      localStorage.setItem("gcashReference", "SCREENSHOT_UPLOADED");
      localStorage.setItem("paymentMethod", "gcash");

      // Store the image in localStorage (in a real app, you'd upload to storage)
      localStorage.setItem("gcashScreenshot", selectedImage);

      setIsLoading(false);
      setVerificationResult("success");
      setVerificationComplete(true);

      // Update the state to reflect the change
      setOrderDetails({
        ...orderDetails,
        paymentMethod: "gcash",
        gcashReference: "SCREENSHOT_UPLOADED",
      });
    } catch (error) {
      setIsLoading(false);
      setVerificationResult("error");
      setVerificationComplete(true);
      setToastMessage("Screenshot submission failed. Please try again.");
      setShowToast(true);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeGcashModal = () => {
    setReferenceNumber(""); // Reset input when closing
    setSelectedImage(null); // Reset image when closing
    setIsValidReference(false);
    setReferenceError("");
    setVerificationComplete(false);
    setVerificationResult(null);
    setShowGcashModal(false);
  };

  // Force update when component becomes active
  useEffect(() => {
    // Function to update order details from localStorage
    const updateOrderDetails = () => {
      const pickupOptionFromStorage = localStorage.getItem("pickupOption");

      setOrderDetails({
        pickupDate: localStorage.getItem("pickupDate") || "",
        pickupTime: localStorage.getItem("pickupTime") || "",
        paymentMethod: localStorage.getItem("paymentMethod") || "cash",
        gcashReference: localStorage.getItem("gcashReference") || "",
        pickupOption: pickupOptionFromStorage === "now" ? "now" : "later",
      });
    };

    // Update initially
    updateOrderDetails();

    // Set up a polling interval to check for localStorage changes
    // This ensures we catch changes when navigating between pages
    const intervalId = setInterval(updateOrderDetails, 500);

    // Create a custom event for localStorage changes (for other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "paymentMethod" ||
        e.key === "gcashReference" ||
        e.key === "pickupDate" ||
        e.key === "pickupTime" ||
        e.key === "pickupOption"
      ) {
        updateOrderDetails();
      }
    };

    // Add event listener for storage changes
    window.addEventListener("storage", handleStorageChange);

    // Add event listener for when the component mounts/remounts
    const handleRouteChange = () => {
      updateOrderDetails();
    };

    // Use this to detect route changes (this is a hack but works)
    const originalPushState = history.push;
    history.push = (...args: Parameters<typeof originalPushState>) => {
      handleRouteChange();
      return originalPushState.apply(history, args);
    };

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
      history.push = originalPushState;
    };
  }, [history]);

  // Add useEffect to log orderDetails changes for debugging
  useEffect(() => {
    console.log("Order Details updated:", orderDetails);
  }, [orderDetails]);

  // Function to refresh cart items from Firebase based on selection in localStorage
  const refreshCartItems = () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Get selected items from localStorage
    const selectedItemsJson = localStorage.getItem("selectedCartItems");

    if (selectedItemsJson) {
      try {
        // First, immediately update from localStorage for instant feedback
        const selectedItems = JSON.parse(selectedItemsJson);

        // Set the cart items directly from localStorage
        setCartItems(selectedItems);
        setLoading(false);

        // Then, also refresh from Firestore to ensure data is current
        const cartRef = collection(db, "customers", user.uid, "cart");
        const unsubscribe = onSnapshot(cartRef, (querySnapshot) => {
          const firestoreItems: any[] = [];
          const selectedItemIds = selectedItems.map((item: any) => item.id);

          querySnapshot.forEach((doc) => {
            const item = { ...doc.data(), id: doc.id };
            // Only include items that were selected in the cart
            if (selectedItemIds.includes(item.id)) {
              firestoreItems.push(item);
            }
          });

          // Update with the latest data from Firestore
          setCartItems(firestoreItems);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error parsing selected items from localStorage:", error);
        setCartItems([]);
        setLoading(false);
      }
    } else {
      // If no selected items in localStorage, show empty cart
      setCartItems([]);
      setLoading(false);
    }
  };

  // Update cart items whenever component becomes visible or active
  useEffect(() => {
    // Initial load
    const unsubscribe = refreshCartItems();

    // Set up visibility change handler to refresh when navigating back to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshCartItems();
      }
    };

    // Set up focus handler to refresh when window regains focus
    const handleFocus = () => {
      refreshCartItems();
    };

    // Event for when the route changes within the app
    const handleRouteChange = () => {
      refreshCartItems();
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Use router history to detect navigation
    const originalPushState = history.push;
    history.push = (...args: Parameters<typeof originalPushState>) => {
      handleRouteChange();
      return originalPushState.apply(history, args);
    };

    // Clean up all listeners when component unmounts
    return () => {
      if (unsubscribe) unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("focus", handleFocus);
      history.push = originalPushState;
    };
  }, [history]);

  // Force refresh when coming back to this page
  useEffect(() => {
    // This will run when the component is focused
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") {
        // Force refresh state from localStorage
        const pickupOptionFromStorage = localStorage.getItem("pickupOption");

        // Update order details
        setOrderDetails({
          pickupDate: localStorage.getItem("pickupDate") || "",
          pickupTime: localStorage.getItem("pickupTime") || "",
          paymentMethod: localStorage.getItem("paymentMethod") || "cash",
          gcashReference: localStorage.getItem("gcashReference") || "",
          pickupOption: pickupOptionFromStorage === "now" ? "now" : "later",
        });

        // Re-fetch cart items when page becomes visible again
        refreshCartItems();
      }
    };

    document.addEventListener("visibilitychange", refreshOnFocus);
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      document.removeEventListener("visibilitychange", refreshOnFocus);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, []);

  // Calculate totals
  const subtotal = cartItems.reduce(
    (total, item) => total + item.productPrice,
    0
  );
  const discountPercentage = 0;
  const discountAmount = (subtotal * discountPercentage) / 100;
  const total = subtotal - discountAmount;

  // Generate a user-friendly order ID format
  const generateFormattedOrderId = (): string => {
    const now = new Date();

    // Format: BB250428-XXXX where:
    // BB = Bibingka (short prefix)
    // 250428 = Year, month, day (2-digit year)
    // XXXX = Random 4-digit number

    const year = now.getFullYear().toString().slice(2); // Last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Month (01-12)
    const day = now.getDate().toString().padStart(2, "0"); // Day (01-31)

    // Generate random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 1000-9999

    // return `ORD${year}${month}${day}-${randomNum}`;
    return `ORD-${randomNum}`;
  };

  const createOrder = async () => {
    const user = auth.currentUser;
    if (!user) {
      setToastMessage("Please login to place an order");
      setShowToast(true);
      return;
    }

    if (cartItems.length === 0) {
      setToastMessage("Your cart is empty");
      setShowToast(true);
      return;
    }

    setIsOrdering(true);

    try {
      // Get the customer data first
      const customerDocRef = doc(db, "customers", user.uid);
      const customerDoc = await getDoc(customerDocRef);
      const customerData = customerDoc.data();

      console.log("Customer data from Firestore:", customerData);

      // Extract customer name following the same logic as in inventory
      let customerName = "";

      if (customerData) {
        if (customerData.firstName && customerData.lastName) {
          // For users who registered directly with email/password
          customerName = `${customerData.firstName} ${customerData.lastName}`;
        } else if (customerData.name) {
          // For users who signed in with Google
          customerName = customerData.name;
        } else if (customerData.firstName) {
          customerName = customerData.firstName;
        } else if (customerData.displayName) {
          customerName = customerData.displayName;
        } else {
          customerName = "Customer";
        }
      } else {
        // Fallback if no customer data
        customerName =
          user.displayName || user.email?.split("@")[0] || "Customer";
      }

      console.log("Using customer name:", customerName);

      // Handle GCash screenshot upload if present
      let gcashData = orderDetails.gcashReference || null;
      let gcashScreenshotUrl = null;

      if (
        orderDetails.paymentMethod === "gcash" &&
        orderDetails.gcashReference === "SCREENSHOT_UPLOADED"
      ) {
        // Get the screenshot from localStorage
        const screenshot = localStorage.getItem("gcashScreenshot");

        if (screenshot) {
          try {
            // Upload to Cloudinary and get the URL
            gcashScreenshotUrl = await uploadImageToCloudinary(screenshot);
            console.log(
              "GCash screenshot uploaded to Cloudinary:",
              gcashScreenshotUrl
            );

            // Keep gcashReference as SCREENSHOT_UPLOADED
            gcashData = "SCREENSHOT_UPLOADED";
          } catch (error) {
            console.error("Failed to upload GCash screenshot:", error);
            setToastMessage(
              "Failed to upload payment screenshot. Please try again."
            );
            setShowToast(true);
            setIsOrdering(false);
            return;
          }
        }
      }

      // Calculate total amount
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.productPrice,
        0
      );

      // Set initial order status
      let orderStatus = "Order Confirmed"; // Technical status value
      let statusDisplay = "Order Confirmed"; // User-friendly display name
      let paymentStatus = "pending"; // All payments start as pending now

      // For GCash payments with pending verification, keep the special status
      if (orderDetails.paymentMethod === "gcash") {
        // If we have a screenshot or reference number, mark for verification
        orderStatus = "awaiting_payment_verification";
        statusDisplay = "Payment Pending"; // User-friendly display name
      }

      // Generate a user-friendly formatted order ID that will be used as the document ID
      const formattedOrderId = generateFormattedOrderId();
      setOrderId(formattedOrderId);

      // Create order data without the formattedOrderId field since it's now the document ID
      const orderData = {
        userId: user.uid,
        customerName: customerName,
        createdAt: serverTimestamp(),
        items: cartItems.map((item) => ({
          cartId: item.id,
          createdAt: item.createdAt,
          productSize: item.productSize,
          productVarieties: item.productVarieties || [],
          productQuantity: item.productQuantity || 1,
          productPrice: item.productPrice,
        })),
        orderDetails: {
          createdAt: new Date().toISOString(),
          gcashReference: gcashData,
          gcashScreenshotUrl: gcashScreenshotUrl,
          paymentMethod: orderDetails.paymentMethod,
          paymentStatus: paymentStatus,
          pickupDate: orderDetails.pickupDate,
          pickupTime: orderDetails.pickupTime,
          pickupOption: orderDetails.pickupOption,
          totalAmount: totalAmount,
          status: statusDisplay,
          orderStatus: orderStatus,
        },
      };

      // Log the final order data for debugging
      console.log("Saving order with data:", {
        userId: orderData.userId,
        customerName: orderData.customerName,
        itemCount: orderData.items.length,
        orderDetails: orderData.orderDetails,
      });

      // Use setDoc instead of addDoc to specify the document ID
      const ordersRef = collection(db, "orders");
      const orderDocRef = doc(ordersRef, formattedOrderId);
      await setDoc(orderDocRef, orderData);

      // Create notification with appropriate message
      let notificationMessage = `Your order #${formattedOrderId} has been placed successfully. `;

      if (orderDetails.paymentMethod === "cash") {
        if (orderDetails.pickupOption === "now") {
          notificationMessage +=
            "Please proceed to the payment counter to complete your purchase.";
        } else {
          notificationMessage +=
            "Please prepare the exact amount when picking up your order.";
        }
      } else {
        notificationMessage += "Your GCash payment is pending verification.";
      }

      // Use the correct way to access notifications collection
      const notificationsRef = collection(db, "orderNotifications");
      await addDoc(notificationsRef, {
        userId: user.uid,
        title: "Order Placed Successfully",
        message: notificationMessage,
        type: "success",
        createdAt: serverTimestamp(),
        isRead: false,
        orderId: formattedOrderId, // Use formatted ID here too
      });

      // Clear cart items
      const batch = writeBatch(db);
      cartItems.forEach((item) => {
        const cartItemRef = doc(db, "customers", user.uid, "cart", item.id);
        batch.delete(cartItemRef);
      });
      await batch.commit();

      // Log pickup details for debugging
      console.log("Order created with pickup details:", {
        date: orderDetails.pickupDate,
        time: orderDetails.pickupTime,
        option: orderDetails.pickupOption,
      });

      // Show confirmation modal
      setShowConfirmation(true);

      // Add local notification about order placement
      try {
        await notificationService.addNotification({
          title: "Order Placed Successfully",
          message: notificationMessage,
          type: "success",
          orderId: formattedOrderId, // Use formatted ID here too
        });
      } catch (error) {
        console.error("Error creating local notification:", error);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      setToastMessage("Failed to place order. Please try again.");
      setShowToast(true);
    } finally {
      setIsOrdering(false);
    }
  };

  // Handle GCash payment verification before placing order
  const handlePlaceOrder = () => {
    // If GCash payment method is selected and there's no reference, show payment modal
    if (
      orderDetails.paymentMethod === "gcash" &&
      !orderDetails.gcashReference
    ) {
      setShowGcashModal(true);
      return;
    }

    // Otherwise proceed with order placement
    createOrder();
  };

  // Function to download the GCash QR code
  const downloadQRCode = () => {
    const qrCodeElement = document.querySelector(
      ".gcash-qr"
    ) as HTMLImageElement;
    if (qrCodeElement && qrCodeElement.src) {
      // Create a temporary anchor element
      const downloadLink = document.createElement("a");
      downloadLink.href = qrCodeElement.src;
      downloadLink.download = "bbnka-gcash-qr.jpg"; // Set the filename
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Show toast message
      setToastMessage("QR Code downloaded successfully");
      setShowToast(true);
    } else {
      setToastMessage("Failed to download QR Code");
      setShowToast(true);
    }
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep((prevStep) => prevStep + 1);
      history.replace("/home/cart/schedule/payment/review");
    } else {
      handlePlaceOrder();
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);

    // Only clear localStorage after confirmation is dismissed
    localStorage.removeItem("pickupDate");
    localStorage.removeItem("pickupTime");
    localStorage.removeItem("paymentMethod");
    localStorage.removeItem("gcashReference");
    localStorage.removeItem("gcashScreenshot");
    localStorage.removeItem("pickupOption");
    localStorage.removeItem("status");

    history.push("/home");
  };

  // Force refresh when coming back to this page
  useEffect(() => {
    // This will run when the component is focused
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") {
        // Force refresh state from localStorage
        const pickupOptionFromStorage = localStorage.getItem("pickupOption");

        setOrderDetails({
          pickupDate: localStorage.getItem("pickupDate") || "",
          pickupTime: localStorage.getItem("pickupTime") || "",
          paymentMethod: localStorage.getItem("paymentMethod") || "cash",
          gcashReference: localStorage.getItem("gcashReference") || "",
          pickupOption: pickupOptionFromStorage === "now" ? "now" : "later",
        });
      }
    };

    document.addEventListener("visibilitychange", refreshOnFocus);
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      document.removeEventListener("visibilitychange", refreshOnFocus);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, []);

  // Load order details from localStorage on component mount
  useEffect(() => {
    const pickupDate = localStorage.getItem("pickupDate") || "";
    const pickupTime = localStorage.getItem("pickupTime") || "";
    const paymentMethod = localStorage.getItem("paymentMethod") || "cash";
    const gcashReference = localStorage.getItem("gcashReference") || "";
    const pickupOption =
      localStorage.getItem("pickupOption") === "now" ? "now" : "later";

    // Log the values we're loading to help with debugging
    console.log("Loading order details from localStorage:", {
      pickupDate,
      pickupTime,
      paymentMethod,
      pickupOption,
    });

    setOrderDetails({
      pickupDate,
      pickupTime,
      paymentMethod,
      gcashReference,
      pickupOption,
    });
  }, []);

  // badge color
  const getSizeColor = (sizeName: any): string => {
    // Handle case where sizeName is undefined or null
    if (!sizeName) {
      return "hsl(0, 0%, 50%)"; // Default gray color
    }

    // Handle case where sizeName is an object
    if (typeof sizeName === "object") {
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
    // Handle case where sizeName is undefined or null
    if (!sizeName) {
      return "N/A";
    }

    // Handle case where sizeName is an object
    if (typeof sizeName === "object") {
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

  // Helper function to parse and format a date from YYYY-MM-DD format
  const formatDateToDisplay = (dateString: string) => {
    if (!dateString) return "Not selected";

    try {
      // Check for date in YYYY-MM-DD format
      const date = dayjs(dateString);
      if (date.isValid()) {
        return date.format("dddd, MMMM D, YYYY");
      }
      return dateString;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original string if there's an error
    }
  };

  // Validate GCash reference number (basic validation)
  useEffect(() => {
    if (referenceNumber.trim() === "") {
      setIsValidReference(false);
      setReferenceError("");
      return;
    }

    // Check if input contains only digits
    if (!/^\d+$/.test(referenceNumber.trim())) {
      setIsValidReference(false);
      setReferenceError("Reference number should contain only digits");
      return;
    }

    // Check length
    const refLength = referenceNumber.trim().length;
    if (refLength < 13) {
      setIsValidReference(false);
      setReferenceError(
        `Reference number is too short (${refLength}/13 digits)`
      );
      return;
    }

    if (refLength > 13) {
      setIsValidReference(false);
      setReferenceError(
        `Reference number is too long (${refLength}/13 digits)`
      );
      return;
    }

    // If all checks pass
    setIsValidReference(true);
    setReferenceError("");

    // Force button state update
    const verifyButton = document.querySelector(
      ".verify-button"
    ) as HTMLIonButtonElement;
    if (verifyButton) {
      verifyButton.disabled = false;
    }
  }, [referenceNumber]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Review</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="checkout-progress-container">
          <CheckoutStepProgress currentStep={currentStep} />
        </div>
        <div className="review-container">
          {/* Order Summary Section */}
          <IonCard className="review-card">
            <IonCardHeader>
              <IonCardTitle>Items</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList lines="none" className="clean-list">
                {cartItems.map((item) => (
                  <IonItem key={item.id} className="review-item">
                    <IonLabel>
                      <div className="review-item-content">
                        <div className="review-item-header">
                          <IonBadge
                            className="size-badge"
                            style={{
                              backgroundColor: getSizeColor(item.productSize),
                            }}
                          >
                            {getSizeAbbreviation(item.productSize)}
                          </IonBadge>
                          <IonText className="review-item-name">
                            {typeof item.productSize === "object"
                              ? item.productSize.name
                              : item.productSize}
                          </IonText>
                        </div>
                        {Array.isArray(item.productVarieties) &&
                          item.productVarieties.length > 0 && (
                            <IonText className="review-varieties">
                              {item.productVarieties.join(", ")}
                            </IonText>
                          )}
                        <div className="review-item-footer">
                          <IonText className="review-quantity">
                            {item.productQuantity}{" "}
                            {item.productQuantity > 1 ? "items" : "item"}
                          </IonText>
                          <IonText className="review-price">
                            ₱{item.productPrice.toLocaleString()}
                          </IonText>
                        </div>
                      </div>
                    </IonLabel>
                  </IonItem>
                ))}

                <IonItem className="total-item">
                  <IonLabel>
                    <div className="total-content">
                      <div className="total-header">
                        <span className="total-label">Total</span>
                        <span className="total-amount">
                          ₱{total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </IonLabel>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Pickup & Payment Details Combined Section */}
          <IonCard className="review-card details-card">
            <IonCardHeader>
              <IonCardTitle>Order Details</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="details-section">
                <h4 className="section-subtitle">Pickup Information</h4>
                <div className="detail-item">
                  <IonIcon icon={calendarOutline} className="detail-icon" />
                  <div className="detail-content">
                    <div className="review-detail-label">Date</div>
                    <div className="detail-value">
                      {formatDateToDisplay(orderDetails.pickupDate)}
                    </div>
                  </div>
                </div>
                <div className="detail-item">
                  <IonIcon icon={timeOutline} className="detail-icon" />
                  <div className="detail-content">
                    <div className="review-detail-label">Time</div>
                    <div className="detail-value">
                      {orderDetails.pickupTime || "Not selected"}
                    </div>
                  </div>
                </div>
                <div className="detail-item">
                  <IonIcon icon={locationOutline} className="detail-icon" />
                  <div className="detail-content">
                    <div className="review-detail-label">Location</div>
                    <div className="detail-value">
                      102 Bonifacio Avenue, Cainta, 1900 Rizal
                    </div>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4 className="section-subtitle">Payment Information</h4>
                <div className="detail-item">
                  {orderDetails.paymentMethod === "gcash" ? (
                    <div className="detail-icon">
                      <GCashIcon />
                    </div>
                  ) : (
                    <IonIcon icon={cashOutline} className="detail-icon" />
                  )}
                  <div className="detail-content">
                    <div className="review-detail-label">Method</div>
                    <div className="detail-value">
                      {orderDetails.paymentMethod === "gcash"
                        ? "GCash"
                        : "Cash"}
                    </div>
                  </div>
                </div>
                {orderDetails.paymentMethod === "gcash" && (
                  <div className="detail-item">
                    <IonIcon icon={cardOutline} className="detail-icon" />
                    <div className="detail-content">
                      <div className="review-detail-label">
                        Payment Verification
                      </div>
                      <div className="detail-value">
                        {orderDetails.gcashReference ===
                        "SCREENSHOT_UPLOADED" ? (
                          <span className="screenshot-indicator">
                            <IonIcon icon={imageOutline} /> Screenshot Uploaded
                          </span>
                        ) : (
                          <span className="ref-number">
                            Reference #: {orderDetails.gcashReference}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="detail-item">
                  <IonIcon
                    icon={
                      orderDetails.pickupOption === "now"
                        ? storefront
                        : calendarOutline
                    }
                    className="detail-icon"
                  />
                  <div className="detail-content">
                    <div className="review-detail-label">Pickup Option</div>
                    <div className="detail-value">
                      {orderDetails.pickupOption === "now"
                        ? "Later"
                        : "Tomorrow"}
                    </div>
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <div className="modal-footer-buttons">
            <IonButton
              className="footer-back-action-button"
              routerLink="/home/cart/schedule/payment"
              fill="outline"
              disabled={isOrdering}
              onClick={() => {
                // No review-specific data to clear, but could be added here if needed
              }}
            >
              <IonIcon icon={chevronBack} slot="start" />
              Back
            </IonButton>

            <IonButton
              className="footer-action-button place-order-button"
              onClick={nextStep}
              disabled={isOrdering}
            >
              <IonIcon icon={checkmarkCircleSharp} slot="start" />
              {isOrdering
                ? "Processing..."
                : orderDetails.paymentMethod === "gcash" &&
                  !orderDetails.gcashReference
                ? "GCash Payment"
                : "Place Order"}
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="bottom"
        color={toastMessage.includes("successfully") ? "success" : "danger"}
      />

      {/* Loading indicator for Cloudinary upload */}
      <IonLoading
        isOpen={isUploading}
        message="Placing your order"
        spinner="circles"
      />

      <IonModal
        isOpen={showConfirmation}
        onDidDismiss={handleCloseConfirmation}
        className="review-order-confirmation-modal"
      >
        <div className="review-confirmation-modal">
          <div className="review-confirmation-header">
            <div className="review-result-icon">
              <IonIcon
                icon={checkmarkCircleSharp}
                className="review-success-icon"
              />
            </div>
            <h2>Order Placed Successfully</h2>
          </div>

          <div className="review-confirmation-content">
            <div className="compact-order-info">
              <p className="review-order-id">
                <strong>Order #</strong>
                <span className="order-id-value">{orderId}</span>
              </p>

              <div className="info-row">
                <div className="info-item">
                  <IonIcon icon={cardOutline} />
                  <span>
                    {orderDetails.paymentMethod === "gcash" ? "GCash" : "Cash"}
                  </span>
                </div>

                <div className="info-item">
                  <IonIcon
                    icon={
                      orderDetails.pickupOption === "now"
                        ? storefront
                        : calendarOutline
                    }
                  />
                  <span>
                    {orderDetails.pickupOption === "now" ? "Later" : "Tomorrow"}
                  </span>
                </div>
              </div>
            </div>

            <div className="compact-pickup-details">
              <div className="pickup-label">Pickup Details</div>
              <div className="pickup-row">
                <div className="pickup-date">
                  <IonIcon icon={calendarOutline} />
                  <span>{formatDateToDisplay(orderDetails.pickupDate)}</span>
                </div>
                <div className="pickup-time">
                  <IonIcon icon={timeOutline} />
                  <span>{orderDetails.pickupTime || "Not selected"}</span>
                </div>
              </div>
            </div>

            <div className="payment-instructions">
              {orderDetails.paymentMethod === "gcash" ? (
                <p className="instruction-text">
                  Your GCash payment is pending verification. We'll notify you
                  when confirmed.
                </p>
              ) : (
                <p className="instruction-text">
                  {orderDetails.pickupOption === "now"
                    ? "Please proceed to the payment counter to complete your purchase."
                    : "Please bring payment when you pick up your order at the scheduled time."}
                </p>
              )}

              {/* {orderDetails.pickupOption === "now" && (
                <p className="instruction-note">
                  Please wait at the store while your order is being prepared.
                </p>
              )} */}
            </div>
          </div>

          <div className="review-confirmation-actions">
            <IonButton
              expand="block"
              onClick={handleCloseConfirmation}
              className="home-return-button"
            >
              <IonIcon icon={home} slot="start" />
              Return to Home
            </IonButton>
          </div>
        </div>
      </IonModal>

      {/* No Refund Policy Modal */}
      {/* <IonModal
        isOpen={showRefundPolicyModal}
        onDidDismiss={() => setShowRefundPolicyModal(false)}
        className="refund-policy-modal"
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setShowRefundPolicyModal(false)}>
                <IonIcon className="close-btn" icon={close}></IonIcon>
              </IonButton>
            </IonButtons>
            <IonTitle>Payment Policy</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="refund-policy-content">
            <div className="policy-icon">
              <IonIcon icon={informationCircleOutline} color="danger" />
            </div>
            <h2>No Refund Policy</h2>
            <p>
              Please be informed that all payments made via GCash are{" "}
              <strong>non-refundable</strong>. Once a payment is completed, we
              cannot process any refunds.
            </p>
            <p>
              By proceeding with your GCash payment, you acknowledge and agree
              to this policy.
            </p>
            <div className="policy-buttons">
              <IonButton
                expand="block"
                className="confirm-button"
                onClick={() => {
                  setShowRefundPolicyModal(false);
                  setShowGcashModal(true);
                }}
              >
                I Accept
              </IonButton>
              <IonButton
                expand="block"
                fill="outline"
                className="cancel-button"
                onClick={() => setShowRefundPolicyModal(false)}
              >
                Cancel
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal> */}

      {/* GCash Payment Modal */}
      <IonModal
        isOpen={showGcashModal}
        onDidDismiss={closeGcashModal}
        className="gcash-modal"
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={closeGcashModal}>
                <IonIcon className="close-btn" icon={close}></IonIcon>
              </IonButton>
            </IonButtons>
            <IonTitle>GCash Payment</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div className="gcash-modal-content">
            {verificationComplete ? (
              <div
                className={`gcash-verification-result ${verificationResult}`}
              >
                <div className="gcash-result-icon">
                  {verificationResult === "success" ? (
                    <IonIcon icon={checkmarkCircle} />
                  ) : (
                    <IonIcon icon={closeCircle} />
                  )}
                </div>
                <IonText className="gcash-reference-number-message">
                  {verificationResult === "success"
                    ? paymentVerificationMethod === "reference"
                      ? "Reference Number Submitted!"
                      : "Payment Screenshot Submitted!"
                    : "Submission Failed"}
                </IonText>
                <p>
                  {verificationResult === "success"
                    ? paymentVerificationMethod === "reference"
                      ? "Your reference number has been submitted and is awaiting verification by our staff. Your order will be processed once payment is confirmed."
                      : "Your payment screenshot has been submitted and is awaiting verification by our staff. Your order will be processed once payment is confirmed."
                    : paymentVerificationMethod === "reference"
                    ? "We couldn't process your reference number. Please check the number and try again."
                    : "We couldn't process your screenshot. Please try again with a clearer image."}
                </p>
                {verificationResult === "error" ? (
                  <IonButton
                    expand="block"
                    onClick={() => setVerificationComplete(false)}
                    className="try-again-button"
                  >
                    Try Again
                  </IonButton>
                ) : (
                  <IonButton
                    expand="block"
                    onClick={() => {
                      // Close the modal
                      setShowGcashModal(false);

                      // Reset verification states for next time
                      setTimeout(() => {
                        setVerificationComplete(false);
                        setVerificationResult(null);
                      }, 300);

                      // Don't place the order immediately, let the user review and click Place Order
                    }}
                    className="continue-button"
                  >
                    Confirm Payment
                  </IonButton>
                )}
              </div>
            ) : (
              <>
                <div className="qr-container">
                  <img
                    src="../assets/gcash.jpg"
                    alt="GCash QR Code"
                    className="gcash-qr"
                  />
                  <IonText className="qr-instruction">
                    <p>Scan this QR code with your GCash app to pay</p>
                  </IonText>
                  <IonButton
                    fill="outline"
                    className="download-qr-button"
                    onClick={downloadQRCode}
                  >
                    <IonIcon icon={download} slot="start" />
                    Download QR Code
                  </IonButton>
                </div>

                <IonCard className="payment-account-details">
                  <IonCardHeader>
                    <IonCardTitle>Account Information</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList lines="none">
                      <IonItem>
                        <IonLabel>
                          <IonText>
                            <strong>Account Name:</strong> Aling Kika's
                          </IonText>
                        </IonLabel>
                      </IonItem>
                      <IonItem>
                        <IonLabel>
                          <IonText>
                            <strong>Account Number:</strong> +639608021774
                          </IonText>
                        </IonLabel>
                        <IonButton
                          slot="end"
                          fill="clear"
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText("+639608021774");
                            setToastMessage(
                              "Account number copied to clipboard"
                            );
                            setShowToast(true);
                          }}
                        >
                          <IonIcon slot="icon-only" icon={copyOutline} />
                        </IonButton>
                      </IonItem>
                    </IonList>
                  </IonCardContent>
                </IonCard>

                {/* Verification Options Message */}
                <div className="verification-options-message">
                  <IonIcon icon={informationCircleOutline} />
                  <p>
                    Choose one of the following options to verify your payment:
                  </p>
                </div>

                {/* Verification Method Segment */}
                <IonSegment
                  value={paymentVerificationMethod}
                  onIonChange={(e) =>
                    setPaymentVerificationMethod(
                      e.detail.value as "reference" | "screenshot"
                    )
                  }
                  className="verification-method-segment"
                >
                  <IonSegmentButton value="reference">
                    <IonIcon icon={keyOutline} />
                    <IonLabel>Reference #</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="screenshot">
                    <IonIcon icon={imageOutline} />
                    <IonLabel>Screenshot</IonLabel>
                  </IonSegmentButton>
                </IonSegment>

                {/* Reference Number Input */}
                {paymentVerificationMethod === "reference" && (
                  <>
                    <IonCard
                      className={`reference-card ${
                        isValidReference
                          ? "valid"
                          : referenceNumber
                          ? "invalid"
                          : ""
                      }`}
                    >
                      <IonCardContent>
                        <IonItem lines="none" className="reference-item">
                          <IonLabel
                            position="stacked"
                            color={
                              referenceError
                                ? "danger"
                                : isValidReference
                                ? "success"
                                : "medium"
                            }
                          >
                            Enter Reference Number
                            {isValidReference && (
                              <IonIcon
                                icon={checkmarkCircle}
                                color="success"
                                className="validation-icon"
                              />
                            )}
                          </IonLabel>
                          <IonInput
                            value={referenceNumber}
                            onIonInput={(e) =>
                              setReferenceNumber(e.detail.value || "")
                            }
                            placeholder="e.g., 1234567890123"
                            maxlength={13}
                            inputmode="numeric"
                            class={`reference-input ${
                              isValidReference ? "valid-reference" : ""
                            }`}
                            debounce={50}
                          />
                          {referenceError ? (
                            <IonText color="danger" className="error-message">
                              {referenceError}
                            </IonText>
                          ) : referenceNumber && !isValidReference ? (
                            <IonText
                              color="medium"
                              className="validation-message"
                            >
                              {`${referenceNumber.length}/13 digits required`}
                            </IonText>
                          ) : isValidReference ? (
                            <IonText
                              color="success"
                              className="validation-message"
                            >
                              Reference number format is valid
                            </IonText>
                          ) : null}
                          <IonText color="medium" className="hint-text">
                            You'll find your 13-digit reference number in your
                            GCash receipt
                          </IonText>
                        </IonItem>
                      </IonCardContent>
                    </IonCard>

                    {/* Custom verify button for reference number */}
                    <div className="verify-button-wrapper">
                      <IonButton
                        expand="block"
                        disabled={!isValidReference || isLoading}
                        onClick={handleGcashSubmit}
                        className={`verify-button ${
                          isValidReference ? "valid-button" : ""
                        }`}
                        style={
                          {
                            "--background": isValidReference
                              ? "var(--button-color)"
                              : "#ddd",
                            "--color": isValidReference ? "white" : "#999",
                            opacity: isValidReference ? 1 : 0.7,
                          } as any
                        }
                      >
                        {isLoading ? (
                          <>
                            <span className="verify-text">Submitting...</span>
                          </>
                        ) : (
                          "Submit Reference Number"
                        )}
                      </IonButton>
                    </div>
                  </>
                )}

                {/* Screenshot Upload */}
                {paymentVerificationMethod === "screenshot" && (
                  <>
                    <IonCard className="screenshot-card">
                      <IonCardContent>
                        <div className="screenshot-content">
                          {selectedImage ? (
                            <div className="screenshot-preview-container">
                              <img
                                src={selectedImage}
                                alt="Payment Screenshot"
                                className="screenshot-preview"
                              />
                              <IonButton
                                fill="clear"
                                className="remove-image-button"
                                onClick={removeImage}
                              >
                                <IonIcon icon={trash} color="danger" />
                              </IonButton>
                            </div>
                          ) : (
                            <div
                              className="screenshot-upload-container"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <IonIcon
                                icon={imageOutline}
                                className="upload-icon"
                              />
                              <h3>Upload Screenshot</h3>
                              <p>Tap to select a screenshot from your device</p>
                              <input
                                type="file"
                                accept="image/*"
                                hidden
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                              />
                            </div>
                          )}
                          <IonText color="medium" className="hint-text">
                            Please upload a clear screenshot of your GCash
                            payment receipt
                          </IonText>
                        </div>
                      </IonCardContent>
                    </IonCard>

                    {/* Submit screenshot button */}
                    <div className="verify-button-wrapper">
                      <IonButton
                        expand="block"
                        disabled={!selectedImage || isLoading}
                        onClick={handleScreenshotSubmit}
                        className={`verify-button ${
                          selectedImage ? "valid-button" : ""
                        }`}
                        style={
                          {
                            "--background": selectedImage
                              ? "var(--button-color)"
                              : "#ddd",
                            "--color": selectedImage ? "white" : "#999",
                            opacity: selectedImage ? 1 : 0.7,
                          } as any
                        }
                      >
                        {isLoading ? (
                          <>
                            <span className="verify-text">Submitting...</span>
                          </>
                        ) : (
                          "Submit Screenshot"
                        )}
                      </IonButton>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </IonContent>
      </IonModal>

      {/* Loading indicator */}
      <IonLoading
        isOpen={isLoading}
        message="Verifying payment..."
        duration={3000}
      />
    </IonPage>
  );
};

export default Review;
