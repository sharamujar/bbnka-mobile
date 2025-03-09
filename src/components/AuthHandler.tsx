import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect } from 'react'
import { useHistory } from 'react-router';
import { auth } from '../firebase-config';

const AuthHandler: React.FC = () => {
    const history = useHistory(); //for navigation

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // if user is signed in, navigate to home
                history.replace('/home');
            } else {
                // if user is signed out, navigate to login
                history.replace('/login');
            }
        });

        return () => unsubscribe();
    }, [history]);

    return null;
};

export default AuthHandler

// to remain users logged in even after refreshing the page