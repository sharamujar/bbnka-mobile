import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase-config";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

interface AuthContextType {
  currentUser: User | null;
  isCustomer: boolean;
  isLoading: boolean;
  hasUnverifiedEmail: boolean; // Add this to track unverified email status
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCustomer, setIsCustomer] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasUnverifiedEmail, setHasUnverifiedEmail] = useState<boolean>(false);

  useEffect(() => {
    // Set up listener for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          // Check if this is a Google-authenticated user
          const isGoogleUser = user.providerData.some(
            (provider) => provider.providerId === "google.com"
          );

          // Check if email is verified or if it's a Google user (already verified)
          if (!user.emailVerified && !isGoogleUser) {
            // Check if a customer record exists in Firestore
            const customerDoc = await getDoc(doc(db, "customers", user.uid));

            // If the user exists in Firestore but email is not verified, set hasUnverifiedEmail to true
            if (customerDoc.exists()) {
              setHasUnverifiedEmail(true);
            } else {
              setHasUnverifiedEmail(false);
            }
          } else {
            setHasUnverifiedEmail(false);
          }

          // Check if the user is a customer
          const q = query(
            collection(db, "customers"),
            where("email", "==", user.email)
          );
          const querySnapshot = await getDocs(q);
          setIsCustomer(!querySnapshot.empty);
        } catch (error) {
          console.error("Error checking user status:", error);
          setIsCustomer(false);
          setHasUnverifiedEmail(false);
        }
      } else {
        setIsCustomer(false);
        setHasUnverifiedEmail(false);
      }

      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  // Register function
  const register = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    isCustomer,
    isLoading,
    hasUnverifiedEmail,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
