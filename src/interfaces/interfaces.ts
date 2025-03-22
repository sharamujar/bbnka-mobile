export interface Product {
  id: string;
  category: string;
  name: string;
  description: string;
  size: string;
  varieties: string;
  price: number;
  imageUrl: string;
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
  id: string;
  name: string;
  dimensions: string;
  shape: string;
  slices: string;
  varieties: string[];
  price: number;
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

export interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  showToastMessage: (message: string, success: boolean) => void;
}
