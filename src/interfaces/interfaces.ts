export interface Product {
  id: string;
  category: string;
  name: string;
  description: string;
  size: string;
  varieties: string;
  price: number;
  imageURL: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Promotion {
  id: string;
  name: string;
  imageUrl: string;
}

export interface Size {
  sizeId: string;
  imageUrl: string;
  name: string;
  dimensions: string;
  shape: string;
  slices: string;
  varieties: string[];
  price: number;
  maxVarieties: number;
}

export interface Varieties {
  id: string;
  name: string;
  sizeId: string;
}

export interface CartItem {
  productName: string;
  productImg: string;
  productPrice: number;
  cartId: string;
  productSize: {
    name: string;
    details: string;
  };
  productVarieties: string[];
  productQuantity: number;
}

export interface StepProgressProps {
  currentStep: number;
}

export interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export interface BuildYourOwnModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToastMessage: (message: string, success: boolean) => void;
}
