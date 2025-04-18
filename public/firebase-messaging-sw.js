// Firebase Messaging Service Worker for background notifications
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBEz8A7DgKaSMW-BF2sU87BRyn_9KFCKgE",
  authDomain: "bbnka-mobile.firebaseapp.com",
  projectId: "bbnka-mobile",
  storageBucket: "bbnka-mobile.firebasestorage.app",
  messagingSenderId: "214639010070",
  appId: "1:214639010070:web:1662506c2f688760e3f037",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  console.log("Received background message:", payload);

  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/favicon.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
