import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect } from "react";
import { useHistory } from "react-router";
import { auth } from "../firebase-config";

const AuthHandler: React.FC = () => {
  const history = useHistory(); // for navigation

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        history.replace("/home");
      } else {
        history.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [history]);

  // Return null to render nothing
  return null;
};

export default AuthHandler;
