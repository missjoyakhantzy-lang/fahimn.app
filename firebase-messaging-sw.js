// firebase-messaging-sw.js

// Firebase libraries import kar rahe hain (Compat versions for Service Worker)
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Aapka Firebase Messaging Config
firebase.initializeApp({
    apiKey: "AIzaSyAzuolDDiCoMWiJeSRmpo9my2DcxyBj_jA",
    authDomain: "messaging-d0a0c.firebaseapp.com",
    projectId: "messaging-d0a0c",
    storageBucket: "messaging-d0a0c.firebasestorage.app",
    messagingSenderId: "271709445992",
    appId: "1:271709445992:web:7a0c706288d88fee6a80dd",
    measurementId: "G-8M97W87HRW"
});

// Messaging initialize karna
const messaging = firebase.messaging();

// Background mein notification handle karne ke liye (Jab app band ho)
messaging.onBackgroundMessage(function(payload) {
    console.log('Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png' // Agar aapke paas logo.png hai toh, warna ise hata sakte hain
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
